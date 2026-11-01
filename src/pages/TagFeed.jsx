import { Link, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard.jsx'
import { useStore } from '../store/StoreContext.jsx'

/** Posts filtered by a single tag. */
export default function TagFeed() {
  const { tag } = useParams()
  const { posts } = useStore()
  const decoded = decodeURIComponent(tag || '')
  const matches = posts.filter((post) => post.tags?.includes(decoded))

  return (
    <div className="page">
      <div className="tag-head">
        <div>
          <p className="muted">Tagged</p>
          <h1>#{decoded}</h1>
        </div>
        <Link className="btn btn--ghost btn--sm" to="/">
          Clear filter
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">#</span>
          <h2>No posts with this tag</h2>
          <p>Try another tag from the feed.</p>
          <Link className="btn btn--primary" to="/">
            Back to the feed
          </Link>
        </div>
      ) : (
        <div className="post-list">
          {matches.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
