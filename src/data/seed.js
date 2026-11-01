import { slugify, makeExcerpt, uid } from '../lib/utils.js'

/**
 * Demo content shown on first launch so the platform never looks empty.
 * Everything is stored locally in the browser — no server required.
 */

const DAY = 86400000
const now = Date.now()

const DEMO_PASSWORD = 'demo1234' // demo accounts only

const authors = [
  {
    id: 'u_ada',
    name: 'Ada Okafor',
    username: 'ada',
    email: 'ada@inkwell.dev',
    bio: 'Frontend engineer who writes about design systems, accessibility, and the small details that make interfaces feel alive.',
    location: 'Lagos, Nigeria',
    website: 'https://example.com/ada',
    joinedAt: now - 420 * DAY,
    password: DEMO_PASSWORD,
    salt: 'ada-salt',
  },
  {
    id: 'u_marcus',
    name: 'Marcus Lee',
    username: 'marcus',
    email: 'marcus@inkwell.dev',
    bio: 'Backend and infrastructure. I like boring technology, long walks through log files, and espresso.',
    location: 'Singapore',
    website: 'https://example.com/marcus',
    joinedAt: now - 310 * DAY,
    password: DEMO_PASSWORD,
    salt: 'marcus-salt',
  },
  {
    id: 'u_priya',
    name: 'Priya Raman',
    username: 'priya',
    email: 'priya@inkwell.dev',
    bio: 'Writing about machine learning, product thinking, and learning in public. Opinions are cheap; experiments are not.',
    location: 'Bengaluru, India',
    website: 'https://example.com/priya',
    joinedAt: now - 180 * DAY,
    password: DEMO_PASSWORD,
    salt: 'priya-salt',
  },
]

const posts = [
  {
    id: 'p_design-systems',
    authorId: 'u_ada',
    title: 'Design systems are a conversation, not a library',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=70',
    tags: ['design', 'frontend', 'accessibility'],
    createdAt: now - 2 * DAY,
    body: `Most teams treat a design system like a component warehouse: drop in a Button, ship a feature, move on. The system that actually survives three years looks less like a warehouse and more like an ongoing conversation between design, engineering, and the people using the product.

## Start with decisions, not components

Before you draw a single button, write down the decisions your product keeps re-making. Which spacing scale do we use? How do we handle focus? What happens when a label wraps to two lines? A design system is mostly a set of answers to boring questions, written down once so nobody has to re-argue them.

\`\`\`css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 2rem;
}
\`\`\`

## Accessibility is the spec

If your component library does not have keyboard support, a visible focus ring, and sensible ARIA, it is not finished — it is a mockup. Bake these in from the first commit, because retrofitting them costs roughly ten times as much and nobody ever budgets for it.

> The best design system is the one your team forgets is there.

## Three habits that keep it healthy

- **Deprecate loudly.** Mark old components as removed, not deprecated-but-ignored.
- **Review contributions like code.** A11y and API consistency get the same scrutiny as logic.
- **Publish a changelog.** People will not read the docs, but they will read a changelog.

The payoff is not speed. The payoff is that your product stops feeling like six different products stitched together.`,
  },
  {
    id: 'p_boring-tech',
    authorId: 'u_marcus',
    title: 'Boring technology will outperform your clever stack',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=70',
    tags: ['backend', 'architecture', 'devops'],
    createdAt: now - 6 * DAY,
    body: `Every few years the industry rediscovers that the interesting part of a system is not the framework. It is whether the thing is still running at 3am.

## Choose the dull option

Postgres. A monotonic queue. A single well-understood cache. When you pick the boring option you are buying yourself the most valuable engineering resource there is: *attention*. Every novel component in your stack is a tax you pay in outages, onboarding time, and debugging sessions.

\`\`\`sql
CREATE INDEX CONCURRENTLY idx_posts_created_at
  ON posts (created_at DESC)
  WHERE deleted_at IS NULL;
\`\`\`

## Complexity compounds

A clever abstraction that saves a week today becomes a liability the moment the person who wrote it moves on. The question is not *"can we build this?"* — it is *"can a new hire understand this on day three?"*

### Signs your stack is too clever

1. The docs require a diagram to explain a single request.
2. Two people understand the deployment pipeline.
3. You have written a framework to avoid writing business logic.

## The trade-off is honest

Boring technology has real limits — you will occasionally need something specialized. The discipline is in being *slow* to reach for it and *fast* to delete it when the special case disappears.

Ship the simple thing. Keep the option to get interesting later.`,
  },
  {
    id: 'p_learning-in-public',
    authorId: 'u_priya',
    title: 'What I learned shipping a model to 10,000 real users',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=70',
    tags: ['machine-learning', 'product', 'lessons'],
    createdAt: now - 11 * DAY,
    body: `Accuracy on a held-out dataset is a hobby. Production is a job. Here is what actually changed when we moved from notebook to a product people depended on.

## The dataset was the whole game

We spent two weeks tuning a model and two days fixing labels. Once we did a proper audit, "model improvements" turned out to be noise — the real gains came from relabeling about 1,200 ambiguous examples.

| Change | Lift in quality |
| --- | --- |
| Relabeling ambiguous cases | +11% |
| Better feature normalization | +4% |
| Extra 50M parameters | +0.6% |

The table is the lesson. Complexity is celebrated; data hygiene is not, but it wins.

## Latency is a product feature

A model that answers in 40ms feels smart. The same model at 2 seconds feels broken, even if it is slightly more accurate. We ended up shipping a smaller model with a fallback:

\`\`\`js
async function predict(input) {
  const fast = await smallModel.run(input)
  if (fast.confidence > 0.82) return fast
  return largeModel.run(input) // worth the wait
}
\`\`\`

## Ship the boring fallback

- Log every disagreement between the model and the human.
- Give users an obvious "this looks wrong" button.
- Never block a task because a prediction failed.

The model is the easy part. Trust is the product.`,
  },
  {
    id: 'p_focus',
    authorId: 'u_ada',
    title: 'Against the infinite backlog',
    tags: ['productivity', 'teams'],
    createdAt: now - 19 * DAY,
    body: `A backlog with 400 items is not a plan. It is a museum of decisions nobody wants to make.

## Cut, do not sort

Sorting the backlog into priorities is procrastination wearing a project-management costume. The useful move is deletion: if something has survived three planning cycles untouched, the market has already told you it does not matter.

## Smaller surfaces

Every feature you add is a feature you must maintain, document, and defend forever. Ask a harsher question than *"would users like this?"* — ask *"what do we stop doing if we build this?"*

> Saying no is a product strategy. Saying yes to everything is a roadmap with no strategy at all.

Keep the list short enough that everyone can recite it from memory. That is when a team starts moving.`,
  },
  {
    id: 'p_side-projects',
    authorId: 'u_marcus',
    title: 'How I keep side projects alive for more than a month',
    tags: ['career', 'open-source'],
    createdAt: now - 27 * DAY,
    body: `I have started roughly forty side projects. Four are still running. Here is the difference.

## Scope for a demo, not a product

The first version should be embarrassingly small — one screen, one job. If you cannot explain it in a sentence, you are building a platform, and platforms eat weekends.

## Make the feedback loop short

Deploy on every merge. A project you can see on your phone in ninety seconds is a project you will keep touching. A project that needs four steps to build locally will quietly die in a branch.

- **Automate the boring part.** One command to test, build, and deploy.
- **Commit on the days you feel like it.** Momentum beats discipline.
- **Write the README first.** If it is hard to describe, the scope is wrong.

## Let it be unfinished

A half-finished thing in public beats a perfect thing in a drawer. Publish the rough version, gather the one or two ideas that actually matter, and ignore the rest.`,
  },
]

