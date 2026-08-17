import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Teachers Development Training 2026 — IIUC × BARD',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--ivory-50,#faf7ef)] px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--forest-800,#1b4332)]">404</p>
      <h1 className="text-3xl font-extrabold text-[var(--charcoal-900,#201f1a)]">Page not found</h1>
      <p className="max-w-md text-base text-[var(--charcoal-700,#4a473e)]">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link to="/" className="mt-2 font-bold text-[var(--forest-800,#1b4332)] underline underline-offset-4">
        Back to the programme page
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
