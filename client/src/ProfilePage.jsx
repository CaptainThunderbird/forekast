import { useState } from 'react'

const categoryLabel = (category) => category === 'FICTION_MEDIA' ? 'FICTION & MEDIA' : category

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
  const [photoError, setPhotoError] = useState('')

  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 5 MB.')
      return
    }

    try {
      const bitmap = await createImageBitmap(file)
      const size = 256
      const scale = Math.max(size / bitmap.width, size / bitmap.height)
      const width = bitmap.width * scale
      const height = bitmap.height * scale
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
      bitmap.close()
      setAvatarDraft(canvas.toDataURL('image/webp', 0.82))
    } catch {
      setPhotoError('That image could not be prepared. Try a different file.')
    }
  }

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
                <label>Profile picture
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
                </label>
                <p className="photo-help">Choose a JPG, PNG, or WebP image up to 5 MB. Forekast will resize it automatically.</p>
                {photoError && <p className="field-error" role="alert">{photoError}</p>}
                {avatarDraft && <div className="profile-preview"><span>Preview</span><img src={avatarDraft} alt="Profile preview" /></div>}
                {avatarDraft && <button type="button" className="text-button remove-photo" onClick={() => setAvatarDraft('')}>Remove photo</button>}
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
                    <span>{categoryLabel(forekast.category)} · {forekast.status}</span>
                    <p>{forekast.statement}</p>
                  </div>
                  <time>{new Date(forekast.createdAt).toLocaleDateString()}</time>
                </article>
              )) : <p className="empty">No forekasts yet.</p>}
            </section>

            <section className="profile-history">
              <h2>Comments</h2>
              {profile.comments.length ? profile.comments.map((comment) => (
                <article key={comment.id}>
                  <div>
                    <span>REPLY TO @{comment.forecast.user.username} · {categoryLabel(comment.forecast.category)}</span>
                    <p>{comment.content}</p>
                    <small>On “{comment.forecast.statement}”</small>
                  </div>
                  <time>{new Date(comment.createdAt).toLocaleDateString()}</time>
                </article>
              )) : <p className="empty">No comments yet.</p>}
            </section>

            <section className="profile-history">
              <h2>Reposts</h2>
              {profile.reposts.length ? profile.reposts.map((repost) => (
                <article key={repost.forecastId}>
                  <div>
                    <span>REPOSTED FROM @{repost.forecast.user.username} · {categoryLabel(repost.forecast.category)}</span>
                    <p>{repost.forecast.statement}</p>
                  </div>
                  <time>{new Date(repost.createdAt).toLocaleDateString()}</time>
                </article>
              )) : <p className="empty">No reposts yet.</p>}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
