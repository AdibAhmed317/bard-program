import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Bus,
  Download,
  FileText,
  Mail,
  MapPin,
  Menu,
  Phone,
  Pill,
  Shirt,
  Users,
  X,
} from 'lucide-react';

import logoUrl from '#/assets/logo.webp';
import heroFullUrl from '#/assets/herofull.webp';
import bardPhotoUrl from '#/assets/bard.jpg';

export const Route = createFileRoute('/')({ component: Home });

/* ---------------------------------- data ---------------------------------- */

const busScheduleUrl = '/bus-schedule.pdf';

const navLinks = [
  { href: '#programme', label: 'Programme' },
  { href: '#schedule', label: 'Schedule' },
  { href: '#guidelines', label: 'Guidelines' },
  { href: '#venue', label: 'Venue' },
  { href: '#contact', label: 'Contact' },
];

const stats = [
  { value: '03', label: 'Days' },
  { value: '01', label: 'Venue' },
  { value: '19 AUG', label: 'Departure' },
  { value: '100%', label: 'Participation' },
];

const journey = [
  { tag: '19 AUG · 4:00 PM', title: 'Departure', body: 'From IIUC Campus' },
  {
    tag: '19 AUG · 9:30 PM',
    title: 'Inaugural Session',
    body: 'BARD, Cumilla',
  },
  { tag: '20 AUG', title: 'Day 2', body: 'Lecture-I to Lecture-VI' },
  {
    tag: '21 AUG · 2:30 PM',
    title: 'Evaluation Test',
    body: 'Then prize giving & closing',
  },
  { tag: '21 AUG · 5:00 PM', title: 'Departure', body: 'To Chittagong' },
];

type ScheduleRow = {
  time: string;
  title: string;
  body?: string;
  highlight?: boolean;
};

type DayKey = 'day1' | 'day2' | 'day3';

const dayTabs: { key: DayKey; label: string; heading: string }[] = [
  {
    key: 'day1',
    label: 'Day 1 — 19 Aug',
    heading: '19/08/2026 Wednesday (Day – 1)',
  },
  {
    key: 'day2',
    label: 'Day 2 — 20 Aug',
    heading: '20/08/2026 Thursday (Day – 2)',
  },
  {
    key: 'day3',
    label: 'Day 3 — 21 Aug',
    heading: '21/08/2026 Friday (Day – 3)',
  },
];

// The programme as circulated by the Program Committee. `body` is the second
// line of the Event / Activity cell.
const schedules: Record<DayKey, ScheduleRow[]> = {
  day1: [
    { time: '4:00 PM', title: 'Departure from IIUC Campus' },
    { time: '7:30 PM', title: 'Reached the Training Venue' },
    { time: '8:00 PM', title: 'Boarding at Hostel, Solatul Isha & Dinner' },
    {
      time: '9:30 PM',
      title: 'Inaugural Session',
      body: "Prof. Dr. Mohammad Ali Azadi, Hon'ble VC, IIUC",
    },
    { time: '10:30 PM - 4:30 AM', title: 'Rest' },
  ],
  day2: [
    { time: '4:30 AM', title: 'Solatul Fazr' },
    { time: '7:00 AM', title: 'Breakfast and Preparation' },
    {
      time: '8:15 AM',
      title: 'Lecture I (Teaching from Holy Qur’an)',
      body: 'Prof. Dr. B. M. Mofizur Rahman al Azhari',
    },
    { time: '9:00 AM', title: 'Q&A on the Lecture-I' },
    {
      time: '9:20 AM',
      title: 'Lecture-II',
      body: "Prof. Dr. Muhammad Mahbubur Rahman, Hon'ble Treasurer, IIUC",
    },
    { time: '10:00 AM', title: 'Q&A on the Lecture-II' },
    { time: '10:15 AM', title: 'Tea Break & Networking' },
    {
      time: '10:45 AM',
      title: 'Lecture-III (Higher Studies & Scholarship)',
      body: 'Professor Mohammad Ismail, PhD, Former VC, NSTU',
    },
    { time: '11:45 AM', title: 'Q&A on the Lecture-III' },
    { time: '12:00 PM', title: 'Naseed from participants' },
    {
      time: '12:15 PM',
      title: 'Lecture-IV (IIUC Service rules - Relevant Provisions)',
      body: "Colonel Md. Quasem, PSC (Retd), Hon'ble Registrar, IIUC",
    },
    { time: '1:00 PM', title: 'Lunch and Prayer Break' },
    { time: '2:20 PM', title: 'Ready for Next session' },
    {
      time: '2:30 PM',
      title: 'Workshop [Brainstorming Session-30 mins / Presentation (5 mins)]',
    },
    {
      time: '3:10 PM',
      title: 'Lecture-V (Research & publication)',
      body: 'Professor Dr. Md. Atiar Rahman, Former Vice-chancellor, RSTU',
    },
    { time: '4:30 PM', title: 'Q&A on the Lecture-V' },
    {
      time: '4:45 PM',
      title:
        "Solatul As'r, Light Refreshment and Roaming around the Academy Compound",
    },
    {
      time: '7:00 PM',
      title: 'Lecture-VI',
      body: "Prof. Dr. Mohammad Hasmat Ali, Hon'ble Pro VC, IIUC",
    },
    { time: '8:00 PM', title: 'Prayer & Dinner' },
    { time: '9:15 PM - 10:30 PM', title: 'Perform as you like' },
  ],
  day3: [
    { time: '4:30 AM', title: 'Solatul Fazr' },
    { time: '7:00 AM', title: 'Breakfast and Preparation' },
    {
      time: '8:15 AM',
      title: 'Lecture-VII (Teaching from Hadith)',
      body: 'Dr. Md. Abul Kalam, Chairman, SHIS, IIUC',
    },
    {
      time: '9:00 AM',
      title: 'Lecture-VIII',
      body: 'Prof. Dr. Abu Bakr Rafique, Member - BoT, IIUC',
    },
    { time: '10:00 AM', title: 'Tea Break' },
    {
      time: '10:30 AM',
      title:
        'Lecture-IX (Teaching in Action: Morality, Ethics and Responsive Classrooms)',
      body: 'Professor Niaz Ahmed Khan, Ph.D., Former VC, Dhaka University',
    },
    { time: '12:15 PM', title: 'Solatul Jumua, and Lunch' },
    { time: '2:30 PM', title: 'Evaluation Test (Quiz)', highlight: true },
    { time: '3:00 PM', title: 'Reflection' },
    {
      time: '3:30 PM',
      title:
        'Prize Giving and Closing session with Vote of Thanks from the Program Convener',
    },
    { time: '4:30 PM', title: 'Prayer' },
    { time: '5:00 PM', title: 'Departure to Chittagong' },
  ],
};

