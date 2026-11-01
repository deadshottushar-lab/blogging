import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import { useStore } from '../store/StoreContext.jsx'
import { useTheme } from '../store/ThemeContext.jsx'

/** Top navigation bar: brand, primary links, auth controls, theme toggle. */
export default function Navbar({ onSearch }) {
  const { user, logout, posts } = useStore()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const submitSearch = (event) => {
    event.preventDefault()
    if (onSearch) onSearch(query)
    else navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/')
    setMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="brand" aria-label="Inkwell home">
          <span className="brand__mark" aria-hidden="true">✎</span>
          <span className="brand__name">Inkwell</span>
        </Link>

        <form className="navbar__search" role="search" onSubmit={submitSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={posts.length ? `Search ${posts.length} posts…` : 'Search posts…'}
            aria-label="Search posts"
          />
        </form>

        <nav className="navbar__links" aria-label="Primary">
          <Link to="/">Feed</Link>
          {user && (
            <Link className="btn btn--primary btn--sm" to="/write">
              Write
            </Link>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? '◐' : '◑'}
          </button>

          {user ? (
            <div className="navbar__user">
              <button
                type="button"
                className="avatar-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <Avatar user={user} size={34} />
              </button>
              {menuOpen && (
                <>
                  <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
                  <div className="menu" role="menu">
                    <div className="menu__header">
                      <strong>{user.name}</strong>
                      <span>@{user.username}</span>
                    </div>
                    <Link role="menuitem" to={`/author/${user.username}`} onClick={() => setMenuOpen(false)}>
                      Your profile
                    </Link>
                    <Link role="menuitem" to="/dashboard" onClick={() => setMenuOpen(false)}>
                      Your posts
                    </Link>
                    <Link role="menuitem" to="/settings" onClick={() => setMenuOpen(false)}>
                      Settings
                    </Link>
                    <button role="menuitem" type="button" className="menu__danger" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="navbar__auth">
              <Link className="btn btn--ghost btn--sm" to="/login">
                Log in
              </Link>
              <Link className="btn btn--primary btn--sm" to="/register">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
