import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { buildSeedState } from '../data/seed.js'
import { hashPassword, verifyPassword } from '../lib/auth.js'
import {
  clearSession,
  loadState,
  onExternalChange,
  readSession,
  saveState,
  writeSession,
} from '../lib/storage.js'
import {
  colorFor,
  makeExcerpt,
  normalizeImageUrl,
  slugify,
  uid,
} from '../lib/utils.js'

const StoreContext = createContext(null)

/**
 * Single source of truth for the app: accounts, posts, comments and likes.
 * Everything is persisted to localStorage so a build of this app is a complete,
 * self-contained deployment.
 */
export function StoreProvider({ children }) {
  const [state, setState] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(() => readSession()?.userId || null)
  const [ready, setReady] = useState(false)
  const stateRef = useRef(state)

  // Hydrate from storage (hashing demo passwords on first run).
  useEffect(() => {
    let cancelled = false
    loadState(buildSeedState)
      .then((loaded) => {
        if (cancelled) return
        setState(loaded)
        stateRef.current = loaded
        setReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setState(buildSeedState())
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist on every change.
  useEffect(() => {
    if (state && ready) saveState(state)
  }, [state, ready])

  // Keep in sync across tabs.
  useEffect(() => {
    if (!ready) return undefined
    return onExternalChange(async () => {
      const fresh = await loadState(buildSeedState)
      stateRef.current = fresh
      setState(fresh)
    })
  }, [ready])

  const patch = useCallback((updater) => {
    const prev = stateRef.current
    if (!prev) return
    // Derive from stateRef so consecutive updates in the same tick compose,
    // and so stateRef always matches what is about to be rendered.
    const next = typeof updater === 'function' ? updater(prev) : updater
    stateRef.current = next
    setState(next)
  }, [])

  const user = useMemo(
    () => state?.users.find((u) => u.id === currentUserId) || null,
    [state, currentUserId],
  )

  /* ----------------------------- auth ----------------------------- */

  const register = useCallback(
    async ({ name, username, email, password }) => {
      const uname = username.trim().toLowerCase()
      const mail = email.trim().toLowerCase()
      const existing = stateRef.current?.users || []
      if (existing.some((u) => u.username === uname)) {
        throw new Error('That username is already taken.')
      }
      if (existing.some((u) => u.email === mail)) {
        throw new Error('An account with that email already exists.')
      }
      const salt = uid('s')
      const passwordHash = await hashPassword(password, salt)
      const newUser = {
        id: uid('u'),
        name: name.trim(),
        username: uname,
        email: mail,
        bio: '',
        location: '',
        website: '',
        joinedAt: Date.now(),
        salt,
        passwordHash,
      }
      patch((prev) => ({ ...prev, users: [...prev.users, newUser] }))
      writeSession(newUser.id)
      setCurrentUserId(newUser.id)
      return newUser
    },
    [patch],
  )

  const login = useCallback(async ({ identifier, password }) => {
    const key = identifier.trim().toLowerCase()
    const found = (stateRef.current?.users || []).find(
      (u) => u.username === key || u.email === key,
    )
    if (!found) throw new Error('No account matches those details.')
    const ok = await verifyPassword(password, found.salt, found.passwordHash)
    if (!ok) throw new Error('Incorrect password. Please try again.')
    writeSession(found.id)
    setCurrentUserId(found.id)
    return found
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setCurrentUserId(null)
  }, [])

  const updateProfile = useCallback(
    (changes) => {
      if (!currentUserId) return
      patch((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === currentUserId ? { ...u, ...changes } : u,
        ),
      }))
    },
    [currentUserId, patch],
  )

  const changePassword = useCallback(
    async ({ current, next }) => {
      const account = stateRef.current?.users.find((u) => u.id === currentUserId)
      if (!account) throw new Error('You must be signed in.')
      const ok = await verifyPassword(current, account.salt, account.passwordHash)
      if (!ok) throw new Error('Your current password is incorrect.')
      const salt = uid('s')
      const passwordHash = await hashPassword(next, salt)
      patch((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === account.id ? { ...u, salt, passwordHash } : u,
        ),
      }))
    },
    [currentUserId, patch],
  )

  /* ----------------------------- posts ---------------------------- */

  const createPost = useCallback(
    ({ title, body, tags, coverImage }) => {
      if (!currentUserId) throw new Error('Sign in to publish a post.')
      const trimmedTitle = title.trim()
      if (!trimmedTitle) throw new Error('Your post needs a title.')
      if (!body.trim()) throw new Error('Your post needs some content.')

      const id = uid('p')
      const post = {
        id,
        authorId: currentUserId,
        title: trimmedTitle,
        slug: slugify(trimmedTitle),
        body,
        tags: tags
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 6),
        coverImage: normalizeImageUrl(coverImage),
        excerpt: makeExcerpt(body),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        commentIds: [],
      }
      // stateRef is kept in sync by patch, so the new post is readable at once.
      patch((prev) => ({ ...prev, posts: [post, ...prev.posts] }))
      return post
    },
    [currentUserId, patch],
  )

  const updatePost = useCallback(
    (postId, changes) => {
      if (!currentUserId) throw new Error('Sign in to edit this post.')
      const target = stateRef.current?.posts.find((p) => p.id === postId)
      if (!target) throw new Error('That post no longer exists.')
      if (target.authorId !== currentUserId) {
        throw new Error('You can only edit your own posts.')
      }
      const title = changes.title?.trim() || target.title
      const updated = {
        ...target,
        title,
        slug: changes.title ? slugify(title) : target.slug,
        body: changes.body ?? target.body,
        tags: changes.tags ?? target.tags,
        coverImage:
          changes.coverImage !== undefined
            ? normalizeImageUrl(changes.coverImage)
            : target.coverImage,
        excerpt: changes.body ? makeExcerpt(changes.body) : target.excerpt,
        updatedAt: Date.now(),
      }
      patch((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === postId ? updated : p)),
      }))
      // Return the post as it now exists so callers can navigate to its slug.
      return updated
    },
    [currentUserId, patch],
  )

  const deletePost = useCallback(
    (postId) => {
      if (!currentUserId) throw new Error('Sign in to delete this post.')
      const target = stateRef.current?.posts.find((p) => p.id === postId)
      if (!target) return
      if (target.authorId !== currentUserId) {
        throw new Error('You can only delete your own posts.')
      }
      patch((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
        comments: prev.comments.filter((c) => c.postId !== postId),
        likes: prev.likes.filter((l) => l.postId !== postId),
      }))
    },
    [currentUserId, patch],
  )

  /* ---------------------------- comments -------------------------- */

  const addComment = useCallback(
    (postId, body) => {
      if (!currentUserId) throw new Error('Sign in to comment.')
      const text = body.trim()
      if (!text) throw new Error('Write something first.')
      const comment = {
        id: uid('c'),
        postId,
        authorId: currentUserId,
        body: text,
        createdAt: Date.now(),
      }
      patch((prev) => ({
        ...prev,
        comments: [...prev.comments, comment],
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, commentIds: [...p.commentIds, comment.id] } : p,
        ),
      }))
      return comment
    },
    [currentUserId, patch],
  )

  const deleteComment = useCallback(
    (commentId) => {
      if (!currentUserId) throw new Error('Sign in to delete a comment.')
      const comment = stateRef.current?.comments.find((c) => c.id === commentId)
      if (!comment) return
      const isAuthor = comment.authorId === currentUserId
      const post = stateRef.current?.posts.find((p) => p.id === comment.postId)
      const isPostAuthor = post?.authorId === currentUserId
      if (!isAuthor && !isPostAuthor) {
        throw new Error('You can only delete your own comments.')
      }
      patch((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== commentId),
        posts: prev.posts.map((p) =>
          p.id === comment.postId
            ? { ...p, commentIds: p.commentIds.filter((id) => id !== commentId) }
            : p,
        ),
      }))
    },
    [currentUserId, patch],
  )

  /* ------------------------------ likes --------------------------- */

  const toggleLike = useCallback(
    (postId) => {
      if (!currentUserId) throw new Error('Sign in to like posts.')
      const exists = Boolean(
        stateRef.current?.likes.some(
          (l) => l.postId === postId && l.userId === currentUserId,
        ),
      )
      patch((prev) => ({
        ...prev,
        likes: exists
          ? prev.likes.filter(
              (l) => !(l.postId === postId && l.userId === currentUserId),
            )
          : [
              ...prev.likes,
              { postId, userId: currentUserId, createdAt: Date.now() },
            ],
      }))
      return !exists
    },
    [currentUserId, patch],
  )

  /* --------------------------- selectors -------------------------- */

  const value = useMemo(() => {
    const usersById = new Map((state?.users || []).map((u) => [u.id, u]))

    const getAuthor = (id) => usersById.get(id) || null

    const getUserByName = (name) =>
      (state?.users || []).find(
        (u) => u.username === String(name || '').toLowerCase(),
      ) || null

    const getPostBySlug = (slug) =>
      (state?.posts || []).find((p) => p.slug === slug) || null

    const commentsFor = (postId) =>
      (state?.comments || [])
        .filter((c) => c.postId === postId)
        .sort((a, b) => b.createdAt - a.createdAt)

    const likesFor = (postId) =>
      (state?.likes || []).filter((l) => l.postId === postId)

    const hasLiked = (postId) =>
      Boolean(
        currentUserId &&
          (state?.likes || []).some(
            (l) => l.postId === postId && l.userId === currentUserId,
          ),
      )

    const postsBy = (userId) =>
      (state?.posts || [])
        .filter((p) => p.authorId === userId)
        .sort((a, b) => b.createdAt - a.createdAt)

    const statsFor = (userId) => {
      const authored = (state?.posts || []).filter((p) => p.authorId === userId)
      const likesReceived = (state?.likes || []).filter((l) =>
        authored.some((p) => p.id === l.postId),
      ).length
      const commentsWritten = (state?.comments || []).filter(
        (c) => c.authorId === userId,
      ).length
      return {
        posts: authored.length,
        likes: likesReceived,
        comments: commentsWritten,
      }
    }

    return {
      state,
      ready,
      user,
      currentUserId,
      users: state?.users || [],
      posts: (state?.posts || []).sort((a, b) => b.createdAt - a.createdAt),
      getAuthor,
      getUserByName,
      getPostBySlug,
      commentsFor,
      likesFor,
      hasLiked,
      postsBy,
      statsFor,
    }
  }, [state, ready, user, currentUserId])

  const actions = useMemo(
    () => ({
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      createPost,
      updatePost,
      deletePost,
      addComment,
      deleteComment,
      toggleLike,
    }),
    [
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      createPost,
      updatePost,
      deletePost,
      addComment,
      deleteComment,
      toggleLike,
    ],
  )

  const api = useMemo(
    () => ({ ...value, ...actions, colorFor }),
    [value, actions],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

/** Access the store. Throws if used outside <StoreProvider>. */
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