const prepItems = [
  {
    icon: BadgeCheck,
    title: 'University ID',
    body: 'Bring your IIUC identification card.',
  },
  {
    icon: Shirt,
    title: 'Formal Attire',
    body: 'Maintain appropriate, professional dress throughout.',
  },
  {
    icon: Pill,
    title: 'Personal Essentials',
    body: 'Toiletries, medicines and other necessary items.',
  },
  {
    icon: BookOpen,
    title: 'Academic Materials',
    body: 'Any required academic materials or instruments.',
  },
  {
    icon: Users,
    title: 'Arrival',
    body: 'Be at the assembly point before departure.',
  },
];

const rules = [
  'Attendance is mandatory',
  'Be punctual',
  'Participate fully',
  'Keep phones silent during sessions',
  'Maintain professional conduct',
  'Complete the final assessment',
];

const moreRules = [
  'Follow the instructions of your Group Leader',
  'Maintain decent, formal attire at all sessions',
  'Communicate respectfully with trainers and peers',
  'Manage pending departmental duties before departure',
  'Take reasonable care of personal health and safety',
  'Remain with your group until the programme concludes',
];

// The full committee as recorded in the 14 July 2026 meeting minutes.
const organisingCommittee = [
  {
    name: 'Prof. Dr. Mohammad Hasmat Ali',
    role: 'Pro Vice Chancellor',
    status: 'Convener',
  },
  {
    name: 'Prof. Dr. Muhammad Mahbubur Rahman',
    role: 'Treasurer',
    status: 'Co-Convener',
  },
  {
    name: 'Prof. Dr. Mohammad Aktaruzzaman Khan',
    role: 'Director, IQAC',
    status: 'Member',
  },
  { name: 'Prof. Dr. Nazamul Hoque', role: 'Dean, FBS', status: 'Member' },
  { name: 'Prof. Md. Razu Ahmad', role: 'Dean, FSE', status: 'Member' },
  { name: 'Prof. Shamsul Alam', role: 'Professor, CSE', status: 'Member' },
  { name: 'Prof. Mostafa Munir Chy', role: 'Proctor', status: 'Member' },
  {
    name: 'Prof. Dr. Md. Azizul Hoque',
    role: 'Director, CRP',
    status: 'Member',
  },
  { name: 'Prof. Dr. Shariful Hoque', role: 'Chairman, EB', status: 'Member' },
  {
    name: 'Prof. Dr. Nazim Uddin',
    role: 'Chairman, Dept. of Finance',
    status: 'Member',
  },
  { name: 'Dr. Md. Abul Kalam', role: 'Chairman, SHIS', status: 'Member' },
  { name: 'Dr. Saiful Islam', role: 'Chairman, Law', status: 'Member' },
  {
    name: 'Mr. Jalal Uddin',
    role: 'Director (In charge), ITD',
    status: 'Member',
  },
  {
    name: 'Mr. Md. Mahfuzur Rahman',
    role: 'Director (In charge), IASWD',
    status: 'Member Secretary',
  },
];

