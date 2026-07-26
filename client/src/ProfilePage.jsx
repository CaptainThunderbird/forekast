function Avatar({ user, large = false }) {
  const className = `avatar${large ? ' large' : ''}`
  return user.avatarUrl
    ? <img className={`${className} profile-image`} src={user.avatarUrl} alt={`${user.username}'s profile`} />
    : <div className={className}>{user.username.slice(0, 1).toUpperCase()}</div>
}

export default function ProfilePage({
  session, profile, loading, message, busy, bioDraft, setBioDraft,
  avatarDraft, setAvatarDraft, saveProfile, toggleFollow, logout,
}) {
  const isOwner = Boolean(session?.user.id && profile?.id === session.user.id)

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <a className="feed-brand" href="/">FOREKAST<span>.</span></a>
        <nav>
          <a href="/feed">Forekasts</a>
          {session ? <button onClick={logout}>Sign out</button> : <a href="/">Sign in</a>}
        </nav>
      </header>

      <main className="profile-page-content">
        <a className="profile-back" href="/feed">← Back to feed</a>
        {loading && <p className="empty">Loading profile…</p>}
        {message && <p className="message" role="alert">{message}</p>}

        {profile && (
          <>
            <section className="profile-hero">
              <Avatar user={profile} large />
              <div className="profile-identity">
                <p className="eyebrow">FOREKASTER</p>
                <h1>@{profile.username}</h1>
                {!isOwner && <p>{profile.bio || 'No biography yet.'}</p>}
              </div>
              {!isOwner && session && (
                <button className={profile.isFollowing ? 'secondary' : 'primary'} disabled={busy} onClick={toggleFollow}>
                  {profile.isFollowing ? 'Following · Unfollow' : 'Follow forekaster'}
                </button>
              )}
            </section>

            {isOwner && (
              <form className="profile-editor" onSubmit={saveProfile}>
                <h2>Edit profile</h2>
                <label>Biography
                  <textarea maxLength="240" value={bioDraft} onChange={(event) => setBioDraft(event.target.value)} placeholder="Tell people what you forekast…" />
                </label>
                <label>Profile picture URL
                  <input type="url" maxLength="1000" value={avatarDraft} onChange={(event) => setAvatarDraft(event.target.value)} placeholder="https://example.com/your-photo.jpg" />
                </label>
                {avatarDraft && <div className="profile-preview"><span>Preview</span><img src={avatarDraft} alt="Profile preview" /></div>}
                <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
              </form>
            )}

            <dl className="profile-stats">
              <div><dt>Forekasts</dt><dd>{profile._count.forecasts}</dd></div>
              <div><dt>Followers</dt><dd>{profile._count.followers}</dd></div>
              <div><dt>Following</dt><dd>{profile._count.following}</dd></div>
              <div><dt>Accuracy</dt><dd>{profile.accuracy === null ? '—' : `${profile.accuracy}%`}</dd></div>
            </dl>

            <section className="profile-history">
              <h2>Recent forekasts</h2>
              {profile.forecasts.length ? profile.forecasts.map((forekast) => (
                <article key={forekast.id}>
                  <div>
                    <span>{forekast.category} · {forekast.status}</span>
                    <p>{forekast.statement}</p>
                  </div>
                  <time>{new Date(forekast.createdAt).toLocaleDateString()}</time>
                </article>
              )) : <p className="empty">No forekasts yet.</p>}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
