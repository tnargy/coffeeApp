import { NavLink, Outlet } from 'react-router-dom'
import { resolvedTheme } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { APP_ROUTES } from '../routes.ts'

export function Layout() {
  const state = useAppState()
  const mocha = state != null && resolvedTheme(state.settings) === 'mocha'
  return (
    <div className="app" data-theme={mocha ? 'mocha' : undefined}>
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <strong>Coffee Roaster</strong>
            <small>Internal inventory</small>
          </div>
        </div>
        <nav>
          {APP_ROUTES.map((route) => (
            <NavLink key={route.path} to={route.path} end={route.path === '/'}>
              {route.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
