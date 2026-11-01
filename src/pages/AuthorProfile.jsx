import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import PostCard from '../components/PostCard.jsx'
import { formatDate } from '../lib/utils.js'
import { useStore } from '../store/StoreContext.jsx'

/** Public author profile with bio, stats and published posts. */
export default function AuthorProfile() {
  const { username } = useParams()
  const { getUserByName, postsBy, statsFor, user, updateProfile } = useStore()
  const profile = getUserByName(username)

  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [message, setMessage] = useState('')

  const posts = useMemo(
    () => (profile ? postsBy(profile.id) : []),
    [profile, postsBy],
  )
  const stats = useMemo(
    () => (profile ? statsFor(profile.id) : { posts: 0, likes: 0, comments: 0 }),
    [profile, statsFor],
  )

  const isOwn = Boolean(profile && user && user.id === profile.id)

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '')
      setLocation(profile.location || '')
      setWebsite(profile.website || '')
    }
  }, [profile])

  if (!profile) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">404</span>
          <h2>Author not found</h2>
          <p>No account matches “{username}”.</p>
          <Link className="btn btn--primary" to="/">
            Back to the feed
          </Link>
        </div>
      </div>
    )
  }

  const save = (event) => {
    event.preventDefault()
    updateProfile({ bio: bio.trim(), location: location.trim(), website: website.trim() })
    setEditing(false)
    setMessage('Profile updated.')
    setTimeout(() => setMessage(''), 2500)
  }

  return (
    <div className="page">
      <section className="profile-header">
        <Avatar user={profile} size={96} className="profile-header__avatar" />

        <div className="profile-header__info">
          <h1>{profile.name}</h1>
          <p className="profile-header__handle">@{profile.username}</p>

          {profile.bio ? (
            <p className="profile-header__bio">{profile.bio}</p>
          ) : (
            <p className="profile-header__bio muted">
              {isOwn ? 'Add a bio from the edit form below.' : 'This author hasn’t written a bio yet.'}
            </p>
          )}

          <div className="profile-header__meta">
            {profile.location && (
              <span title="Location">📍 {profile.location}</span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={profile.website}
              >
                🔗 {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            <span title="Joined">🗓 Joined {formatDate(profile.joinedAt)}</span>
          </div>

          <div className="profile-stats">
            <div>
              <strong>{stats.posts}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{stats.likes}</strong>
              <span>Likes</span>
            </div>
            <div>
              <strong>{stats.comments}</strong>
              <span>Comments</span>
            </div>
          </div>

          {isOwn && (
            <div className="profile-header__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setEditing((open) => !open)}
              >
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
              <Link className="btn btn--primary btn--sm" to="/write">
                New post
              </Link>
            </div>
          )}

          {message && (
            <p className="alert alert--success" role="status">
              {message}
            </p>
          )}

          {isOwn && editing && (
            <form className="profile-edit" onSubmit={save}>
              <label className="field">
                <span>Bio</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  maxLength={280}
                  placeholder="Tell readers a little about yourself"
                />
                <em className="muted">{280 - bio.length} characters left</em>
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Location</span>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Lagos, Nigeria"
                    maxLength={60}
                  />
                </label>
                <label className="field">
                  <span>Website</span>
                  <input
                    type="url"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
              </div>
              <button className="btn btn--primary btn--sm" type="submit">
                Save profile
              </button>
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="author-posts-heading">
        <h2 id="author-posts-heading" className="section-title">
          Published posts <span className="muted">({posts.length})</span>
        </h2>

        {posts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">✎</span>
            <h3>No posts yet</h3>
            <p>{isOwn ? 'Publish your first post to fill this space.' : 'Check back soon.'}</p>
            {isOwn && (
              <Link className="btn btn--primary" to="/write">
                Write a post
              </Link>
            )}
          </div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showAuthor={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
