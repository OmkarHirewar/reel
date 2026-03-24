// ── Storage Service (localStorage) ───────────────────────────────────────
// No backend needed — sessions and reels saved in browser storage.

function saveSession(sessionId, data) {
  try {
    const existing = JSON.parse(localStorage.getItem('rg_sessions') || '{}');
    existing[sessionId] = { ...existing[sessionId], ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem('rg_sessions', JSON.stringify(existing));
  } catch (e) { console.warn('Session save failed:', e); }
}

function getSession(sessionId) {
  try {
    const all = JSON.parse(localStorage.getItem('rg_sessions') || '{}');
    return Promise.resolve(all[sessionId] || null);
  } catch (e) { return Promise.resolve(null); }
}

function createJob(job) {
  try {
    const id = 'job_' + Date.now();
    const jobs = JSON.parse(localStorage.getItem('rg_jobs') || '{}');
    jobs[id] = { ...job, id, createdAt: new Date().toISOString(), status: 'pending' };
    localStorage.setItem('rg_jobs', JSON.stringify(jobs));
    return Promise.resolve(id);
  } catch (e) { return Promise.resolve(null); }
}

function updateJob(jobId, update) {
  try {
    const jobs = JSON.parse(localStorage.getItem('rg_jobs') || '{}');
    if (jobs[jobId]) jobs[jobId] = { ...jobs[jobId], ...update, updatedAt: new Date().toISOString() };
    localStorage.setItem('rg_jobs', JSON.stringify(jobs));
  } catch (e) {}
  return Promise.resolve();
}

function saveReel(reel) {
  try {
    const reels = JSON.parse(localStorage.getItem('rg_reels') || '[]');
    reels.unshift({ ...reel, savedAt: new Date().toISOString() });
    // keep last 20 reels only
    localStorage.setItem('rg_reels', JSON.stringify(reels.slice(0, 20)));
  } catch (e) {}
  return Promise.resolve();
}

function incrementStat(reelType) {
  try {
    const stats = JSON.parse(localStorage.getItem('rg_stats') || '{}');
    stats[reelType] = (stats[reelType] || 0) + 1;
    localStorage.setItem('rg_stats', JSON.stringify(stats));
  } catch (e) {}
  return Promise.resolve();
}
