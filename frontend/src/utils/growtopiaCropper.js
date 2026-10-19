/**
 * growtopiaCropper.js
 * 
 * Automatically detects and crops the head/face/hat region of Growtopia
 * composite avatars (960x640 or 992x640) into a focused, crisp retro pixel art headshot portrait.
 */

const cropCache = new Map();

/**
 * Crops a full-body Growtopia avatar to just the head & hat region.
 * @param {string} dataUrl - Base64 PNG dataUrl
 * @returns {Promise<string>} - Cropped headshot dataUrl
 */
export async function cropGrowtopiaHead(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  
  // Only process PNG dataUrls (not SVGs or web links)
  if (!dataUrl.startsWith('data:image/png')) {
    return dataUrl;
  }

  // Check cache
  const cacheKey = dataUrl.substring(20, 120);
  if (cropCache.has(cacheKey)) {
    return cropCache.get(cacheKey);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        // If image is already a small square crop, no need to recrop
        if (w <= 160 && h <= 160 && Math.abs(w - h) < 10) {
          cropCache.set(cacheKey, dataUrl);
          return resolve(dataUrl);
        }

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = w;
        sourceCanvas.height = h;
        const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
        sCtx.drawImage(img, 0, 0);

        const imgData = sCtx.getImageData(0, 0, w, h);
        const pixels = imgData.data;

        // Find bounding box of character pixels (ignoring pure white or transparent background)
        let minX = w;
        let maxX = 0;
        let minY = h;
        let maxY = 0;
        let foundPixels = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];

            // Non-transparent and not pure white canvas background
            if (a > 30 && !(r > 248 && g > 248 && b > 248)) {
              foundPixels++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (foundPixels < 40 || minX >= maxX || minY >= maxY) {
          // If no content found, return original
          cropCache.set(cacheKey, dataUrl);
          return resolve(dataUrl);
        }

        const charWidth = maxX - minX;
        const centerX = Math.round((minX + maxX) / 2);

        // Precise head crop: head is ~48px-64px wide/tall
        const headSize = Math.max(charWidth * 0.72, 48);
        const cropSize = Math.round(headSize * 1.25);
        const cropX = Math.round(centerX - cropSize / 2);
        const cropY = Math.max(0, Math.round(minY - 4));

        // Output canvas: 128x128 with pixelated scaling
        const outCanvas = document.createElement('canvas');
        outCanvas.width = 128;
        outCanvas.height = 128;
        const oCtx = outCanvas.getContext('2d');
        oCtx.imageSmoothingEnabled = false;

        // Draw cropped head onto output canvas
        oCtx.drawImage(
          sourceCanvas,
          cropX,
          cropY,
          cropSize,
          cropSize,
          0,
          0,
          128,
          128
        );

        const croppedDataUrl = outCanvas.toDataURL('image/png');
        cropCache.set(cacheKey, croppedDataUrl);
        resolve(croppedDataUrl);
      } catch (err) {
        console.warn('[GrowtopiaCropper] Failed to crop head:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
