export type IconName = 'leaf' | 'bean' | 'bag' | 'dollar' | 'clock' | 'alert' | 'cup' | 'chart' | 'bolt'

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'leaf' ? (
        <>
          <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
          <path d="M8 16c2.2-2.6 4.8-5 8.5-7" />
        </>
      ) : null}
      {name === 'bean' ? (
        <>
          <path d="M8 4.5c-3 3.2-3.2 8.2-1.2 13.2 3.2-.6 6.2-.2 9.2 1.8 1.4-5.6.6-11.2-3.2-14.4-1.6-1.2-3.4-1.4-4.8-.6z" />
          <path d="M9 9c1.6 1.8 2.4 4 2.6 7" />
        </>
      ) : null}
      {name === 'bag' ? (
        <>
          <path d="M7 8h10l-1 12H8L7 8z" />
          <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </>
      ) : null}
      {name === 'dollar' ? (
        <>
          <path d="M12 3v18" />
          <path d="M16 7.2c0-1.6-1.8-2.7-4-2.7s-4 1.1-4 2.7 1.7 2.5 4 2.9 4 1.3 4 2.9-1.8 2.7-4 2.7-4-1.1-4-2.7" />
        </>
      ) : null}
      {name === 'clock' ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </>
      ) : null}
      {name === 'alert' ? (
        <>
          <path d="M12 4 20 18H4L12 4z" />
          <path d="M12 10v4" />
          <path d="M12 16.5h.01" />
        </>
      ) : null}
      {name === 'cup' ? (
        <>
          <path d="M6 8h10v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8z" />
          <path d="M16 9h2.2a2.2 2.2 0 0 1 0 4.4H16" />
          <path d="M8 20h8" />
        </>
      ) : null}
      {name === 'chart' ? (
        <>
          <path d="M4 19h16" />
          <path d="M7 16v-4" />
          <path d="M12 16V8" />
          <path d="M17 16v-6" />
        </>
      ) : null}
      {name === 'bolt' ? <path d="M13 3 6 13h5l-1 8 7-10h-5l1-8z" /> : null}
    </svg>
  )
}
