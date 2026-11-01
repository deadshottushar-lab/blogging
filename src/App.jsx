import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Editor from './pages/Editor.jsx'
import AuthorProfile from './pages/AuthorProfile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import TagFeed from './pages/TagFeed.jsx'
import NotFound from './pages/NotFound.jsx'
import { useStore } from './store/StoreContext.jsx'

/** Wraps routes that require a signed-in account. */
function RequireAuth({ children }) {
  const { user } = useStore()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export default function App() {
  const { ready } = useStore()

  if (!ready) {
    return (
      <div className="boot" role="status">
        <span className="boot__spinner" aria-hidden="true" />
        Loading Inkwell…
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/author/:username" element={<AuthorProfile />} />
          <Route path="/tag/:tag" element={<TagFeed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/write"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/edit/:slug"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Inkwell</span>
        <span className="app-footer__dot" aria-hidden="true">·</span>
        <span>Write something worth reading.</span>
      </footer>
    </div>
  )
}
