import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PostCard from '../components/PostCard.jsx'
import { useStore } from '../store/StoreContext.jsx'

const SORTS = [
  { id: 'new', label: 'Newest' },
  { id: 'top', label: 'Most liked' },
  { id: 'discussed', label: 'Most discussed' },
]

/** The main feed: search, tag filter and sorting. */
export default function Home() {
  const { posts, likesFor, commentsFor, getAuthor, ready } = useStore()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState('new')

  const query = params.get('q') || ''
  const activeTag = params.get('tag') || ''

  const setQuery = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const setTag = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('tag', value)
    else next.delete('tag')
    setParams(next, { replace: true })
  }

  const visible = useMemo(() => {
    let list = [...posts]

    if (activeTag) {
      list = list.filter((post) => post.tags?.includes(activeTag))
    }

    const needle = query.trim().toLowerCase()
    if (needle) {
      list = list.filter((post) => {
        const author = getAuthor(post.authorId)
        return (
          post.title.toLowerCase().includes(needle) ||
          (post.excerpt || '').toLowerCase().includes(needle) ||
          (post.tags || []).some((tag) => tag.includes(needle)) ||
          (author?.name || '').toLowerCase().includes(needle) ||
          (author?.username || '').includes(needle)
        )
      })
    }

    if (sort === 'top') {
      list.sort((a, b) => likesFor(b.id).length - likesFor(a.id).length)
    } else if (sort === 'discussed') {
      list.sort((a, b) => commentsFor(b.id).length - commentsFor(a.id).length)
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt)
    }

    return list
  }, [posts, query, activeTag, sort, likesFor, commentsFor, getAuthor])

  const allTags = useMemo(() => {
    const counts = new Map()
    posts.forEach((post) =>
      (post.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)),
    )
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [posts])

  if (!ready) return null

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__text">
          <h1>Stories, ideas and arguments from the Lumen community.</h1>
          <p>
            {posts.length} post{posts.length === 1 ? '' : 's'} published so far.
            Read, respond, and publish your own.
          </p>
        </div>
      </section>

      <section className="feed-controls" aria-label="Feed filters">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${activeTag === '' ? 'chip--active' : ''}`}
            onClick={() => setTag('')}
          >
            All
          </button>
          {allTags.slice(0, 10).map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              className={`chip ${activeTag === tag ? 'chip--active' : ''}`}
              onClick={() => setTag(activeTag === tag ? '' : tag)}
            >
              #{tag} <span className="chip__count">{count}</span>
            </button>
          ))}
        </div>

        <div className="sort-row" role="group" aria-label="Sort posts">
          {SORTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`sort-btn ${sort === option.id ? 'sort-btn--active' : ''}`}
              onClick={() => setSort(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {(query || activeTag) && (
        <div className="filter-summary">
          <span>
            {query && <>Searching for “{query}”</>}
            {query && activeTag && ' in '}
            {activeTag && <>#{activeTag}</>}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => {
            setQuery('')
            setTag('')
          }}>
            Clear filters
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">✎</span>
          <h2>No posts found</h2>
          <p>
            {posts.length === 0
              ? 'Be the first to publish something on Lumen.'
              : 'Try a different search term or clear the filters.'}
          </p>
        </div>
      ) : (
        <div className="post-list">
          {visible.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
