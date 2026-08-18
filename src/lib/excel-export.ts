import type { Workbook, Worksheet } from 'exceljs'

const HEADER_BG = 'FF1B4332' // forest green, matches the site
const HEADER_FG = 'FFFAF7EF' // ivory

type Column = { header: string; width: number }

/**
 * Excel caps sheet names at 31 chars, forbids : \ / ? * [ ], and requires them
 * to be unique. Department names here run past that, so truncate and
 * de-duplicate or Excel rejects the workbook as corrupt.
 */
function toSheetName(raw: string, used: Set<string>) {
  const base = (raw.replace(/[:\\/?*[\]]/g, '-').trim() || 'Unassigned').slice(0, 31)
  let candidate = base
  let n = 2
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`
    candidate = base.slice(0, 31 - suffix.length) + suffix
  }
  used.add(candidate.toLowerCase())
  return candidate
}

function addSheet(wb: Workbook, name: string, columns: Column[], rows: unknown[][]) {
  const ws: Worksheet = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = columns.map((c) => ({ header: c.header, width: c.width }))

  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: HEADER_FG } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
  header.alignment = { vertical: 'middle' }
  header.height = 20

  rows.forEach((r) => ws.addRow(r))
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  return ws
}

/**
 * ExcelJS ships as CJS, so Node's ESM interop puts the real export on `default`
 * while some bundlers hoist the named exports onto the namespace itself.
 * Loaded on demand — it's only needed when someone actually exports.
 */
async function loadExcelJS() {
  type ExcelJSModule = { Workbook: new () => Workbook }
  const mod = (await import('exceljs')) as unknown as ExcelJSModule & { default?: ExcelJSModule }
  return mod.default ?? mod
}

function toBlob(buffer: ArrayBuffer | Buffer) {
  return new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/* ------------------------------- participants ------------------------------ */

export type ExportRow = {
  name: string
  idCardNo: string | null
  designation: string | null
  department: string | null
  phone: string | null
  email: string | null
  groupLeader: string | null
  roomNumber: string | null
}

const PARTICIPANT_COLUMNS: Column[] = [
  { header: 'SL', width: 6 },
  { header: 'Teacher ID', width: 13 },
  { header: 'Name', width: 34 },
  { header: 'Designation', width: 18 },
  { header: 'Department', width: 36 },
  { header: 'Phone', width: 26 },
  { header: 'Email', width: 32 },
  { header: 'Group Leader', width: 20 },
  { header: 'Room', width: 10 },
]

export async function buildParticipantsWorkbook(
  all: ExportRow[],
  departments: string[],
): Promise<Blob> {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()

  const sheet = (name: string, list: ExportRow[]) => {
    const ws = addSheet(
      wb,
      name,
      PARTICIPANT_COLUMNS,
      list.map((p, i) => [
        i + 1,
        p.idCardNo ?? '',
        p.name,
        p.designation ?? '',
        p.department ?? '',
        p.phone ?? '',
        p.email ?? '',
        p.groupLeader ?? '',
        p.roomNumber ?? '',
      ]),
    )
    // Keep IDs and phone numbers as text so they don't render as 1.86E+10.
    ws.getColumn(2).numFmt = '@'
    ws.getColumn(6).numFmt = '@'
  }

  const used = new Set<string>()
  sheet(toSheetName('All Participants', used), all)

  // One sheet per department, so a chairman can be handed just their own list.
  for (const dept of departments) {
    sheet(toSheetName(dept, used), all.filter((p) => p.department === dept))
  }
  const unassigned = all.filter((p) => !p.department)
  if (unassigned.length > 0) sheet(toSheetName('No Department', used), unassigned)

  return toBlob(await wb.xlsx.writeBuffer())
}

/* -------------------------------- attendance ------------------------------- */

export type AttendanceRow = {
  name: string
  department: string | null
  roomNumber: string | null
  status: 'present' | 'absent' | null
}

const ATTENDANCE_COLUMNS: Column[] = [
  { header: 'SL', width: 6 },
  { header: 'Name', width: 34 },
  { header: 'Department', width: 36 },
  { header: 'Room', width: 10 },
  { header: 'Status', width: 14 },
]

const STATUS_COL = 5

// Same soft tints the status pills use in the admin UI.
const STATUS_STYLE = {
  present: { bg: 'FFE3EDE5', fg: 'FF1B4332' },
  absent: { bg: 'FFFBEBEC', fg: 'FF7F2430' },
} as const

/** One sheet per training day, in a single workbook. */
export async function buildAttendanceWorkbook(
  days: { label: string; rows: AttendanceRow[] }[],
): Promise<Blob> {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  const used = new Set<string>()

  for (const day of days) {
    const ws = addSheet(
      wb,
      toSheetName(day.label, used),
      ATTENDANCE_COLUMNS,
      day.rows.map((r, i) => [
        i + 1,
        r.name,
        r.department ?? '',
        r.roomNumber ?? '',
        r.status ? r.status[0].toUpperCase() + r.status.slice(1) : 'Not marked',
      ]),
    )

    day.rows.forEach((r, i) => {
      if (!r.status) return
      const style = STATUS_STYLE[r.status]
      const cell = ws.getCell(i + 2, STATUS_COL) // +2: row 1 is the header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } }
      cell.font = { bold: true, color: { argb: style.fg } }
    })
  }

  return toBlob(await wb.xlsx.writeBuffer())
}

/* --------------------------------- download -------------------------------- */

/**
 * The anchor must be in the document for click() to trigger a download in
 * Firefox, and the object URL has to outlive the click — revoking it
 * synchronously cancels the download in Chrome.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
