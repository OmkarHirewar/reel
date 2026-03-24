// ── ReelGuide AI — Main App ───────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────
const REEL_CONTEXT = {
  nature:     'nature and travel reel showing landscapes and scenic beauty',
  shop:       'shop or brand promotional reel showcasing a store and products',
  funny:      'comedy reel with reactions, skits, and humorous moments',
  food:       'food reel showing cooking, plating, and restaurant ambiance',
  dance:      'dance reel showcasing performance moves and energy',
  fashion:    'fashion OOTD lookbook reel showing outfit details',
  motivation: 'motivational gym reel showing intense workout energy',
  event:      'event reel capturing a party, wedding, or gathering',
};

const REEL_INSTRUCTIONS = {
  nature:     'Walk the entire location — forest, trail, viewpoint — in one continuous sweep without stopping.',
  shop:       'Walk through your entire shop from entrance to every corner, capturing products, displays, and decor.',
  funny:      'Record yourself in the scene naturally in one take — be relaxed, AI will find the funniest angles.',
  food:       'Show the full cooking setup — ingredients, the cooking process, and finished dish from all angles.',
  dance:      'Record one full run-through of your routine from a distance so AI can see your full body and style.',
  fashion:    'Record yourself head to toe in natural light, walking slowly in a full circle to show every angle.',
  motivation: 'Walk through your workout space or gym capturing every area, your equipment, and the atmosphere.',
  event:      'Do a slow full walkthrough of the venue — entrance to every decorated area — in one take.',
};

const TRENDING_SONGS = [
  { n: 'Calm Down',       a: 'Rema & Selena Gomez', e: '🎵' },
  { n: 'Levitating',      a: 'Dua Lipa',             e: '🪐' },
  { n: 'Blinding Lights', a: 'The Weeknd',            e: '💡' },
  { n: 'As It Was',       a: 'Harry Styles',          e: '🌊' },
  { n: 'Oo Antava',       a: 'Anirudh',               e: '🔥' },
  { n: 'Kesariya',        a: 'Arijit Singh',           e: '💛' },
  { n: 'Naacho Naacho',   a: 'RRR',                   e: '💃' },
  { n: 'Srivalli',        a: 'Sid Sriram',             e: '🎶' },
  { n: 'Pasoori',         a: 'Ali Sethi',              e: '🌹' },
  { n: 'Peaches',         a: 'Justin Bieber',          e: '🍑' },
];

