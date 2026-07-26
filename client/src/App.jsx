import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('forekast-session')) }
    catch { return null }
  })
  const [tweets, setTweets] = useState([])
  const [content, setContent] = useState('')
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Something went wrong')
    return data
  }

  useEffect(() => {
    const headers = session?.token ? { Authorization: `Bearer ${session.token}` } : {}
    fetch(`${API_URL}${session ? '/tweets/feed' : '/tweets'}`, { headers })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load the timeline')
        return data
      })
      .then(setTweets)
      .catch((error) => setMessage(error.message))
  }, [session])

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
      setSession(data)
      setForm({ username: '', email: '', password: '' })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function publish(event) {
    event.preventDefault()
    if (!content.trim()) return
    setBusy(true)
    setMessage('')
    try {
      const tweet = await request('/tweets', {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setTweets((current) => [tweet, ...current])
      setContent('')
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

  return (
    <main className="shell">
      <aside className="brand-panel">
        <a className="brand" href="/" aria-label="Forekast home">FOREKAST<span>.</span></a>
        <div className="brand-copy">
          <p className="eyebrow">THE SIGNAL BEFORE THE NOISE</p>
          <h1>Say what’s<br />coming next.</h1>
          <p>Share ideas, follow sharp minds, and keep your view of tomorrow in one clean feed.</p>
        </div>
        <p className="edition">LIVE EDITION · 2026</p>
      </aside>

      <section className="feed-panel">
        <header>
          <div>
            <p className="eyebrow">YOUR TIMELINE</p>
            <h2>Latest forecasts</h2>
          </div>
          {session && (
            <button className="text-button" onClick={logout}>
              @{session.user.username} · Sign out
            </button>
          )}
        </header>

        {!session ? (
          <form className="auth-card" onSubmit={handleAuth}>
            <p className="issue">ISSUE 01</p>
            <h3>{mode === 'login' ? 'Welcome back.' : 'Join the conversation.'}</h3>
            {mode === 'register' && (
              <label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            )}
            <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Password<input type="password" minLength="8" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
            <button type="button" className="text-button switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>
              {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
          </form>
        ) : (
          <form className="composer" onSubmit={publish}>
            <label htmlFor="post">What do you see coming?</label>
            <textarea id="post" maxLength="280" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a forecast…" />
            <div><span>{content.length}/280</span><button className="primary" disabled={busy || !content.trim()}>Publish</button></div>
          </form>
        )}

        {message && <p className="message" role="alert">{message}</p>}

        <div className="timeline">
          {tweets.length === 0 ? <p className="empty">No forecasts yet. Be the first.</p> : tweets.map((tweet) => (
            <article key={tweet.id}>
              <div className="avatar">{tweet.user.username.slice(0, 1).toUpperCase()}</div>
              <div>
                <p className="meta"><strong>@{tweet.user.username}</strong><span>{new Date(tweet.createdAt).toLocaleString()}</span></p>
                <p className="post">{tweet.content}</p>
                <p className="likes">{tweet._count?.likes || 0} signals</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
