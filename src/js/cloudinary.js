// ── Cloudinary Direct Browser Upload (unsigned preset) ───────────────────
// Docs: https://cloudinary.com/documentation/upload_widget_reference

async function uploadToCloudinary(file, folder = 'reelguide', onProgress = null) {
  const formData = new FormData();
  formData.append('file',           file);
  formData.append('upload_preset',  CONFIG.CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder',         folder);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  // Use XMLHttpRequest so we get upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        resolve({
          url:        result.secure_url,
          publicId:   result.public_id,
          duration:   result.duration   || null,
          thumbnail:  result.eager?.[0]?.secure_url || null,
          format:     result.format,
          bytes:      result.bytes,
          width:      result.width,
          height:     result.height,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.error?.message || 'Cloudinary upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload network error')));
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

// ── Upload multiple shot clips ─────────────────────────────────────────────
async function uploadShotClips(uploadedShots, sessionId, onEachProgress = null) {
  const results = {};
  const entries = Object.entries(uploadedShots);

  for (const [index, file] of entries) {
    const result = await uploadToCloudinary(
      file,
      `reelguide/sessions/${sessionId}/shots`,
      onEachProgress ? (pct) => onEachProgress(index, pct) : null
    );
    results[index] = result;
  }
  return results;
}

// ── Delete a resource ──────────────────────────────────────────────────────
// Note: delete requires signed request — use this only server-side normally.
// For client-side we just let Cloudinary auto-clean old unused uploads.
async function cloudinaryDelete(publicId, resourceType = 'video') {
  // This requires a backend signature — left as a stub.
  // Cloudinary free tier auto-deletes unused resources after 1 year.
  console.warn('Delete requires server-side signature. Skipped for:', publicId);
}