// Sub-committees as formed at the 14 July 2026 meeting, in the order they are
// serialised in the minutes.
const subCommittees = [
  {
    label: 'Accommodation & Hospitality',
    people: [
      {
        name: 'Prof. Shamsul Alam',
        role: 'Professor, CSE',
        status: 'Convener',
      },
      {
        name: 'Mr. Md. Mahfuzur Rahman',
        role: 'Director (In charge), IASWD',
        status: 'Member',
      },
    ],
  },
  {
    label: 'Training Module & Resource Person',
    people: [
      {
        name: 'Prof. Dr. Mohammad Hasmat Ali',
        role: 'Pro Vice Chancellor',
        status: 'Convener',
      },
      {
        name: 'Prof. Engr. Md. Razu Ahmed',
        role: 'Dean, FSE',
        status: 'Member',
      },
      {
        name: 'Prof. Dr. Mohammad Akteruzzaman Khan',
        role: 'Director, IQAC',
        status: 'Member',
      },
      {
        name: 'Prof. Dr. Shariful Hoque',
        role: 'Chairman, EB',
        status: 'Member',
      },
      {
        name: 'Prof. Dr. Md. Azizul Hoque',
        role: 'Director, CRP',
        status: 'Member',
      },
    ],
  },
  {
    label: 'Transport',
    people: [
      {
        name: 'Prof. Dr. Mohammad Nazim Uddin',
        role: 'Chairman, Dept. of Finance',
        status: 'Convener',
      },
      {
        name: 'Dr. Saiful Islam',
        role: 'Chairman, Dept. of Law',
        status: 'Member',
      },
      {
        name: 'Mr. A.H.M. Kamruzzaman',
        role: 'Assistant Director, TMD',
        status: 'Member',
      },
    ],
  },
  {
    label: 'Information Technology',
    people: [
      {
        name: 'Mr. Jalal Uddin',
        role: 'Director (In charge), ITD',
        status: 'Convener',
      },
      {
        name: 'Engr. Farman Sikder',
        role: 'Asst. System Support Engineer',
        status: 'Member',
      },
      {
        name: 'Engr. Adib Ahmed',
        role: 'Sub-Assistant Programmer',
        status: 'Member',
      },
    ],
  },
  {
    label: 'Protocol & Reception',
    people: [
      { name: 'Prof. Mostafa Munir Chy', role: 'Proctor', status: 'Convener' },
      { name: 'Prof. Dr. Serajul Islam', role: 'Dean, FSS', status: 'Member' },
      {
        name: 'Mr. Mohammad Shyfur Rahman Chy',
        role: 'Asst. Proctor',
        status: 'Member',
      },
      {
        name: 'Mohammad Idris Chowdhury',
        role: 'PS to VC',
        status: 'Member',
      },
      {
        name: 'Mohammed Fayed',
        role: 'PS to ProVC',
        status: 'Member',
      },
    ],
  },
  {
    label: 'Program Kits & Crest',
    people: [
      {
        name: 'Prof. Dr. Mohammad Aminul Hoque',
        role: 'Chairman, DIS',
        status: 'Convener',
      },
      {
        name: 'Mr. Md. Ershadul Hoque',
        role: 'Additional Director, IASWD',
        status: 'Member',
      },
      { name: 'Md Ismail Hossain', status: 'Member' },
      { name: 'Md. Amjad Hossain', status: 'Member' },
    ],
    note: '5 Scout members will be needed as volunteers.',
  },
  {
    label: 'Program Committee',
    people: [
      {
        name: 'Prof. Dr. Md. Azizul Hoque',
        role: 'Director, CRP',
        status: 'Convener',
      },
      {
        name: 'Mr. Md. Mahfuzur Rahman',
        role: 'Director (In charge), IASWD',
        status: 'Member',
      },
    ],
  },
];

/* ------------------------------- scroll utils ------------------------------ */

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>;

