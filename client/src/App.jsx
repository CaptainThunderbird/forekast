import { useEffect, useState } from 'react'
import './App.css'
import FeedPage from './FeedPage'
import ProfilePage from './ProfilePage'
import { categoryLabel } from './lib/categories'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
const MIN_TARGET_DATE = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const PAGE_LOAD_TIME = Date.now()

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('forekast-session')) }
    catch { return null }
  })
  const [forecasts, setForecasts] = useState([])
  const [draft, setDraft] = useState({
    statement: '',
    reasoning: '',
    category: 'TECHNOLOGY',
    targetDate: '',
  })
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [filters, setFilters] = useState({ category: '', status: '' })
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(() => window.location.pathname.startsWith('/profile/'))
  const [bioDraft, setBioDraft] = useState('')
  const [avatarDraft, setAvatarDraft] = useState('')
  const [resolutionDraft, setResolutionDraft] = useState({ result: 'CORRECT', explanation: '', sourceUrl: '' })
  const [commentDraft, setCommentDraft] = useState('')
  const [composerExpanded, setComposerExpanded] = useState(false)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('forekast-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('forekast-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  function navigate(path, { replace = false } = {}) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
    setCurrentPath(path)
    window.scrollTo(0, 0)
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    })
    const data = response.status === 204 ? null : await response.json()
    if (!response.ok) {
      const details = data.details?.map((item) => `${item.field}: ${item.message}`).join(' · ')
      throw new Error(details || data.error || 'Something went wrong')
    }
    return data
  }

  useEffect(() => {
    const headers = session?.token ? { Authorization: `Bearer ${session.token}` } : {}
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString()
    const path = `/forecasts${query ? `?${query}` : ''}`
    fetch(`${API_URL}${path}`, { headers })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load the timeline')
        return data
      })
      .then(setForecasts)
      .catch((error) => setMessage(error.message))
  }, [session, filters])

  const profileUsername = currentPath.startsWith('/profile/')
    ? decodeURIComponent(currentPath.slice('/profile/'.length))
    : ''

  useEffect(() => {
    if (!profileUsername) return
    const headers = session?.token ? { Authorization: `Bearer ${session.token}` } : {}
    fetch(`${API_URL}/users/${encodeURIComponent(profileUsername)}`, { headers })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load this profile')
        return data
      })
      .then((data) => {
        setProfile(data)
        setBioDraft(data.bio || '')
        setAvatarDraft(data.avatarUrl || '')
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setProfileLoading(false))
  }, [profileUsername, session])

  async function handleAuth(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const payload = mode === 'register' ? form : { email: form.email, password: form.password }
      const data = await request(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      localStorage.setItem('forekast-session', JSON.stringify(data))
      setForm({ username: '', email: '', password: '' })
      navigate('/feed', { replace: true })
      setSession(data)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function publish(event) {
    event.preventDefault()
    if (!draft.statement.trim() || !draft.targetDate) return
    setBusy(true)
    setMessage('')
    try {
      const forecast = await request('/forecasts', {
        method: 'POST',
        body: JSON.stringify({
          ...draft,
          targetDate: new Date(`${draft.targetDate}T23:59:59`).toISOString(),
        }),
      })
      setForecasts((current) => [forecast, ...current])
      setDraft({ statement: '', reasoning: '', category: 'TECHNOLOGY', targetDate: '' })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  function logout() {
    localStorage.removeItem('forekast-session')
    setSession(null)
  }

  async function removeForecast(id) {
    setBusy(true)
    setMessage('')
    try {
      await request(`/forecasts/${id}`, { method: 'DELETE' })
      setForecasts((current) => current.filter((forecast) => forecast.id !== id))
      setSelected(null)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  function openProfile(username) {
    navigate(`/profile/${encodeURIComponent(username)}`)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const user = await request('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ bio: bioDraft, avatarUrl: avatarDraft }),
      })
      setProfile((current) => ({ ...current, bio: user.bio, avatarUrl: user.avatarUrl }))
      const nextSession = { ...session, user: { ...session.user, bio: user.bio, avatarUrl: user.avatarUrl } }
      localStorage.setItem('forekast-session', JSON.stringify(nextSession))
      setSession(nextSession)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleFollow() {
    if (!session) {
      setMessage('Sign in to follow forekasters')
      return
    }
    setBusy(true)
    try {
      await request(`/users/${profile.id}/follow`, { method: profile.isFollowing ? 'DELETE' : 'POST' })
      setProfile((current) => ({
        ...current,
        isFollowing: !current.isFollowing,
        _count: {
          ...current._count,
          followers: current._count.followers + (current.isFollowing ? -1 : 1),
        },
      }))
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleSignal(forecast) {
    if (!session) {
      setMessage('Sign in to signal forekasts')
      return
    }
    const signaled = Boolean(forecast.signals?.length)
    try {
      await request(`/forecasts/${forecast.id}/signal`, { method: signaled ? 'DELETE' : 'POST' })
      const update = (item) => item.id === forecast.id ? {
        ...item,
        signals: signaled ? [] : [{ id: 'current-user' }],
        _count: { ...item._count, signals: Math.max(0, (item._count?.signals || 0) + (signaled ? -1 : 1)) },
      } : item
      setForecasts((current) => current.map(update))
      setSelected((current) => current?.id === forecast.id ? update(current) : current)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function openForekast(forekast) {
    setMessage('')
    try {
      const detail = await request(`/forecasts/${forekast.id}`)
      setSelected(detail)
      setCommentDraft('')
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function addComment(event) {
    event.preventDefault()
    if (!session) return setMessage('Sign in to comment')
    if (!commentDraft.trim()) return
    setBusy(true)
    try {
      const comment = await request(`/forecasts/${selected.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentDraft }),
      })
      setSelected((current) => ({
        ...current,
        comments: [...(current.comments || []), comment],
        _count: { ...current._count, comments: (current._count?.comments || 0) + 1 },
      }))
      setForecasts((current) => current.map((item) => item.id === selected.id ? {
        ...item,
        comments: [comment, ...(item.comments || [])].slice(0, 2),
        _count: { ...item._count, comments: (item._count?.comments || 0) + 1 },
      } : item))
      setCommentDraft('')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleRepost(forekast) {
    if (!session) return setMessage('Sign in to repost forekasts')
    const reposted = Boolean(forekast.reposts?.length)
    try {
      await request(`/forecasts/${forekast.id}/repost`, { method: reposted ? 'DELETE' : 'POST' })
      const update = (item) => item.id === forekast.id ? {
        ...item,
        reposts: reposted ? [] : [{ userId: session.user.id }],
        _count: { ...item._count, reposts: Math.max(0, (item._count?.reposts || 0) + (reposted ? -1 : 1)) },
      } : item
      setForecasts((current) => current.map(update))
      setSelected((current) => current?.id === forekast.id ? update(current) : current)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function resolveForecast(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const data = await request(`/forecasts/${selected.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(resolutionDraft),
      })
      const next = {
        ...selected,
        ...data.forecast,
        signals: selected.signals || [],
        reposts: selected.reposts || [],
        comments: selected.comments || [],
      }
      setSelected(next)
      setForecasts((current) => current.map((item) => item.id === next.id ? next : item))
      setResolutionDraft({ result: 'CORRECT', explanation: '', sourceUrl: '' })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (profileUsername) {
    return (
      <ProfilePage
        session={session}
        profile={profile}
        loading={profileLoading}
        message={message}
        busy={busy}
        bioDraft={bioDraft}
        setBioDraft={setBioDraft}
        avatarDraft={avatarDraft}
        setAvatarDraft={setAvatarDraft}
        saveProfile={saveProfile}
        toggleFollow={toggleFollow}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    )
  }

  if (currentPath === '/feed') {
    return (
      <FeedPage
        session={session}
        forecasts={forecasts}
        draft={draft}
        setDraft={setDraft}
        filters={filters}
        setFilters={setFilters}
        message={message}
        busy={busy}
        composerExpanded={composerExpanded}
        setComposerExpanded={setComposerExpanded}
        publish={publish}
        logout={logout}
        openProfile={openProfile}
        toggleSignal={toggleSignal}
        toggleRepost={toggleRepost}
        openForekast={openForekast}
        addComment={addComment}
        commentDraft={commentDraft}
        setCommentDraft={setCommentDraft}
        resolutionDraft={resolutionDraft}
        setResolutionDraft={setResolutionDraft}
        resolveForecast={resolveForecast}
        removeForecast={removeForecast}
        selected={selected}
        setSelected={setSelected}
        profile={profile}
        setProfile={setProfile}
        minTargetDate={MIN_TARGET_DATE}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    )
  }

  return (
    <main className="landing-page">
      <header className="landing-topbar">
        <div>
          <p className="desk-label">PUBLIC FORECASTING DESK</p>
          <a className="landing-brand" href="/" aria-label="Forekast home">Forekast <span>2026</span></a>
        </div>
        <div className="landing-top-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <a href="/feed">Public ledger</a>
          {session && <button type="button" onClick={logout}>Sign out</button>}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-thesis">
          <p className="eyebrow">A RECORD OF WHAT COMES NEXT</p>
          <h1>Make the call.<br />Set the date.</h1>
          <p>Publish a testable prediction. Return to record what happened.</p>
        </div>

        {!session ? (
          <form className="landing-access" onSubmit={handleAuth}>
            <p className="issue">ACCOUNT ACCESS</p>
            <h2>{mode === 'login' ? 'Welcome back.' : 'Create an account.'}</h2>
            {mode === 'register' && (
              <label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            )}
            <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Password<input type="password" minLength="8" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <button className="primary" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
            <button type="button" className="text-button switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>
              {mode === 'login' ? 'Create an account' : 'Use an existing account'}
            </button>
          </form>
        ) : (
          <div className="landing-access landing-launch">
            <p className="issue">SIGNED IN</p>
            <h2>@{session.user.username}</h2>
            <a className="primary" href="/feed">Open your ledger <span aria-hidden="true">→</span></a>
          </div>
        )}
      </section>

      {message && <p className="message landing-message" role="alert">{message}</p>}

      <footer className="landing-footer">
        <span>Independent public beta</span>
        <nav aria-label="Project information">
          <a href="https://github.com/CaptainThunderbird/forekast" target="_blank" rel="noreferrer">Source</a>
          <a href="https://github.com/CaptainThunderbird/forekast/issues" target="_blank" rel="noreferrer">Feedback</a>
          <a href="https://forekast-api.onrender.com/api/health" target="_blank" rel="noreferrer">API</a>
        </nav>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="forecast-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close details" onClick={() => setSelected(null)}>×</button>
            <p className="eyebrow">{categoryLabel(selected.category)} · {selected.status}</p>
            <h2 id="forecast-title">{selected.statement || selected.content}</h2>
            {selected.reasoning && <p className="detail-reasoning">{selected.reasoning}</p>}
            <dl>
              <div><dt>Author</dt><dd>@{selected.user.username}</dd></div>
              <div><dt>Published</dt><dd>{new Date(selected.createdAt).toLocaleDateString()}</dd></div>
              <div><dt>Target date</dt><dd>{selected.targetDate ? new Date(selected.targetDate).toLocaleDateString() : 'Not set'}</dd></div>
            </dl>
            {selected.resolution && (
              <div className="resolution-box">
                <p className="eyebrow">AUTHOR-REPORTED OUTCOME</p>
                <h3>{selected.resolution.result}</h3>
                <p>{selected.resolution.explanation}</p>
                {selected.resolution.sourceUrl && <a href={selected.resolution.sourceUrl} target="_blank" rel="noreferrer">View supporting evidence ↗</a>}
              </div>
            )}
            <button className={`signal-button detail-signal ${selected.signals?.length ? 'active' : ''}`} onClick={() => toggleSignal(selected)}>
              {selected.signals?.length ? '◆ Signaled' : '◇ Signal this forekast'} · {selected._count?.signals || 0}
            </button>
            {session?.user.id === selected.user.id && selected.status === 'OPEN' && (
              <>
                {selected.targetDate && new Date(selected.targetDate).getTime() <= PAGE_LOAD_TIME && (
                  <form className="resolution-form" onSubmit={resolveForecast}>
                    <h3>Resolve this forekast</h3>
                    <label>Outcome
                      <select value={resolutionDraft.result} onChange={(e) => setResolutionDraft({ ...resolutionDraft, result: e.target.value })}>
                        <option>CORRECT</option><option>INCORRECT</option><option>INCONCLUSIVE</option>
                      </select>
                    </label>
                    <label>What happened?
                      <textarea required minLength="10" maxLength="2000" value={resolutionDraft.explanation} onChange={(e) => setResolutionDraft({ ...resolutionDraft, explanation: e.target.value })} />
                    </label>
                    <label>Evidence link
                      <input type="url" value={resolutionDraft.sourceUrl} onChange={(e) => setResolutionDraft({ ...resolutionDraft, sourceUrl: e.target.value })} placeholder="https://…" />
                    </label>
                    <button className="primary" disabled={busy}>Record outcome</button>
                  </form>
                )}
                <button className="danger" disabled={busy} onClick={() => removeForecast(selected.id)}>Delete forekast</button>
              </>
            )}
          </section>
        </div>
      )}

      {profile && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setProfile(null)}>
          <section className="detail-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close profile" onClick={() => setProfile(null)}>×</button>
            <div className="profile-heading">
              <div className="avatar large">{profile.username.slice(0, 1).toUpperCase()}</div>
              <div><p className="eyebrow">FOREKASTER</p><h2 id="profile-title">@{profile.username}</h2></div>
            </div>
            {session?.user.id === profile.id ? (
              <form className="bio-form" onSubmit={saveProfile}>
                <label>Biography<textarea maxLength="240" value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} placeholder="Tell people what you forekast…" /></label>
                <button className="primary" disabled={busy}>Save profile</button>
              </form>
            ) : (
              <>
                <p className="detail-reasoning">{profile.bio || 'No biography yet.'}</p>
                {session && <button className={profile.isFollowing ? 'secondary' : 'primary'} disabled={busy} onClick={toggleFollow}>{profile.isFollowing ? 'Following · Unfollow' : 'Follow forekaster'}</button>}
              </>
            )}
            <dl>
              <div><dt>Forekasts</dt><dd>{profile._count.forecasts}</dd></div>
              <div><dt>Followers</dt><dd>{profile._count.followers}</dd></div>
              <div><dt>Following</dt><dd>{profile._count.following}</dd></div>
              <div><dt>Accuracy</dt><dd>{profile.accuracy === null ? '—' : `${profile.accuracy}%`}</dd></div>
            </dl>
            <h3 className="profile-subtitle">Recent forekasts</h3>
            <div className="profile-forecasts">
              {profile.forecasts.length ? profile.forecasts.map((forecast) => (
                <button key={forecast.id} onClick={() => { setProfile(null); setSelected({ ...forecast, user: { id: profile.id, username: profile.username } }) }}>
                  <span>{categoryLabel(forecast.category)}</span>{forecast.statement}
                </button>
              )) : <p className="empty">No forekasts yet.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