const comments = [
  {
    id: 'c_1',
    postId: 'p_design-systems',
    authorId: 'u_marcus',
    body: 'The "deprecate loudly" point hits home. We kept two button components alive for a year because nobody wanted the migration conversation.',
    createdAt: now - 1.5 * DAY,
  },
  {
    id: 'c_2',
    postId: 'p_design-systems',
    authorId: 'u_priya',
    body: 'Starting with decisions rather than components is such a better framing. Stealing this for our next planning session.',
    createdAt: now - 1 * DAY,
  },
  {
    id: 'c_3',
    postId: 'p_boring-tech',
    authorId: 'u_ada',
    body: '"Can a new hire understand this on day three?" should be printed above every architecture review.',
    createdAt: now - 5 * DAY,
  },
  {
    id: 'c_4',
    postId: 'p_learning-in-public',
    authorId: 'u_marcus',
    body: 'The latency section is so true. We A/B tested a slower but more accurate model and the slower one lost on every engagement metric.',
    createdAt: now - 9 * DAY,
  },
  {
    id: 'c_5',
    postId: 'p_focus',
    authorId: 'u_priya',
    body: 'A museum of decisions nobody wants to made — I felt that in my soul.',
    createdAt: now - 17 * DAY,
  },
]

const likes = [
  ['p_design-systems', ['u_marcus', 'u_priya']],
  ['p_boring-tech', ['u_ada', 'u_priya']],
  ['p_learning-in-public', ['u_ada', 'u_marcus']],
  ['p_focus', ['u_marcus', 'u_priya']],
  ['p_side-projects', ['u_ada']],
]

/** Build the initial application state. Passwords are hashed at load time. */
export function buildSeedState() {
  const users = authors.map(
    ({
      password: _password,
      salt,
      id,
      name,
      username,
      email,
      bio,
      location,
      website,
      joinedAt,
    }) => ({
      id,
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      bio,
      location,
      website,
      joinedAt,
      salt,
      // Hashed against _pendingPassword during store hydration.
      passwordHash: null,
      _pendingPassword: _password,
    }),
  )

  const seededPosts = posts.map((post) => ({
    ...post,
    slug: slugify(post.title),
    excerpt: makeExcerpt(post.body),
    updatedAt: post.createdAt,
    commentIds: comments
      .filter((comment) => comment.postId === post.id)
      .map((comment) => comment.id),
  }))

  const seededComments = comments.map((comment) => ({ ...comment }))
  const seededLikes = likes.flatMap(([postId, userIds]) =>
    userIds.map((userId) => ({ postId, userId, createdAt: now - 3 * DAY })),
  )

  return {
    version: 1,
    users,
    posts: seededPosts,
    comments: seededComments,
    likes: seededLikes,
    seedPasswords: Object.fromEntries(
      authors.map((author) => [author.id, author.password]),
    ),
  }
}

export { uid }