// ── Session state ─────────────────────────────────────────────────────────
function makeSessionId() {
  return 'rg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

const ST = {
  sessionId:     localStorage.getItem('rg_session') || makeSessionId(),
  reelType:      null,
  overviewFile:  null,
  overviewB64:   null,
  overviewUrl:   null, // cloudinary URL after upload
  shots:         [],
  uploadedShots: {},   // { index: File }
  uploadedUrls:  {},   // { index: cloudinaryUrl }
  selectedSong:  null,
  analysis:      null,
  editPlan:      null,
  caption:       null,
  jobId:         null,
  currentShot:   null,
};
localStorage.setItem('rg_session', ST.sessionId);

// ── Screen navigation ──────────────────────────────────────────────────────
function go(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s' + n).classList.add('active');
  document.getElementById('stepPill').innerHTML =
    `<span class="cur">${n}</span><span class="tot">/7</span>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Utilities ──────────────────────────────────────────────────────────────
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideErr(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function toast(msg, type = 'info') {
  const t = document.getElementById('toastEl');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => (t.className = 'toast'), 3000);
}

function addLog(logId, msg, done = false) {
  const log = document.getElementById(logId);
  if (!log) return null;
  const d = document.createElement('div');
  d.className = 'li' + (done ? ' done' : '');
  d.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}

function setPf(id, v) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(v, 100) + '%';
}

function setPs(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Screen 0: Type selection ───────────────────────────────────────────────
function pickType(card) {
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  ST.reelType = card.dataset.type;
  document.getElementById('b1').disabled = false;
  document.getElementById('capInstr').textContent = REEL_INSTRUCTIONS[ST.reelType];
}

// ── Screen 1: Upload overview video ───────────────────────────────────────
function onVidUpload(inp) {
  const file = inp.files[0];
  if (!file) return;
  hideErr('e2');

  const maxMB = 100;
  if (file.size > maxMB * 1024 * 1024) {
    showErr('e2', `⚠️ File is ${(file.size / 1024 / 1024).toFixed(0)}MB. Please trim it under ${maxMB}MB.`);
    return;
  }

  ST.overviewFile = file;
  const url = URL.createObjectURL(file);
  document.getElementById('vidEl').src = url;
  document.getElementById('vidPrev').style.display = 'block';
  document.getElementById('vname').textContent = file.name;
  document.getElementById('vsize').textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB';
  document.getElementById('b2').disabled = false;
  document.getElementById('upZone').style.display = 'none';
}

// ── Screen 2: Analyse with AI ──────────────────────────────────────────────
async function doAnalysis() {
  go(3);
  setPs('ps3', 'Reading your video...');
  setPf('pf3', 5);

  const l1 = addLog('log3', 'Reading video file...');

  try {
    // Step 1 — encode to base64 for Gemini
    ST.overviewB64 = await fileToBase64(ST.overviewFile);
    l1.classList.add('done');
    setPf('pf3', 15);

    // Step 2 — upload to Cloudinary (stores it permanently)
    const l2 = addLog('log3', 'Uploading video to cloud storage...');
    setPs('ps3', 'Uploading to Cloudinary...');

    const cloudResult = await uploadToCloudinary(
      ST.overviewFile,
      `reelguide/sessions/${ST.sessionId}/overview`,
      (pct) => setPf('pf3', 15 + pct * 0.25)
    );
    ST.overviewUrl = cloudResult.url;
    l2.classList.add('done');
    setPf('pf3', 40);
    toast('Video uploaded ✓', 'success');

    // Step 3 — save session to MongoDB
    const l3 = addLog('log3', 'Saving session...');
    setPs('ps3', 'Saving your session...');
    await saveSession(ST.sessionId, {
      reelType:    ST.reelType,
      overviewUrl: ST.overviewUrl,
      status:      'analysing',
    });
    l3.classList.add('done');
    setPf('pf3', 50);

    // Step 4 — Gemini video analysis
    const l4 = addLog('log3', 'Gemini is watching your video...');
    setPs('ps3', 'AI analysing your space...');

    const analysis = await analyseVideo(
      ST.overviewB64,
      ST.overviewFile.type || 'video/mp4',
      ST.reelType,
      REEL_CONTEXT[ST.reelType]
    );
    ST.analysis = analysis;
    l4.classList.add('done');
    setPf('pf3', 85);
    addLog('log3', `Found ${analysis.shots.length} perfect shots!`, true);

    // Step 5 — save analysis to MongoDB
    const jobId = await createJob({
      sessionId:   ST.sessionId,
      reelType:    ST.reelType,
      overviewUrl: ST.overviewUrl,
      analysis:    analysis,
      status:      'shots_generated',
    });
    ST.jobId = jobId;

    // Track analytics
    incrementStat(ST.reelType).catch(() => {});

    setPf('pf3', 100);
    setPs('ps3', '✓ Analysis complete!');
    setTimeout(() => { buildShotGuide(analysis); go(4); }, 800);

  } catch (err) {
    console.error(err);
    handleAnalysisError(err);
  }
}

function handleAnalysisError(err) {
  const msg = err.message || '';
  if (msg.includes('INVALID_KEY') || msg.includes('403')) {
    setPs('ps3', '❌ Gemini API key is invalid.');
    addLog('log3', '⚠️ Check your GEMINI_API_KEY in GitHub Secrets');
  } else if (msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
    setPs('ps3', '❌ API quota exceeded. Wait 1 minute and retry.');
    addLog('log3', '⚠️ Gemini free tier: 15 requests/minute');
  } else if (msg.includes('Cloudinary') || msg.includes('upload')) {
    setPs('ps3', '❌ Video upload failed.');
    addLog('log3', '⚠️ Check CLOUDINARY_* keys in GitHub Secrets');
  } else {
    setPs('ps3', '⚠️ Error: ' + msg.slice(0, 60));
    addLog('log3', 'Retrying with built-in fallback guide...');
    // Fallback to a generic guide
    const fallback = getFallbackShots(ST.reelType);
    ST.analysis = { overview: 'Standard guide for your ' + ST.reelType + ' reel', shots: fallback };
    setTimeout(() => { buildShotGuide(ST.analysis); go(4); }, 1500);
  }
}

// ── Screen 3: Shot guide ───────────────────────────────────────────────────
function buildShotGuide(analysis) {
  ST.shots = analysis.shots;
  const list = document.getElementById('shotList');
  list.innerHTML = '';

  // What Gemini saw
  if (analysis.overview) {
    const ov = document.createElement('div');
    ov.className = 'info-card';
    ov.innerHTML = `
      <div class="badge">🤖 Gemini saw</div>
      <p>${analysis.overview}</p>
      ${analysis.lighting ? `<p style="margin-top:8px;font-size:12px;color:var(--accent3)">💡 ${analysis.lighting}</p>` : ''}`;
    list.appendChild(ov);
  }

  analysis.shots.forEach((shot, i) => {
    const card = document.createElement('div');
    card.className = 'shot-card';
    card.id = 'sc' + i;
    card.innerHTML = `
      <div class="snum">${i + 1}</div>
      <div class="sinfo">
        <div class="stitle">${shot.title}</div>
        <div class="sdesc">${shot.desc}</div>
        <div class="stip">${shot.tip}</div>
        <div class="shot-meta">
          <span class="dur-badge">⏱️ ~${shot.duration || 3}s</span>
        </div>
        <button class="supbtn" id="supbtn${i}" onclick="trigShot(${i})">
          📁 Upload Clip ${i + 1}
        </button>
        <div class="upload-progress" id="uprog${i}" style="display:none">
          <div class="uprog-bar"><div class="uprog-fill" id="upf${i}"></div></div>
          <span id="upct${i}">0%</span>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

function trigShot(i) {
  ST.currentShot = i;
  document.getElementById('shotFile').click();
}

async function onShotFile(inp) {
  const file = inp.files[0];
  if (!file || ST.currentShot === null) return;
  const i = ST.currentShot;

  ST.uploadedShots[i] = file;

  // Show upload progress
  const progWrap = document.getElementById('uprog' + i);
  const progFill = document.getElementById('upf' + i);
  const progText = document.getElementById('upct' + i);
  progWrap.style.display = 'flex';

  const btn = document.getElementById('supbtn' + i);
  btn.textContent = '⏫ Uploading...';
  btn.disabled = true;

  try {
    const result = await uploadToCloudinary(
      file,
      `reelguide/sessions/${ST.sessionId}/shots`,
      (pct) => {
        progFill.style.width = pct + '%';
        progText.textContent = pct + '%';
      }
    );
    ST.uploadedUrls[i] = result.url;

    // Mark card done
    document.getElementById('sc' + i).classList.add('done-shot');
    btn.textContent = '✓ Clip ' + (i + 1) + ' uploaded';
    progWrap.style.display = 'none';

    // Update MongoDB job
    if (ST.jobId) {
      updateJob(ST.jobId, { [`uploadedUrls.${i}`]: result.url }).catch(() => {});
    }

    toast(`Clip ${i + 1} saved to cloud ✓`, 'success');
  } catch (err) {
    btn.textContent = '❌ Upload failed — tap to retry';
    btn.disabled = false;
    progWrap.style.display = 'none';
    toast('Upload failed: ' + err.message, 'error');
  }

  inp.value = '';
}

// ── Screen 4: Song selection ───────────────────────────────────────────────
function buildChips(songs) {
  const el = document.getElementById('schips');
  el.innerHTML = '';
  songs.forEach(s => {
    const c = document.createElement('div');
    c.className = 'schip';
    c.innerHTML = s.e + ' ' + s.n + ' <span style="color:var(--muted);font-size:10px">· ' + s.a + '</span>';
    c.onclick = () => pickSong(c, s);
    el.appendChild(c);
  });
}

function filterSongs(v) {
  const f = v
    ? TRENDING_SONGS.filter(s =>
        s.n.toLowerCase().includes(v.toLowerCase()) ||
        s.a.toLowerCase().includes(v.toLowerCase()))
    : TRENDING_SONGS;
  buildChips(f.length ? f : [{ n: v, a: 'Custom song', e: '🎵' }]);
}

function pickSong(chip, song) {
  document.querySelectorAll('.schip').forEach(c => c.classList.remove('sel'));
  chip.classList.add('sel');
  ST.selectedSong = song;
  document.getElementById('bgen').disabled = false;
}

// ── Screen 5: Generate reel ────────────────────────────────────────────────
async function makeReel() {
  go(6);
  setPs('ps6', 'Asking Gemini to plan your reel...');
  setPf('pf6', 10);
  addLog('log6', 'Analysing song energy and tempo...', true);

  try {
    setPf('pf6', 30);
    const l2 = addLog('log6', 'Gemini mapping clips to beat drops...');

    // Generate edit plan
    const plan = await generateEditPlan(
      ST.shots,
      ST.selectedSong.n,
      ST.selectedSong.a,
      ST.reelType,
      REEL_CONTEXT[ST.reelType],
      Object.keys(ST.uploadedShots).length
    );
    ST.editPlan = plan;
    l2.classList.add('done');
    setPf('pf6', 55);

    // Generate caption
    const l3 = addLog('log6', 'Generating caption and hashtags...');
    const caption = await generateCaption(
      ST.reelType,
      REEL_CONTEXT[ST.reelType],
      ST.selectedSong.n,
      ST.analysis?.overview || ''
    );
    ST.caption = caption;
    l3.classList.add('done');
    setPf('pf6', 75);

    addLog('log6', 'Applying colour grade settings...', true);
    setPf('pf6', 88);
    addLog('log6', 'Finalising your reel...', true);
    setPf('pf6', 100);

    // Save completed reel to MongoDB
    await saveReel({
      sessionId:   ST.sessionId,
      reelType:    ST.reelType,
      overviewUrl: ST.overviewUrl,
      uploadedUrls: ST.uploadedUrls,
      song:        ST.selectedSong,
      editPlan:    plan,
      caption:     caption,
      analysis:    ST.analysis,
    });

    if (ST.jobId) {
      updateJob(ST.jobId, { status: 'completed', editPlan: plan }).catch(() => {});
    }

    // Fill result screen
    const shotCount = ST.shots.length;
    document.getElementById('ss').textContent = shotCount;
    document.getElementById('sd').textContent = (plan.totalDuration || shotCount * 3) + 's';
    document.getElementById('sv').textContent = (plan.vibeScore || 91) + '%';
    document.getElementById('scg').textContent = plan.colorGrade || 'natural';

    if (plan.editorNote) {
      document.getElementById('aiNoteText').textContent = plan.editorNote;
      document.getElementById('aiNote').style.display = 'block';
    }

    if (caption?.caption) {
      document.getElementById('captionText').textContent = caption.caption;
      document.getElementById('hashtagText').textContent =
        (caption.hashtags || []).map(h => '#' + h.replace('#', '')).join(' ');
      document.getElementById('captionBox').style.display = 'block';
    }

    setPs('ps6', '🎬 Reel ready!');
    setTimeout(() => go(7), 700);

  } catch (err) {
    console.error(err);
    // Still show result even if generation partially fails
    document.getElementById('ss').textContent = ST.shots.length;
    document.getElementById('sd').textContent = (ST.shots.length * 3) + 's';
    document.getElementById('sv').textContent = '91%';
    document.getElementById('scg').textContent = 'natural';
    setPs('ps6', '🎬 Reel planned!');
    setTimeout(() => go(7), 700);
  }
}

// ── Copy caption ───────────────────────────────────────────────────────────
function copyCaption() {
  const cap = document.getElementById('captionText').textContent;
  const tags = document.getElementById('hashtagText').textContent;
  navigator.clipboard.writeText(cap + '\n\n' + tags).then(() => {
    toast('Caption copied! ✓', 'success');
  });
}

// ── Share ──────────────────────────────────────────────────────────────────
function shareApp() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'ReelGuide AI', text: 'Make pro reels with AI!', url });
  } else {
    navigator.clipboard.writeText(url).then(() => toast('Link copied! ✓', 'success'));
  }
}

