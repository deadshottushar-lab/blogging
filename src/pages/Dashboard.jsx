import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate, timeAgo } from '../lib/utils.js'
import { useStore } from '../store/StoreContext.jsx'

/**
 * "Your posts" dashboard: edit, delete and review engagement on your writing.
 */
export default function Dashboard() {
  const { user, postsBy, likesFor, commentsFor, deletePost } = useStore()

  const mine = useMemo(() => (user ? postsBy(user.id) : []), [user, postsBy])
  const [target, setTarget] = useState(null)
  const [error, setError] = useState('')

  const totals = useMemo(
    () =>
      mine.reduce(
        (acc, post) => ({
          likes: acc.likes + likesFor(post.id).length,
          comments: acc.comments + commentsFor(post.id).length,
        }),
        { likes: 0, comments: 0 },
      ),
    [mine, likesFor, commentsFor],
  )

  const confirmDelete = () => {
    try {
      deletePost(target.id)
      setTarget(null)
    } catch (err) {
      setError(err.message)
      setTarget(null)
    }
  }

  return (
    <div className="page">
      <div className="dashboard-head">
        <div className="dashboard-head__title">
          <Avatar user={user} size={56} />
          <div>
            <h1>Your posts</h1>
            <p className="muted">
              {mine.length} post{mine.length === 1 ? '' : 's'} · {totals.likes} like
              {totals.likes === 1 ? '' : 's'} · {totals.comments} comment
              {totals.comments === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link className="btn btn--primary" to="/write">
          New post
        </Link>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {mine.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">✎</span>
          <h2>Nothing published yet</h2>
          <p>Posts you publish will appear here so you can manage them.</p>
          <Link className="btn btn--primary" to="/write">
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="manage-table">
            <thead>
              <tr>
                <th scope="col">Post</th>
                <th scope="col">Published</th>
                <th scope="col">Likes</th>
                <th scope="col">Comments</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {mine.map((post) => (
                <tr key={post.id}>
                  <td className="manage-table__post">
                    <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    <span className="muted">
                      {(post.tags || []).map((tag) => `#${tag}`).join(' ') || 'no tags'}
                    </span>
                  </td>
                  <td>
                    <time
                      dateTime={new Date(post.createdAt).toISOString()}
                      title={formatDate(post.createdAt)}
                    >
                      {timeAgo(post.createdAt)}
                    </time>
                  </td>
                  <td>{likesFor(post.id).length}</td>
                  <td>{commentsFor(post.id).length}</td>
                  <td className="manage-table__actions">
                    <Link className="btn btn--ghost btn--sm" to={`/edit/${post.slug}`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => setTarget(post)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(target)}
        title="Delete this post?"
        onClose={() => setTarget(null)}
      >
        <p className="modal-copy">
          “{target?.title}” and its comments will be removed permanently. This cannot
          be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setTarget(null)}>
            Keep post
          </button>
          <button type="button" className="btn btn--danger" onClick={confirmDelete}>
            Delete forever
          </button>
        </div>
      </Modal>
    </div>
  )
}
