import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Modal from '../components/Modal.jsx'
import { CommentIcon, HeartIcon } from '../components/PostCard.jsx'
import { renderMarkdown } from '../lib/markdown.js'
import { formatDate, readingTime, timeAgo } from '../lib/utils.js'
import { useStore } from '../store/StoreContext.jsx'

/** Single post view with the comment thread and like control. */
export default function PostDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const {
    getPostBySlug,
    getAuthor,
    user,
    commentsFor,
    likesFor,
    hasLiked,
    toggleLike,
    addComment,
    deleteComment,
    deletePost,
  } = useStore()

  const post = getPostBySlug(slug)
  const [draft, setDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const author = post ? getAuthor(post.authorId) : null
  const comments = post ? commentsFor(post.id) : []
  const likeCount = post ? likesFor(post.id).length : 0
  const liked = post ? hasLiked(post.id) : false
  const isOwner = Boolean(post && user && user.id === post.authorId)

  useEffect(() => {
    if (post) document.title = `${post.title} — Lumen`
    return () => {
      document.title = 'Lumen — Blogging Platform'
    }
  }, [post])

  const html = useMemo(() => (post ? renderMarkdown(post.body) : ''), [post])

  if (!post) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">404</span>
          <h2>Post not found</h2>
          <p>It may have been deleted, or the link is wrong.</p>
          <Link className="btn btn--primary" to="/">
            Back to the feed
          </Link>
        </div>
      </div>
    )
  }

  const handleLike = () => {
    if (!user) {
      navigate('/login', { state: { from: `/post/${post.slug}` } })
      return
    }
    try {
      toggleLike(post.id)
    } catch (err) {
      setError(err.message)
    }
  }

  const submitComment = (event) => {
    event.preventDefault()
    setError('')
    if (!user) {
      navigate('/login', { state: { from: `/post/${post.slug}` } })
      return
    }
    try {
      addComment(post.id, draft)
      setDraft('')
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmDeletePost = () => {
    try {
      deletePost(post.id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="page page--narrow">
      <Link className="back-link" to="/">
        ← Back to feed
      </Link>

      <article className="post-article">
        <header className="post-article__header">
          <div className="post-article__tags">
            {(post.tags || []).map((tag) => (
              <Link key={tag} className="tag" to={`/tag/${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            ))}
          </div>

          <h1 className="post-article__title">{post.title}</h1>

          <div className="post-article__byline">
            {author && (
              <Link className="author-chip" to={`/author/${author.username}`}>
                <Avatar user={author} size={44} />
                <span>
                  <strong>{author.name}</strong>
                  <small>@{author.username}</small>
                </span>
              </Link>
            )}
            <div className="post-article__meta">
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatDate(post.createdAt)}
              </time>
              <span aria-hidden="true">·</span>
              <span>{readingTime(post.body)}</span>
              {post.updatedAt !== post.createdAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>edited {timeAgo(post.updatedAt)}</span>
                </>
              )}
            </div>
          </div>

          {post.coverImage && (
            <div className="post-article__cover">
              <img
                src={post.coverImage}
                alt=""
                onError={(event) => {
                  event.currentTarget.closest('.post-article__cover')?.classList.add('is-broken')
                }}
              />
            </div>
          )}

          {isOwner && (
            <div className="post-article__actions">
              <Link className="btn btn--ghost btn--sm" to={`/edit/${post.slug}`}>
                Edit
              </Link>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            </div>
          )}
        </header>

        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}

        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="post-article__footer">
          <button
            type="button"
            className={`like-btn ${liked ? 'like-btn--active' : ''}`}
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Remove your like' : 'Like this post'}
          >
            <HeartIcon filled={liked} size={20} />
            <span>{liked ? 'Liked' : 'Like'}</span>
            <span className="like-btn__count">{likeCount}</span>
          </button>

          <a className="jump-comments" href="#comments">
            <CommentIcon size={18} /> {comments.length} comment
            {comments.length === 1 ? '' : 's'}
          </a>
        </footer>
      </article>

      <section className="comments" id="comments" aria-labelledby="comments-heading">
        <h2 id="comments-heading">
          Discussion <span className="muted">({comments.length})</span>
        </h2>

        {user ? (
          <form className="comment-form" onSubmit={submitComment}>
            <Avatar user={user} size={38} />
            <div className="comment-form__body">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Add to the discussion…"
                rows={3}
                aria-label="Write a comment"
              />
              <div className="comment-form__actions">
                <span className="muted">{500 - draft.length} characters left</span>
                <button
                  className="btn btn--primary btn--sm"
                  type="submit"
                  disabled={!draft.trim() || draft.length > 500}
                >
                  Comment
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="comment-signin">
            <Link to="/login">Sign in</Link> to join the discussion.
          </p>
        )}

        <ul className="comment-list">
          {comments.map((comment) => {
            const commentAuthor = getAuthor(comment.authorId)
            const canDelete =
              user && (user.id === comment.authorId || isOwner)
            return (
              <li key={comment.id} className="comment">
                <Avatar user={commentAuthor} size={36} />
                <div className="comment__body">
                  <div className="comment__meta">
                    <Link
                      className="comment__author"
                      to={commentAuthor ? `/author/${commentAuthor.username}` : '#'}
                    >
                      {commentAuthor?.name || 'Unknown'}
                    </Link>
                    <time dateTime={new Date(comment.createdAt).toISOString()}>
                      {timeAgo(comment.createdAt)}
                    </time>
                  </div>
                  <p className="comment__text">{comment.body}</p>
                  {canDelete && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        try {
                          deleteComment(comment.id)
                        } catch (err) {
                          setError(err.message)
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <Modal
        open={confirmDelete}
        title="Delete this post?"
        onClose={() => setConfirmDelete(false)}
      >
        <p className="modal-copy">
          “{post.title}” and its {comments.length} comment
          {comments.length === 1 ? '' : 's'} will be removed permanently.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setConfirmDelete(false)}
          >
            Keep post
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={confirmDeletePost}
          >
            Delete forever
          </button>
        </div>
      </Modal>
    </div>
  )
}
