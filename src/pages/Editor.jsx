import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { renderMarkdown } from '../lib/markdown.js'
import { readingTime, validateImageUrl } from '../lib/utils.js'
import { useStore } from '../store/StoreContext.jsx'

/**
 * Create / edit composer with a live preview.
 * Used for both /write and /edit/:slug.
 */
export default function Editor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { getPostBySlug, createPost, updatePost, user } = useStore()

  const existing = slug ? getPostBySlug(slug) : null
  const forbidden = Boolean(existing && existing.authorId !== user?.id)

  const [title, setTitle] = useState(existing?.title || '')
  const [body, setBody] = useState(existing?.body || '')
  const [tagText, setTagText] = useState((existing?.tags || []).join(', '))
  const [cover, setCover] = useState(existing?.coverImage || '')
  const [tab, setTab] = useState('write')
  const [error, setError] = useState('')
  // 'idle' until the cover preview finishes loading, then 'ok' or 'failed'.
  const [coverStatus, setCoverStatus] = useState('idle')

  const preview = useMemo(() => renderMarkdown(body), [body])
  const tags = useMemo(
    () =>
      tagText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6),
    [tagText],
  )
  const coverError = useMemo(() => validateImageUrl(cover), [cover])

  // Editing someone else's post is not allowed.
  if (forbidden) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">!</span>
          <h2>Not your post</h2>
          <p>You can only edit posts you authored.</p>
          <Link className="btn btn--primary" to="/">
            Back to the feed
          </Link>
        </div>
      </div>
    )
  }

  const submit = (event) => {
    event.preventDefault()
    setError('')
    if (coverError) {
      setError(coverError)
      return
    }
    try {
      if (existing) {
        const saved = updatePost(existing.id, { title, body, tags, coverImage: cover })
        navigate(`/post/${saved?.slug ?? existing.slug}`, { replace: true })
      } else {
        const post = createPost({ title, body, tags, coverImage: cover })
        navigate(`/post/${post.slug}`, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const dirty = Boolean(title || body.trim() || cover.trim())

  return (
    <div className="page page--wide">
      <div className="editor-head">
        <div>
          <h1>{existing ? 'Edit post' : 'New post'}</h1>
          <p className="muted">
            {existing
              ? 'Changes update your published post immediately.'
              : 'Write in simple Markdown — headings, lists, code and links all work.'}
          </p>
        </div>
        <div className="editor-head__actions">
          <span className="muted">{readingTime(body)}</span>
          {dirty && (
            <Link className="btn btn--ghost btn--sm" to={existing ? `/post/${existing.slug}` : '/'}>
              Cancel
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <form className="editor" onSubmit={submit}>
        <input
          className="editor__title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Your post title"
          aria-label="Post title"
          maxLength={140}
          autoFocus={!existing}
        />

        <div className="editor__toolbar">
          <div className="segmented" role="tablist" aria-label="Editor mode">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'write'}
              className={tab === 'write' ? 'segmented__active' : ''}
              onClick={() => setTab('write')}
            >
              Write
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'preview'}
              className={tab === 'preview' ? 'segmented__active' : ''}
              onClick={() => setTab('preview')}
            >
              Preview
            </button>
          </div>

          <label className="editor__tags">
            <span className="muted">Tags</span>
            <input
              type="text"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="design, react, life"
              aria-label="Tags, comma separated"
            />
          </label>
        </div>

        {tags.length > 0 && (
          <div className="editor__tag-preview">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="editor__cover">
          <label className="editor__cover-field">
            <span className="muted">Cover image URL (optional)</span>
            <input
              type="url"
              value={cover}
              onChange={(event) => {
                setCover(event.target.value)
                setCoverStatus('idle')
              }}
              placeholder="https://images.example.com/my-post.jpg"
              aria-label="Cover image URL"
              aria-invalid={Boolean(coverError)}
              maxLength={2048}
            />
          </label>

          <div className="editor__cover-preview">
            {cover.trim() && !coverError && coverStatus !== 'failed' ? (
              <img
                key={cover.trim()}
                src={cover.trim()}
                alt=""
                onLoad={() => setCoverStatus('ok')}
                onError={() => setCoverStatus('failed')}
              />
            ) : (
              <span className="editor__cover-placeholder">
                {coverError
                  ? 'Invalid URL'
                  : coverStatus === 'failed'
                    ? 'Image not found'
                    : 'No image selected'}
              </span>
            )}
          </div>
        </div>

        {coverError && (
          <p className="field__error editor__cover-error" role="alert">
            {coverError}
          </p>
        )}

        {tab === 'write' ? (
          <textarea
            className="editor__body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={
              'Start writing…\n\n## A heading\n\nSome **bold** text and a [link](https://example.com).\n\n- a list item\n\n```\nconst hello = "world"\n```'
            }
            aria-label="Post content"
            rows={20}
          />
        ) : (
          <div className="editor__preview markdown-body">
            {body.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <p className="muted">Nothing to preview yet.</p>
            )}
          </div>
        )}

        <div className="editor__footer">
          <p className="muted">
            {title.trim() && body.trim() && !coverError
              ? 'Ready to publish.'
              : 'Add a title and some content to publish.'}
          </p>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={!title.trim() || !body.trim() || Boolean(coverError)}
          >
            {existing ? 'Save changes' : 'Publish post'}
          </button>
        </div>
      </form>
    </div>
  )
}
