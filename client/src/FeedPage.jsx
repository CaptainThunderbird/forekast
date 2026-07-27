const CATEGORIES = ['TECHNOLOGY', 'BUSINESS', 'SCIENCE', 'POLITICS', 'SPORTS', 'CULTURE', 'FICTION_MEDIA', 'OTHER']
const STATUSES = ['OPEN', 'CORRECT', 'INCORRECT', 'INCONCLUSIVE']
const categoryLabel = (category) => category === 'FICTION_MEDIA' ? 'FICTION & MEDIA' : category

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
  selected, setSelected, profile, setProfile, minTargetDate,
}) {
  return (
    <div className="feed-app">
      <aside className="feed-sidebar">
        <a className="feed-brand" href="/">FOREKAST<span>.</span></a>
        <nav aria-label="Primary navigation">
          <a href="/" className="feed-nav-link"><span>⌂</span> Landing</a>
          <a href="/feed" className="feed-nav-link active"><span>◫</span> Forekasts</a>
          {session && <button className="feed-nav-link" onClick={() => openProfile(session.user.username)}><span>○</span> Profile</button>}
        </nav>
        {session ? (
          <div className="sidebar-account">
            <Avatar user={session.user} button />
            <div>
              <button className="sidebar-profile-link" onClick={() => openProfile(session.user.username)}>@{session.user.username}</button>
              <button onClick={logout}>Sign out</button>
            </div>
          </div>
        ) : <a className="primary sidebar-signin" href="/">Sign in</a>}
      </aside>

      <main className="stream">
        <header className="stream-header">
          <div><p className="eyebrow">LIVE EDITION</p><h1>Forekasts</h1></div>
          <span className="live-dot">Live</span>
        </header>

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
                      {CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
                    </select>
                  </label>
                  <label>Target date
                    <input type="date" min={minTargetDate} required value={draft.targetDate} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} />
                  </label>
                </div>
                <div className="composer-actions">
                  <button type="button" className="text-button" onClick={() => setComposerExpanded(false)}>Cancel</button>
                  <span>{draft.statement.length}/280</span>
                  <button className="primary" disabled={busy || !draft.statement.trim() || !draft.targetDate}>Forekast</button>
                </div>
              </div>
            )}
          </form>
        ) : <div className="feed-signin-note">Sign in from the <a href="/">landing page</a> to publish and personalize your feed.</div>}

        {message && <p className="message" role="alert">{message}</p>}

        <div className="stream-tools">
          <strong>Latest forekasts</strong>
          <div>
            <select aria-label="Filter by category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="">All categories</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
            </select>
            <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div className="compact-timeline">
          {forecasts.length === 0 ? <p className="empty">No forekasts match this view.</p> : forecasts.map((forecast) => (
            <article className="forecast-card" key={forecast.id}>
              <Avatar user={forecast.user} button />
              <div className="forecast-body">
                <div className="forecast-author">
                  <button onClick={() => openProfile(forecast.user.username)}>@{forecast.user.username}</button>
                  <span>· {new Date(forecast.createdAt).toLocaleDateString()}</span>
                  <span className={`mini-status ${String(forecast.status || 'OPEN').toLowerCase()}`}>{forecast.status || 'OPEN'}</span>
                </div>
                <button className="forecast-statement" onClick={() => openForekast(forecast)}>{forecast.statement || forecast.content}</button>
                {forecast.reasoning && <p className="forecast-reasoning">{forecast.reasoning}</p>}
                <div className="forecast-footer">
                  <span>{categoryLabel(forecast.category)}</span>
                  <span>Resolves {forecast.targetDate ? new Date(forecast.targetDate).toLocaleDateString() : 'later'}</span>
                  <button className={forecast.signals?.length ? 'signaled' : ''} onClick={() => toggleSignal(forecast)}>{forecast.signals?.length ? '◆' : '◇'} {forecast._count?.signals || 0}</button>
                  <button onClick={() => openForekast(forecast)}>Reply · {forecast._count?.comments || 0}</button>
                  <button className={forecast.reposts?.length ? 'reposted' : ''} onClick={() => toggleRepost(forecast)}>↻ {forecast._count?.reposts || 0}</button>
                  <button onClick={() => openForekast(forecast)}>Details</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <aside className="feed-context">
        <div className="context-card">
          <p className="eyebrow">FOREKAST NOTE</p>
          <h2>Make it testable.</h2>
          <p>The strongest forekasts name a clear outcome and a date when anyone can check what happened.</p>
        </div>
        <div className="context-card muted"><strong>Feed controls</strong><p>Use category and status filters to narrow the conversation.</p></div>
      </aside>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="feed-forecast-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close details" onClick={() => setSelected(null)}>×</button>
            <p className="eyebrow">{categoryLabel(selected.category)} · {selected.status}</p>
            <h2 id="feed-forecast-title">{selected.statement || selected.content}</h2>
            {selected.reasoning && <p className="detail-reasoning">{selected.reasoning}</p>}
            <dl>
              <div><dt>Author</dt><dd>@{selected.user.username}</dd></div>
              <div><dt>Published</dt><dd>{new Date(selected.createdAt).toLocaleDateString()}</dd></div>
              <div><dt>Target date</dt><dd>{selected.targetDate ? new Date(selected.targetDate).toLocaleDateString() : 'Not set'}</dd></div>
            </dl>
            {selected.resolution && <div className="resolution-box"><p className="eyebrow">AUTHOR-REPORTED OUTCOME</p><h3>{selected.resolution.result}</h3><p>{selected.resolution.explanation}</p></div>}
            <div className="detail-actions">
              <button className={selected.signals?.length ? 'active' : ''} onClick={() => toggleSignal(selected)}>◇ {selected._count?.signals || 0} signals</button>
              <button className={selected.reposts?.length ? 'active' : ''} onClick={() => toggleRepost(selected)}>↻ {selected._count?.reposts || 0} reposts</button>
            </div>
            <section className="comments-section">
              <h3>Comments · {selected._count?.comments || 0}</h3>
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
