// ── Gemini AI Service ─────────────────────────────────────────────────────

const GEMINI_MODEL    = 'gemini-1.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function geminiRequest(parts, config = {}) {
  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature:     config.temperature     || 0.4,
        maxOutputTokens: config.maxOutputTokens || 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API error ${res.status}`;
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED: ' + msg);
    if (res.status === 400) throw new Error('BAD_REQUEST: ' + msg);
    if (res.status === 403) throw new Error('INVALID_KEY: ' + msg);
    throw new Error(msg);
  }

  const data  = await res.json();
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

function parseJSON(raw) {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    return null;
  }
}

// ── 1. Analyse overview video → generate shot sequence ────────────────────
async function analyseVideo(base64Data, mimeType, reelType, reelContext) {
  const prompt = `You are an expert Instagram Reels cinematographer and video director.

The user wants to create a ${reelContext}.

They have uploaded a walkthrough overview video of their location or subject.
Carefully watch this entire video and analyse:
- The physical space, layout, and best angles
- Lighting conditions and quality
- Key visual elements and subjects worth shooting
- Natural movement paths

Based on what you SEE in THIS specific video, generate a personalised shot sequence with 5–7 shots.

For each shot be very specific to what is actually visible in their video — not generic advice.

Respond ONLY in this exact JSON (no markdown, no explanation):
{
  "overview": "One sentence describing exactly what you saw in the video",
  "lighting": "Brief note on lighting quality you observed",
  "shots": [
    {
      "title": "Short punchy title (max 5 words)",
      "desc": "Precise shooting instructions based on what you actually saw in their video (2-3 sentences)",
      "tip": "One pro tip emoji + tip",
      "duration": 3
    }
  ]
}`;

  const text = await geminiRequest([
    { inline_data: { mime_type: mimeType, data: base64Data } },
    { text: prompt },
  ]);

  const parsed = parseJSON(text);
  if (!parsed || !Array.isArray(parsed.shots) || parsed.shots.length === 0) {
    throw new Error('Could not parse AI response. Please try again.');
  }
  return parsed;
}

// ── 2. Generate reel edit plan ─────────────────────────────────────────────
async function generateEditPlan(shots, songName, songArtist, reelType, reelContext, uploadedCount) {
  const prompt = `You are a professional Instagram Reels editor with expertise in beat-synced video editing.

The user is creating a ${reelContext} reel.
Song: "${songName}" by ${songArtist}
Clips available: ${uploadedCount} uploaded out of ${shots.length} total shots

Shot list:
${shots.map((s, i) => `${i + 1}. ${s.title} — ${s.desc}`).join('\n')}

Create the optimal edit plan:
1. Order shots for maximum visual impact matched to the song's energy curve
2. Suggest clip duration in seconds for each shot (beat-matched)
3. Recommend transitions between each clip
4. Suggest colour grade/filter style that matches the song vibe
5. Note the ideal moment to start the song (intro skip or beat drop)

Respond ONLY in this exact JSON:
{
  "editPlan": [
    {
      "shotIndex": 0,
      "duration": 2.5,
      "transition": "cut",
      "note": "optional note"
    }
  ],
  "colorGrade": "warm golden tones with slight vignette",
  "songStartAt": 0,
  "totalDuration": 25,
  "vibeScore": 92,
  "editorNote": "One sentence describing the overall reel feel and energy"
}`;

  const text = await geminiRequest(
    [{ text: prompt }],
    { temperature: 0.5, maxOutputTokens: 1024 }
  );

  return parseJSON(text) || {
    editPlan: shots.map((_, i) => ({ shotIndex: i, duration: 3, transition: 'cut' })),
    colorGrade: 'natural tones',
    songStartAt: 0,
    totalDuration: shots.length * 3,
    vibeScore: 88,
    editorNote: 'Your reel is ready with a clean, flowing edit.',
  };
}

// ── 3. Generate caption + hashtags for the reel ───────────────────────────
async function generateCaption(reelType, reelContext, songName, overview) {
  const prompt = `Write an Instagram caption and hashtags for a ${reelContext} reel.
Song used: "${songName}"
What was filmed: ${overview}

Make the caption engaging, trendy, and authentic. Include 15-20 relevant hashtags.

Respond ONLY in this JSON:
{
  "caption": "The full Instagram caption with emojis",
  "hashtags": ["tag1", "tag2"]
}`;

  const text = await geminiRequest(
    [{ text: prompt }],
    { temperature: 0.7, maxOutputTokens: 512 }
  );

  return parseJSON(text) || {
    caption: `✨ New reel dropping! 🎬 #reels #viral`,
    hashtags: ['reels', 'viral', 'trending', 'instagram'],
  };
}
