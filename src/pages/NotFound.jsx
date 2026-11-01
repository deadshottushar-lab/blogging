import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <div className="empty-state">
        <span className="empty-state__icon" aria-hidden="true">404</span>
        <h1>Page not found</h1>
        <p>The page you were looking for doesn’t exist.</p>
        <Link className="btn btn--primary" to="/">
          Back to the feed
        </Link>
      </div>
    </div>
  )
}