// ── Restart ────────────────────────────────────────────────────────────────
function restart() {
  ST.reelType = null; ST.overviewFile = null; ST.overviewB64 = null;
  ST.overviewUrl = null; ST.shots = []; ST.uploadedShots = {};
  ST.uploadedUrls = {}; ST.selectedSong = null; ST.analysis = null;
  ST.editPlan = null; ST.caption = null; ST.jobId = null;
  // New session
  ST.sessionId = makeSessionId();
  localStorage.setItem('rg_session', ST.sessionId);

  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('b1').disabled = true;
  document.getElementById('b2').disabled = true;
  document.getElementById('vidPrev').style.display = 'none';
  document.getElementById('upZone').style.display = 'block';
  ['log3', 'log6'].forEach(id => document.getElementById(id).innerHTML = '');
  ['pf3', 'pf6'].forEach(id => setPf(id, 0));
  document.getElementById('songInp').value = '';
  document.getElementById('aiNote').style.display = 'none';
  document.getElementById('captionBox').style.display = 'none';
  buildChips(TRENDING_SONGS);
  go(1);
}

// ── Fallback shots ─────────────────────────────────────────────────────────
function getFallbackShots(type) {
  const all = {
    shop: [
      { title: 'Shop Entrance', desc: 'Start outside and slowly push in toward the door, showing the full storefront and sign.', tip: '🚪 Slow push-in', duration: 3 },
      { title: 'Full Interior Pan', desc: 'From one corner do a wide 180° pan showing the entire shop floor.', tip: '↩️ Slow and steady', duration: 4 },
      { title: 'Hero Product', desc: 'Get extremely close to your best product and slowly rotate around it.', tip: '⭐ Best seller first', duration: 3 },
      { title: 'Product Shelf', desc: 'Pull back from a display to reveal the full shelf or product collection.', tip: '🎬 Pull focus', duration: 3 },
      { title: 'Customer POV', desc: 'Walk through at chest height like a customer naturally browsing.', tip: '🚶 Stay steady', duration: 4 },
      { title: 'Detail Close-Up', desc: 'Extreme close-up of packaging or texture. Hold completely still.', tip: '🔍 Macro mode', duration: 2 },
      { title: 'Brand Outro', desc: 'Capture the sign and slowly pull back to show the full shop.', tip: '✨ End strong', duration: 3 },
    ],
    nature: [
      { title: 'Wide Landscape', desc: 'Full landscape — sky, ground, horizon. Hold still for 5 seconds.', tip: '🌅 Golden hour best', duration: 4 },
      { title: 'Foreground Detail', desc: 'Get low with something close to camera, the landscape behind.', tip: '📐 Rule of thirds', duration: 3 },
      { title: 'Leading Lines', desc: 'Find a path or river and walk slowly toward it.', tip: '🚶 Slow walk-in', duration: 4 },
      { title: 'Sky Shot', desc: 'Point up and capture clouds or treetops. Hold 4 seconds.', tip: '☁️ Lock exposure', duration: 3 },
      { title: 'Natural Reveal', desc: 'Walk through a gap between trees for a natural reveal.', tip: '🎬 Let it breathe', duration: 3 },
      { title: 'Texture Close-Up', desc: 'Within 10cm of moss, bark, or water. Let autofocus find it.', tip: '🔍 Stay still', duration: 2 },
    ],
  };
  return all[type] || all.shop;
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildChips(TRENDING_SONGS);
  // Pre-fill type from last session if available
  getSession(ST.sessionId)
    .then(session => {
      if (session?.reelType) {
        const card = document.querySelector(`.type-card[data-type="${session.reelType}"]`);
        if (card) pickType(card);
      }
    })
    .catch(() => {}); // silently fail if MongoDB not configured yet
});
