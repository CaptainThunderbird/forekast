import { useEffect, useState } from 'react'
import { CATEGORY_OPTIONS, categoryLabel } from './lib/categories'

const STATUSES = ['OPEN', 'CORRECT', 'INCORRECT', 'INCONCLUSIVE']
const PAGE_LOAD_TIME = Date.now()

function Avatar({ user, button = false }) {
  const content = user.avatarUrl
    ? <img className="avatar-image" src={user.avatarUrl} alt="" />
    : user.username.slice(0, 1).toUpperCase()
  return button
    ? <button className="avatar avatar-button" onClick={() => window.location.href = `/profile/${encodeURIComponent(user.username)}`} aria-label={`Open @${user.username}'s profile`}>{content}</button>
    : <div className="avatar">{content}</div>
}

export default function FeedPage({
  session, forecasts, draft, setDraft, filters, setFilters, message, busy,
  composerExpanded, setComposerExpanded, publish, logout, openProfile,
  toggleSignal, toggleRepost, openForekast, addComment, commentDraft, setCommentDraft,
  resolutionDraft, setResolutionDraft, resolveForecast, removeForecast,
  selected, setSelected, profile, setProfile, minTargetDate, theme, toggleTheme,
}) {
  const [search, setSearch] = useState('')
  useEffect(() => {
    if (!selected && !profile) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelected(null)
        setProfile(null)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [profile, selected, setProfile, setSelected])

  const query = search.trim().toLowerCase()
  const visibleForecasts = query ? forecasts.filter((forecast) => [
    forecast.statement,
    forecast.content,
    forecast.reasoning,
    forecast.user?.username,
  ].some((value) => value?.toLowerCase().includes(query))) : forecasts
  const openCount = visibleForecasts.filter((forecast) => (forecast.status || 'OPEN') === 'OPEN').length
  const resolvedCount = visibleForecasts.length - openCount
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const publishedTodayCount = visibleForecasts.filter((forecast) => new Date(forecast.createdAt).getTime() >= todayStart).length

  return (
    <div className="desk-page">
      <header className="desk-topbar">
        <div>
          <p className="desk-label">PUBLIC FORECASTING DESK</p>
          <a className="landing-brand" href="/">Forekast <span>2026</span></a>
        </div>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a>
          <button className="theme-toggle" type="button" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
          {session ? (
            <>
              <button onClick={() => openProfile(session.user.username)}>@{session.user.username}</button>
              <button onClick={logout}>Sign out</button>
            </>
          ) : <a href="/">Sign in</a>}
        </nav>
      </header>

      <main className="desk-main">
        <section className="desk-briefing" aria-labelledby="briefing-title">
          <div className="briefing-number">{visibleForecasts.length}</div>
          <div className="briefing-copy">
            <p className="eyebrow">TODAY'S BRIEFING</p>
            <h1 id="briefing-title">forekasts in this view.</h1>
            <p>Clear claims, dated outcomes, and a public record.</p>
          </div>
          <dl className="briefing-stats">
            <div><dt>Published today</dt><dd>{publishedTodayCount}</dd></div>
            <div><dt>Open</dt><dd>{openCount}</dd></div>
            <div><dt>Resolved</dt><dd>{resolvedCount}</dd></div>
          </dl>
        </section>

        {session ? (
          <form className={`quick-composer ${composerExpanded ? 'expanded' : ''}`} onSubmit={publish}>
            <div className="quick-composer-main">
              <Avatar user={session.user} />
              <textarea
                aria-label="Forekast statement"
                maxLength="280"
                rows={composerExpanded ? 3 : 1}
                value={draft.statement}
                onFocus={() => setComposerExpanded(true)}
                onChange={(event) => setDraft({ ...draft, statement: event.target.value })}
                placeholder="What do you see coming next?"
              />
            </div>
            {composerExpanded && (
              <div className="composer-details">
                <textarea
                  aria-label="Reasoning"
                  className="compact-reasoning"
                  rows="2"
                  maxLength="2000"
                  value={draft.reasoning}
                  onChange={(event) => setDraft({ ...draft, reasoning: event.target.value })}
                  placeholder="Add your reasoning (optional)"
                />
                <div className="compact-fields">
                  <label>Category
                    <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                      {CATEGORY_OPTIONS.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                    </select>
                  </label>
                  <label>Target date
                    <input type="date" min={minTargetDate} required value={draft.targetDate} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} />
                  </label>
                </div>
                <div className="composer-actions">
                  <button type="button" className="text-button" onClick={() => setComposerExpanded(false)}>Cancel</button>
                  <span>{draft.statement.length}/280</span>
                  <button className="primary" disabled={busy || !draft.statement.trim() || !draft.targetDate}>Publish open claim</button>
                </div>
              </div>
            )}
          </form>
        ) : <div className="feed-signin-note"><a href="/">Sign in</a> to publish and personalize your ledger.</div>}

        {message && <p className="message" role="alert">{message}</p>}

        <section className="desk-filters" aria-label="Forekast filters">
          <label className="search-field">
            <span>SEARCH</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Statement, reasoning, or forekaster" />
          </label>
          <div className="filter-grid">
            <label><span>Category</span><select aria-label="Filter by category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select></label>
            <label><span>Status</span><select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select></label>
          </div>
        </section>

        <section className="ledger-section" aria-labelledby="ledger-title">
          <header className="ledger-heading">
            <div><p className="eyebrow">NEWEST CLAIMS FIRST</p><h2 id="ledger-title">The public ledger</h2></div>
            <span>{visibleForecasts.length} showing</span>
          </header>
          <div className="compact-timeline">
          {visibleForecasts.length === 0 ? <p className="empty">No forekasts match this view.</p> : visibleForecasts.map((forecast, index) => (
            <article className="forecast-card" key={forecast.id}>
              <div className="ledger-number">#{String(index + 1).padStart(2, '0')}</div>
              <div className="forecast-body">
                <div className="forecast-author">
                  <Avatar user={forecast.user} button />
                  <button onClick={() => openProfile(forecast.user.username)}>@{forecast.user.username}</button>
                  <span>· {new Date(forecast.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="forecast-statement" onClick={() => openForekast(forecast)}>{forecast.statement || forecast.content}</button>
                {forecast.reasoning && <p className="forecast-reasoning">{forecast.reasoning}</p>}
                {forecast.comments?.length > 0 && (
                  <div className="recent-comments" aria-label="Recent discussion">
                    {forecast.comments.map((comment) => (
                      <p key={comment.id}><strong>@{comment.user.username}</strong> {comment.content}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="ledger-meta"><span>Category</span><strong>{categoryLabel(forecast.category)}</strong></div>
              <div className="ledger-meta"><span>Target date</span><strong>{forecast.targetDate ? new Date(forecast.targetDate).toLocaleDateString() : 'Not set'}</strong></div>
              <div className="ledger-actions">
                <span className={`mini-status ${String(forecast.status || 'OPEN').toLowerCase()}`}>{forecast.status || 'OPEN'}</span>
                <button className={forecast.signals?.length ? 'signaled' : ''} onClick={() => toggleSignal(forecast)}>{forecast.signals?.length ? '◆' : '◇'} {forecast._count?.signals || 0}</button>
                <button onClick={() => openForekast(forecast)}>Discussion {forecast._count?.comments || 0}</button>
                <button className={forecast.reposts?.length ? 'reposted' : ''} onClick={() => toggleRepost(forecast)}>↻ {forecast._count?.reposts || 0}</button>
                <button className="record-button" onClick={() => openForekast(forecast)}>Open claim →</button>
              </div>
            </article>
          ))}
          </div>
        </section>
      </main>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="feed-forecast-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close text-close" aria-label="Close claim details" onClick={() => setSelected(null)}>Close</button>
            <p className="eyebrow">{categoryLabel(selected.category)} · {selected.status}</p>
            <h2 id="feed-forecast-title">{selected.statement || selected.content}</h2>
            {selected.reasoning && <p className="detail-reasoning">{selected.reasoning}</p>}
            <dl>
              <div><dt>Author</dt><dd>@{selected.user.username}</dd></div>
              <div><dt>Published</dt><dd>{new Date(selected.createdAt).toLocaleDateString()}</dd></div>
              <div><dt>Target date</dt><dd>{selected.targetDate ? new Date(selected.targetDate).toLocaleDateString() : 'Not set'}</dd></div>
            </dl>
            <p className="claim-state">
              {selected.status === 'OPEN'
                ? `This claim is open. The author can resolve and close it ${selected.targetDate ? `after ${new Date(selected.targetDate).toLocaleDateString()}` : 'when the outcome is known'}.`
                : `This claim is closed with an outcome of ${selected.status}.`}
            </p>
            {selected.resolution && <div className="resolution-box"><p className="eyebrow">AUTHOR-REPORTED OUTCOME</p><h3>{selected.resolution.result}</h3><p>{selected.resolution.explanation}</p></div>}
            <div className="detail-actions">
              <button className={selected.signals?.length ? 'active' : ''} onClick={() => toggleSignal(selected)}>◇ {selected._count?.signals || 0} signals</button>
              <button className={selected.reposts?.length ? 'active' : ''} onClick={() => toggleRepost(selected)}>↻ {selected._count?.reposts || 0} reposts</button>
            </div>
            <section className="comments-section">
              <h3>Discussion · {selected._count?.comments || 0}</h3>
              {session ? (
                <form className="comment-form" onSubmit={addComment}>
                  <textarea maxLength="500" required value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Write a comment…" />
                  <button className="primary" disabled={busy || !commentDraft.trim()}>Reply</button>
                </form>
              ) : <p className="empty">Sign in to join the conversation.</p>}
              <div className="comment-list">
                {selected.comments?.length ? selected.comments.map((comment) => (
                  <article key={comment.id}>
                    <Avatar user={comment.user} button />
                    <div>
                      <button className="comment-author" onClick={() => openProfile(comment.user.username)}>@{comment.user.username}</button>
                      <p>{comment.content}</p>
                      <time>{new Date(comment.createdAt).toLocaleString()}</time>
                    </div>
                  </article>
                )) : <p className="empty">No comments yet.</p>}
              </div>
            </section>
            {session?.user.id === selected.user.id && selected.status === 'OPEN' && (
              <section className="lifecycle-panel">
                <p className="eyebrow">AUTHOR CONTROLS</p>
                {selected.targetDate && new Date(selected.targetDate).getTime() <= PAGE_LOAD_TIME ? (
                  <form className="resolution-form" onSubmit={resolveForecast}>
                    <h3>Resolve and close this claim</h3>
                    <label>Outcome
                      <select value={resolutionDraft.result} onChange={(event) => setResolutionDraft({ ...resolutionDraft, result: event.target.value })}>
                        <option>CORRECT</option>
                        <option>INCORRECT</option>
                        <option>INCONCLUSIVE</option>
                      </select>
                    </label>
                    <label>What happened?
                      <textarea required minLength="10" maxLength="2000" value={resolutionDraft.explanation} onChange={(event) => setResolutionDraft({ ...resolutionDraft, explanation: event.target.value })} />
                    </label>
                    <label>Evidence link
                      <input type="url" value={resolutionDraft.sourceUrl} onChange={(event) => setResolutionDraft({ ...resolutionDraft, sourceUrl: event.target.value })} placeholder="https://..." />
                    </label>
                    <button className="primary" disabled={busy}>Resolve and close claim</button>
                  </form>
                ) : (
                  <p className="resolution-availability">Resolution becomes available after the target date.</p>
                )}
                <button className="danger" disabled={busy} onClick={() => removeForecast(selected.id)}>Delete open claim</button>
              </section>
            )}
          </section>
        </div>
      )}

      {profile && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setProfile(null)}>
          <section className="detail-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="feed-profile-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close profile" onClick={() => setProfile(null)}>×</button>
            <div className="profile-heading"><div className="avatar large">{profile.username.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">FOREKASTER</p><h2 id="feed-profile-title">@{profile.username}</h2></div></div>
            <p className="detail-reasoning">{profile.bio || 'No biography yet.'}</p>
            <dl><div><dt>Forekasts</dt><dd>{profile._count.forecasts}</dd></div><div><dt>Followers</dt><dd>{profile._count.followers}</dd></div><div><dt>Accuracy</dt><dd>{profile.accuracy === null ? '—' : `${profile.accuracy}%`}</dd></div></dl>
          </section>
        </div>
      )}
    </div>
  )
}