function Reveal({
  children,
  className = '',
  delay = 0,
  style,
  ...rest
}: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

function Home() {
  return (
    <div className='min-h-screen bg-[var(--ivory-50)]'>
      <a href='#main-content' className='skip-link'>
        Skip to main content
      </a>
      <Header />
      <main id='main-content'>
        <Hero />
        <Letterhead />
        <Intro />
        <Stats />
        <Journey />
        <BusSchedule />
        <VenueFeature />
        <Schedule />
        <BeforeYouLeave />
        <Rules />
        <Committee />
        <FinalCta />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

/* --------------------------------- header ---------------------------------- */

function Header() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const dark = !scrolled && !open;
  return (
    <header className={`site-header ${scrolled || open ? 'is-solid' : ''}`}>
      <div className='wrap flex items-center justify-between gap-4 py-4'>
        <a
          href='#home'
          className='flex min-w-0 items-center gap-3 no-underline'
        >
          <img
            src={logoUrl}
            alt='IIUC crest'
            className='h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11'
          />
          <span className='min-w-0 leading-tight'>
            {/* The full university name wraps to three lines on a phone — show the
                familiar short form there and the full name from sm up. */}
            <span
              className={`block text-sm font-bold ${dark ? 'text-white' : 'text-[var(--charcoal-900)]'}`}
            >
              <span className='sm:hidden'>IIUC</span>
              <span className='hidden sm:inline'>
                International Islamic University Chittagong
              </span>
            </span>
            <span
              className={`block text-xs font-semibold tracking-wide ${dark ? 'text-white/70' : 'text-[var(--charcoal-500)]'}`}
            >
              Teachers Development Training 2026
            </span>
          </span>
        </a>

        <nav aria-label='Primary' className='hidden items-center gap-7 lg:flex'>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`nav-link ${dark ? 'text-white/85 hover:text-white' : 'text-[var(--charcoal-700)] hover:text-[var(--forest-900)]'}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href='/lookup'
          className={`hidden btn lg:inline-flex ${dark ? 'btn-outline-ivory' : 'btn-forest'}`}
        >
          Participant Information
        </a>

        <button
          type='button'
          className={`flex h-11 w-11 items-center justify-center rounded-full border lg:hidden ${dark ? 'border-white/40 text-white' : 'border-[var(--hairline)] text-[var(--charcoal-900)]'}`}
          aria-expanded={open}
          aria-controls='mobile-nav'
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>
      </div>

      {open && (
        <nav
          id='mobile-nav'
          aria-label='Mobile'
          className='border-t border-[var(--hairline)] bg-[var(--ivory-50)] lg:hidden'
        >
          <div className='wrap flex flex-col py-2'>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className='border-b border-[var(--hairline)] py-4 text-lg font-semibold text-[var(--charcoal-900)] last:border-b-0'
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href='/lookup'
              className='btn btn-forest mt-4 mb-2'
              onClick={() => setOpen(false)}
            >
              Participant Information
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

/* ---------------------------------- hero ------------------------------------ */

function Hero() {
  return (
    <section
      id='home'
      className='hero-scene grain relative flex min-h-[100svh] items-end overflow-hidden'
    >
      <img
        src={bardPhotoUrl}
        alt=''
        aria-hidden='true'
        className='absolute inset-0 h-full w-full object-cover'
        style={{ mixBlendMode: 'luminosity', opacity: 0.5 }}
      />
      <div className='hero-scrim' aria-hidden='true' />
      <div className='wrap relative z-10 flex flex-col gap-10 pb-16 pt-40 sm:pb-24 lg:flex-row lg:items-end lg:justify-between'>
        <div className='max-w-2xl'>
          <p
            className='hero-in text-xs font-bold uppercase tracking-[0.3em] text-[var(--brass-500)]'
            style={{ animationDelay: '80ms' }}
          >
            Teachers Development Programme · 2026
          </p>
          <h1
            className='hero-in mt-5 text-[clamp(2.75rem,7vw,6.25rem)] font-extrabold leading-[0.98] tracking-tight text-white'
            style={{ animationDelay: '160ms' }}
          >
            Teachers
            <br />
            Development
            <br />
            <span className='font-medium italic text-[var(--brass-500)]'>
              Training 2026
            </span>
          </h1>
          <p
            className='font-bn hero-in mt-4 text-lg text-white/60'
            style={{ animationDelay: '240ms' }}
          >
            শিক্ষক উন্নয়ন প্রশিক্ষণ ২০২৬
          </p>

          <div
            className='hero-in mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-white'
            style={{ animationDelay: '320ms' }}
          >
            <span className='text-lg font-bold tracking-wide'>
              20—21 AUGUST 2026
            </span>
            <span className='text-white/50'>·</span>
            <span className='text-lg font-bold tracking-wide'>
              BARD · CUMILLA
            </span>
          </div>
          <p
            className='hero-in mt-2 text-lg text-white/75'
            style={{ animationDelay: '360ms' }}
          >
            Three-Day Training Programme for Male Lecturers
          </p>

          <div
            className='hero-in mt-9 flex flex-wrap items-center gap-6'
            style={{ animationDelay: '440ms' }}
          >
            <a href='#programme' className='btn btn-ivory'>
              Explore Programme{' '}
              <ArrowRight className='h-5 w-5' strokeWidth={2.2} />
            </a>
            <a
              href='/lookup'
              className='text-link text-white/85 hover:text-white'
            >
              Participant Information
            </a>
          </div>
        </div>

        <div
          className='hero-in glass-panel w-full max-w-xs shrink-0 p-6 sm:p-7 lg:w-72'
          style={{ animationDelay: '520ms' }}
        >
          <div>
            <p className='text-xs font-bold uppercase tracking-[0.25em] text-[var(--brass-500)]'>
              19 Aug
            </p>
            <p className='mt-1 text-xl font-extrabold text-white'>Departure</p>
            <p className='text-base font-semibold text-white/70'>4:00 PM</p>
            <p className='text-sm font-semibold text-white/55'>IIUC Campus</p>
          </div>
          <div className='my-5 h-px bg-white/20' />
          <div>
            <p className='text-xs font-bold uppercase tracking-[0.25em] text-[var(--brass-500)]'>
              19—21 Aug
            </p>
            <p className='mt-1 text-xl font-extrabold text-white'>Programme</p>
            <p className='text-base font-semibold text-white/70'>
              BARD, Cumilla
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- letterhead ---------------------------------- */

function Letterhead() {
  return (
    <div className='border-b border-[var(--hairline)] bg-[var(--ivory-50)] py-10 sm:py-14'>
      <div className='wrap flex justify-center'>
        <img
          src={heroFullUrl}
          alt='International Islamic University Chittagong'
          className='h-auto w-full max-w-3xl object-contain'
        />
      </div>
    </div>
  );
}

/* --------------------------------- intro ------------------------------------ */

function Intro() {
  return (
    <section
      id='programme'
      aria-labelledby='intro-heading'
      className='wrap py-24 sm:py-32'
    >
      <Reveal className='grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8'>
        <div className='lg:col-span-5'>
          <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
            01 / The Programme
          </p>
          <h2
            id='intro-heading'
            className='mt-5 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.08] text-[var(--charcoal-900)]'
          >
            A focused three-day programme for academic development.
          </h2>
        </div>
        <div className='flex gap-6 lg:col-span-7 lg:col-start-6'>
          <div className='hidden w-px shrink-0 bg-[var(--hairline)] sm:block' />
          <div>
            <p className='max-w-xl text-lg leading-relaxed text-[var(--charcoal-700)]'>
              The Teachers Development Training brings IIUC&rsquo;s lecturers
              together for intensive learning, facilitated workshops, structured
              discussion and professional development — hosted away from campus,
              at the Bangladesh Academy for Rural Development.
            </p>
            <div className='mt-8 flex items-center gap-3 border-l-2 border-[var(--brass-600)] pl-4'>
              <p className='text-lg font-bold text-[var(--charcoal-900)]'>
                19—21 August 2026
                <span className='mx-2 text-[var(--charcoal-500)]'>·</span>
                BARD, Cumilla
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- stats ------------------------------------ */

function Stats() {
  return (
    <section
      aria-label='Programme numbers'
      className='border-y border-[var(--hairline)] bg-[var(--forest-900)]'
    >
      <div className='wrap grid grid-cols-2 divide-x divide-white/10 lg:grid-cols-4'>
        {stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 90}
            className='px-6 py-14 text-center sm:py-20'
          >
            <p className='stat-num text-[clamp(2.25rem,5vw,4rem)] font-extrabold text-white'>
              {s.value}
            </p>
            <p className='mt-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--brass-500)]'>
              {s.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- journey ------------------------------------ */

function Journey() {
  return (
    <section aria-labelledby='journey-heading' className='wrap py-24 sm:py-32'>
      <Reveal>
        <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
          02 / The Journey
        </p>
        <h2
          id='journey-heading'
          className='mt-4 text-[clamp(2rem,4vw,3.25rem)] font-extrabold text-[var(--charcoal-900)]'
        >
          From IIUC to BARD
        </h2>
      </Reveal>

      {/* desktop: horizontal route */}
      <div className='mt-16 hidden lg:block'>
        <div className='relative flex items-start justify-between'>
          <div
            className='journey-line absolute left-0 right-0 top-3'
            aria-hidden='true'
          />
          {journey.map((step, i) => (
            <Reveal
              key={step.tag + step.title}
              delay={i * 90}
              className='relative z-10 w-44 text-left'
            >
              <span
                className={`journey-dot block h-6 w-6 rounded-full ${step.title === 'Evaluation Test' ? 'is-accent' : ''}`}
              />
              <p className='mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--brass-600)]'>
                {step.tag}
              </p>
              <p className='mt-1 text-xl font-extrabold text-[var(--charcoal-900)]'>
                {step.title}
              </p>
              <p className='text-sm text-[var(--charcoal-500)]'>{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* mobile: vertical route */}
      <div className='relative mt-14 space-y-9 pl-9 lg:hidden'>
        <div
          className='journey-line-v absolute left-3 top-1 bottom-1'
          aria-hidden='true'
        />
        {journey.map((step, i) => (
          <Reveal
            key={step.tag + step.title}
            delay={i * 70}
            className='relative'
          >
            <span
              className={`journey-dot absolute -left-9 top-1 block h-6 w-6 rounded-full ${step.title === 'Evaluation Test' ? 'is-accent' : ''}`}
            />
            <p className='text-xs font-bold uppercase tracking-[0.2em] text-[var(--brass-600)]'>
              {step.tag}
            </p>
            <p className='mt-1 text-xl font-extrabold text-[var(--charcoal-900)]'>
              {step.title}
            </p>
            <p className='text-sm text-[var(--charcoal-500)]'>{step.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- bus schedule -------------------------------- */

function BusSchedule() {
  return (
    <section
      id='transport'
      aria-labelledby='transport-heading'
      className='motif-lattice relative overflow-hidden bg-[var(--forest-900)] py-20 sm:py-24'
    >
      <div className='wrap relative z-10 flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between'>
        <Reveal className='max-w-2xl'>
          <span className='inline-flex items-center gap-2 rounded-full bg-[var(--brass-500)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--forest-950)]'>
            <Bus className='h-4 w-4' strokeWidth={2.2} /> Transport
          </span>
          <h2
            id='transport-heading'
            className='mt-5 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-tight text-white'
          >
            Bus Schedule
          </h2>
          <p className='mt-4 text-lg leading-relaxed text-white/75'>
            Buses leave IIUC Kumira Campus at 4:00 PM on 19 August. Bus
            assignments and reporting details are published in the official
            schedule &mdash; check yours before departure day.
          </p>
        </Reveal>

        <Reveal delay={120} className='w-full shrink-0 lg:w-auto'>
          <div className='glass-panel p-6 sm:p-8'>
            <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--brass-500)]'>
              <FileText className='h-4 w-4' strokeWidth={2.2} /> PDF Document
            </p>
            <p className='mt-2 text-xl font-extrabold text-white'>
              Bus Schedule (TTP)
            </p>
            <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
              <a
                href={busScheduleUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='btn btn-ivory'
              >
                View Schedule{' '}
                <ArrowUpRight className='h-5 w-5' strokeWidth={2.2} />
              </a>
              <a
                href={busScheduleUrl}
                download='IIUC-TDP-2026-Bus-Schedule.pdf'
                className='btn btn-outline-ivory'
              >
                <Download className='h-5 w-5' strokeWidth={2.2} /> Download
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ venue feature -------------------------------- */

function VenueFeature() {
  return (
    <section
      id='venue'
      aria-labelledby='venue-heading'
      className='py-24 sm:py-32'
    >
      <div className='wrap grid grid-cols-1 items-center gap-0 lg:grid-cols-12'>
        <Reveal className='relative order-2 h-72 overflow-hidden sm:h-96 lg:order-1 lg:col-span-8 lg:h-[30rem]'>
          <img
            src={bardPhotoUrl}
            alt='The main gate of the Bangladesh Academy for Rural Development (BARD), Cumilla'
            className='h-full w-full object-cover'
          />
          <div
            className='pointer-events-none absolute inset-0'
            style={{
              background:
                'linear-gradient(0deg, rgba(12,35,24,0.55) 0%, transparent 40%)',
            }}
            aria-hidden='true'
          />
        </Reveal>

        <Reveal
          delay={120}
          className='relative z-10 order-1 -mb-0 lg:order-2 lg:col-span-5 lg:col-start-8 lg:-ml-16'
        >
          <div className='border-l-4 border-[var(--crimson-600)] bg-[var(--ivory-50)] p-8 shadow-[0_30px_60px_-30px_rgba(20,20,10,0.35)] sm:p-10 lg:shadow-none lg:ring-1 lg:ring-[var(--hairline)]'>
            <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
              The Venue
            </p>
            <h2
              id='venue-heading'
              className='mt-4 text-3xl font-extrabold leading-tight text-[var(--charcoal-900)] sm:text-4xl'
            >
              Bangladesh Academy for Rural Development
            </h2>
            <p className='mt-2 text-lg font-semibold text-[var(--charcoal-500)]'>
              Cumilla, Bangladesh
            </p>
            <p className='mt-5 text-base leading-relaxed text-[var(--charcoal-700)]'>
              Sessions are held in the air-conditioned Lalmai Auditorium, with
              cafeteria and other facilities made available to participants
              throughout the programme.
            </p>
            <p className='mt-4 text-base font-bold text-[var(--charcoal-900)]'>
              19—21 August 2026
            </p>
            <a
              href='https://www.google.com/maps/search/?api=1&query=Bangladesh+Academy+for+Rural+Development+Cumilla'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline-forest mt-7'
            >
              View Location{' '}
              <ArrowUpRight className='h-5 w-5' strokeWidth={2.2} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------- schedule ------------------------------------ */

function Schedule() {
  const [day, setDay] = useState<DayKey>('day1');
  const rows = schedules[day];
  const activeDay = dayTabs.find((tab) => tab.key === day) ?? dayTabs[0];
  return (
    <section
      id='schedule'
      aria-labelledby='schedule-heading'
      className='wrap py-24 sm:py-32'
    >
      <Reveal>
        <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
          03 / The Schedule
        </p>
        <h2
          id='schedule-heading'
          className='mt-4 text-[clamp(2rem,4vw,3.25rem)] font-extrabold text-[var(--charcoal-900)]'
        >
          Programme Schedule
        </h2>
        <p className='mt-3 max-w-xl text-lg text-[var(--charcoal-700)]'>
          Teachers&rsquo; Development Program 2026 — 19 – 21 August 2026, BARD,
          Cumilla.
        </p>
      </Reveal>

      <div
        className='mt-10 flex flex-wrap gap-3'
        role='tablist'
        aria-label='Select training day'
      >
        {dayTabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            role='tab'
            aria-selected={day === tab.key}
            className={`btn ${day === tab.key ? 'btn-forest' : 'btn-outline-forest'}`}
            onClick={() => setDay(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role='tabpanel' className='mt-8'>
        <p className='pb-4 text-sm font-bold uppercase tracking-[0.2em] text-[var(--brass-600)]'>
          {activeDay.heading}
        </p>
        {rows.map((row, i) => (
          <Reveal
            key={row.time + row.title}
            delay={i * 60}
            className={`schedule-row flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8 ${row.highlight ? 'is-highlight px-4 sm:px-6' : ''}`}
          >
            <p
              className={`w-40 shrink-0 text-2xl font-extrabold ${row.highlight ? 'text-[var(--crimson-600)]' : 'text-[var(--charcoal-900)]'}`}
            >
              {row.time}
            </p>
            <div>
              <p className='flex flex-wrap items-center gap-3 text-lg font-bold text-[var(--charcoal-900)]'>
                {row.title}
                {row.highlight && (
                  <span className='rounded-full bg-[var(--crimson-600)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white'>
                    Mandatory
                  </span>
                )}
              </p>
              {row.body && (
                <p className='mt-1 text-base text-[var(--charcoal-700)]'>
                  {row.body}
                </p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- before you leave -------------------------------- */

function BeforeYouLeave() {
  return (
    <section
      aria-labelledby='prep-heading'
      className='bg-[var(--ivory-100)] py-24 sm:py-32'
    >
      <div className='wrap'>
        <Reveal>
          <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
            04 / Preparation
          </p>
          <h2
            id='prep-heading'
            className='mt-4 text-[clamp(2rem,4vw,3.25rem)] font-extrabold text-[var(--charcoal-900)]'
          >
            Before You Leave
          </h2>
        </Reveal>

        <div className='mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-5'>
          {prepItems.map(({ icon: Icon, title, body }, i) => (
            <Reveal
              key={title}
              delay={i * 80}
              className={
                i === 0 ? 'sm:col-span-2 lg:col-span-2' : 'lg:col-span-1'
              }
            >
              <span className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--brass-600)]'>
                <Icon
                  className='h-7 w-7 text-[var(--forest-800)]'
                  strokeWidth={1.6}
                />
              </span>
              <p className='mt-5 text-xl font-extrabold text-[var(--charcoal-900)]'>
                {title}
              </p>
              <p className='mt-1 max-w-xs text-base leading-relaxed text-[var(--charcoal-700)]'>
                {body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- rules -------------------------------------- */

function Rules() {
  const [showAll, setShowAll] = useState(false);
  return (
    <section
      id='guidelines'
      aria-labelledby='rules-heading'
      className='motif-lattice relative bg-[var(--forest-950)] py-24 sm:py-32'
    >
      <div className='wrap relative z-10'>
        <Reveal>
          <h2
            id='rules-heading'
            className='text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold text-white'
          >
            A Few Things to Remember
          </h2>
        </Reveal>

        <div className='mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2'>
          {rules.map((r, i) => (
            <Reveal
              key={r}
              delay={i * 70}
              className='flex items-start gap-5 border-t border-white/15 pt-6'
            >
              <span className='text-2xl font-extrabold text-[var(--brass-500)]'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className='text-xl font-bold text-white'>{r}</p>
            </Reveal>
          ))}
          {showAll &&
            moreRules.map((r, i) => (
              <Reveal
                key={r}
                delay={i * 60}
                className='flex items-start gap-5 border-t border-white/15 pt-6'
              >
                <span className='text-2xl font-extrabold text-[var(--brass-500)]'>
                  {String(i + 7).padStart(2, '0')}
                </span>
                <p className='text-xl font-bold text-white'>{r}</p>
              </Reveal>
            ))}
        </div>

        <button
          type='button'
          className='text-link mt-12 text-lg text-[var(--brass-500)] hover:text-white'
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll
            ? 'Show fewer guidelines'
            : 'View all participant guidelines'}{' '}
          <ArrowRight className='h-5 w-5' strokeWidth={2.2} />
        </button>
      </div>
    </section>
  );
}

/* -------------------------------- committee ------------------------------------- */

function Committee() {
  return (
    <section
      aria-labelledby='committee-heading'
      className='wrap py-24 sm:py-32'
    >
      <Reveal>
        <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
          05 / The People
        </p>
        <h2
          id='committee-heading'
          className='mt-4 text-[clamp(2rem,4vw,3.25rem)] font-extrabold text-[var(--charcoal-900)]'
        >
          Organising Committee
        </h2>
      </Reveal>

      <Reveal className='mt-12'>
        <ol className='border-t border-[var(--hairline)]'>
          {organisingCommittee.map((m, i) => {
            const isOfficer = m.status !== 'Member';
            return (
              <li
                key={m.name}
                className='flex flex-col gap-1 border-b border-[var(--hairline)] py-4 sm:flex-row sm:items-baseline sm:gap-6'
              >
                <span className='shrink-0 text-sm font-bold tabular-nums text-[var(--charcoal-500)] sm:w-8'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className='flex-1 text-base leading-snug sm:text-lg'>
                  <span className='font-bold text-[var(--charcoal-900)]'>
                    {m.name}
                  </span>
                  <span className='text-[var(--charcoal-700)]'>, {m.role}</span>
                </span>
                <span
                  className={`shrink-0 text-xs font-bold uppercase tracking-[0.15em] sm:w-40 sm:text-right ${
                    isOfficer
                      ? 'text-[var(--crimson-600)]'
                      : 'text-[var(--charcoal-500)]'
                  }`}
                >
                  {m.status}
                </span>
              </li>
            );
          })}
        </ol>
      </Reveal>

      <Reveal delay={120} className='mt-16'>
        <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
          Sub-Committees
        </p>
      </Reveal>

      <div className='mt-8 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2'>
        {subCommittees.map((group, gi) => (
          <Reveal key={group.label} delay={(gi % 2) * 80}>
            <h3 className='text-lg font-extrabold text-[var(--charcoal-900)] sm:text-xl'>
              {group.label}
            </h3>
            <ul className='mt-3 border-t border-[var(--hairline)]'>
              {group.people.map((p) => (
                <li
                  key={p.name}
                  className='flex flex-col gap-0.5 border-b border-[var(--hairline)] py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4'
                >
                  <span className='min-w-0 leading-snug'>
                    <span className='font-semibold text-[var(--charcoal-900)]'>
                      {p.name}
                    </span>
                    {p.role && (
                      <span className='text-[var(--charcoal-700)]'>
                        , {p.role}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-bold uppercase tracking-[0.15em] ${
                      p.status === 'Convener'
                        ? 'text-[var(--crimson-600)]'
                        : 'text-[var(--charcoal-500)]'
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
            {group.note && (
              <p className='mt-3 text-sm italic text-[var(--charcoal-500)]'>
                {group.note}
              </p>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- final cta ------------------------------------- */

function FinalCta() {
  return (
    <section className='motif-lattice relative overflow-hidden bg-[var(--forest-900)] py-28 text-center sm:py-36'>
      <div className='wrap relative z-10'>
        <Reveal>
          <h2 className='text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold leading-[1.05] text-white'>
            Ready for the
            <br />
            Training Programme?
          </h2>
          <p className='mt-6 text-xl font-bold tracking-wide text-[var(--brass-500)]'>
            20—21 AUGUST 2026 · BARD · CUMILLA
          </p>
          <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
            <a href='/lookup' className='btn btn-ivory'>
              Participant Information{' '}
              <ArrowRight className='h-5 w-5' strokeWidth={2.2} />
            </a>
            <a href='#guidelines' className='btn btn-outline-ivory'>
              View Guidelines
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- contact --------------------------------------- */

function Contact() {
  return (
    <section
      id='contact'
      aria-labelledby='contact-heading'
      className='wrap py-24 sm:py-32'
    >
      <Reveal>
        <p className='text-xs font-bold uppercase tracking-[0.3em] text-[var(--crimson-600)]'>
          06 / Need Help?
        </p>
        <h2
          id='contact-heading'
          className='mt-4 text-[clamp(2rem,4vw,3.25rem)] font-extrabold text-[var(--charcoal-900)]'
        >
          Contact & Coordination
        </h2>
      </Reveal>

      <Reveal className='mt-12'>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-[var(--charcoal-500)]'>
          Programme Coordinator
        </p>
        <p className='mt-3 text-2xl font-extrabold text-[var(--charcoal-900)]'>
          Md. Mahfuzur Rahman
        </p>
        <p className='text-base text-[var(--charcoal-700)]'>
          Director (In-Charge), IASWD
        </p>
        <div className='mt-4 space-y-3'>
          <a
            href='tel:+8801711481579'
            className='flex items-center gap-3 text-lg font-bold text-[var(--forest-800)]'
          >
            <Phone className='h-5 w-5 shrink-0' strokeWidth={2} /> 01711481579
          </a>
          <a
            href='mailto:nakibmahfuz@gmail.com'
            className='flex items-center gap-3 break-all text-lg font-bold text-[var(--forest-800)] w-fit'
          >
            <Mail className='h-5 w-5 shrink-0' strokeWidth={2} />{' '}
            nakibmahfuz@gmail.com
          </a>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------- footer ---------------------------------------- */

function Footer() {
  return (
    <footer className='site-footer py-16'>
      <div className='wrap grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
        <div>
          <div className='flex items-center gap-3'>
            <img
              src={logoUrl}
              alt='IIUC crest'
              className='h-11 w-11 shrink-0 object-contain'
            />
            <div className='leading-tight'>
              <p className='font-extrabold text-white'>
                International Islamic University Chittagong
              </p>
              <p className='text-sm'>Teachers Development Training 2026</p>
            </div>
          </div>
          <p className='mt-4 flex items-center gap-2 text-sm'>
            <MapPin className='h-4 w-4 shrink-0' strokeWidth={1.8} /> Kumira
            Campus, Chattogram, Bangladesh
          </p>
        </div>

        <nav aria-label='Footer'>
          <p className='text-sm font-bold uppercase tracking-wide text-white'>
            Quick Links
          </p>
          <ul className='mt-3 space-y-2 text-sm'>
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
            <li>
              <a
                href={busScheduleUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2'
              >
                <Bus className='h-4 w-4 shrink-0' strokeWidth={1.8} /> Bus
                Schedule (PDF)
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className='text-sm font-bold uppercase tracking-wide text-white'>
            Governance
          </p>
          <p className='mt-3 flex items-center gap-2 text-sm'>
            <Bus className='h-4 w-4 shrink-0' strokeWidth={1.8} /> Convened by
            the Office of the Pro Vice Chancellor
          </p>
        </div>
      </div>
      <div className='wrap mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between'>
        <p>
          © 2026 International Islamic University Chittagong (IIUC). All rights
          reserved.
        </p>
        <a href='/admin/login' className='text-white/50 hover:text-white'>
          Admin Login
        </a>
      </div>
    </footer>
  );
}
