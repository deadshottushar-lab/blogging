import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import { formatDate, timeAgo } from '../lib/utils.js'
import { useStore } from '../store/StoreContext.jsx'

/**
 * Preview card for the post lists on the home and profile pages.
 */
export default function PostCard({ post, showAuthor = true }) {
  const { getAuthor, likesFor, commentsFor } = useStore()
  const author = getAuthor(post.authorId)
  const likeCount = likesFor(post.id).length
  const commentCount = commentsFor(post.id).length

  return (
    <article className="post-card">
      <div className="post-card__meta-top">
        <time dateTime={new Date(post.createdAt).toISOString()} title={formatDate(post.createdAt)}>
          {timeAgo(post.createdAt)}
        </time>
        {post.tags?.length > 0 && (
          <span className="post-card__tags">
            {post.tags.slice(0, 3).map((tag) => (
              <Link key={tag} className="tag" to={`/tag/${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            ))}
          </span>
        )}
      </div>

      <h2 className="post-card__title">
        <Link to={`/post/${post.slug}`}>{post.title}</Link>
      </h2>

      {post.coverImage && (
        <Link className="post-card__cover" to={`/post/${post.slug}`} tabIndex={-1} aria-hidden="true">
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.closest('.post-card__cover')?.classList.add('is-broken')
            }}
          />
        </Link>
      )}

      {post.excerpt && <p className="post-card__excerpt">{post.excerpt}</p>}

      <div className="post-card__footer">
        {showAuthor && author && (
          <Link className="author-chip" to={`/author/${author.username}`}>
            <Avatar user={author} size={32} />
            <span className="author-chip__name">{author.name}</span>
          </Link>
        )}
        <div className="post-card__stats" aria-label="Engagement">
          <span title={`${likeCount} likes`}>
            <HeartIcon filled={false} /> {likeCount}
          </span>
          <span title={`${commentCount} comments`}>
            <CommentIcon /> {commentCount}
          </span>
        </div>
      </div>
    </article>
  )
}

export function HeartIcon({ filled = false, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  )
}

export function CommentIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.9-.9L3 20.5l1.6-5A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" />
    </svg>
  )
}
