/* ==========================================================================
   KOMA · Pure-JS Client-Side GIF89a Encoder & MP4-to-GIF Converter
   Zero external dependencies · Median-Cut 256-color quantizer + GIF89a LZW
   ========================================================================== */

(function (global) {
  'use strict';

  const Koma = (global.Koma = global.Koma || {});

  /* ========================================================================
     1. Median-Cut 256-Color Quantizer (15-bit RGB Histogram + 32K LUT)
     ======================================================================== */
  function quantizeFrame(rgba, pixelCount) {
    const hist = new Uint32Array(32768);
    for (let i = 0, p = 0; i < pixelCount; i++, p += 4) {
      const r5 = rgba[p] >> 3;
      const g5 = rgba[p + 1] >> 3;
      const b5 = rgba[p + 2] >> 3;
      hist[(r5 << 10) | (g5 << 5) | b5]++;
    }

    const bins = [];
    for (let idx = 0; idx < 32768; idx++) {
      const count = hist[idx];
      if (count > 0) {
        bins.push({
          r: (idx >> 10) & 31,
          g: (idx >> 5) & 31,
          b: idx & 31,
          count,
        });
      }
    }

    if (bins.length === 0) {
      return {
        palette: new Uint8Array(768),
        indices: new Uint8Array(pixelCount),
      };
    }

    function createBox(list) {
      let rMin = 31, rMax = 0;
      let gMin = 31, gMax = 0;
      let bMin = 31, bMax = 0;
      let total = 0;
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.r < rMin) rMin = c.r;
        if (c.r > rMax) rMax = c.r;
        if (c.g < gMin) gMin = c.g;
        if (c.g > gMax) gMax = c.g;
        if (c.b < bMin) bMin = c.b;
        if (c.b > bMax) bMax = c.b;
        total += c.count;
      }
      const dr = rMax - rMin;
      const dg = gMax - gMin;
      const db = bMax - bMin;
      const span = Math.max(dr, dg, db);
      return { list, dr, dg, db, span, total };
    }

    const boxes = [createBox(bins)];

    while (boxes.length < 256) {
      let bestIdx = -1;
      let bestScore = -1;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (b.list.length < 2) continue;
        const score = b.span * Math.sqrt(b.total);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      if (bestIdx === -1) break;

      const box = boxes[bestIdx];
      const axis =
        box.dg >= box.dr && box.dg >= box.db
          ? 'g'
          : box.dr >= box.db
          ? 'r'
          : 'b';

      box.list.sort((a, b) => a[axis] - b[axis]);

      const half = box.total / 2;
      let acc = 0;
      let splitAt = 1;
      for (let i = 0; i < box.list.length - 1; i++) {
        acc += box.list[i].count;
        if (acc >= half) {
          splitAt = Math.max(1, i + 1);
          break;
        }
      }

      boxes.splice(
        bestIdx,
        1,
        createBox(box.list.slice(0, splitAt)),
        createBox(box.list.slice(splitAt))
      );
    }

    const palette = new Uint8Array(768);
    const lut = new Uint8Array(32768);

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
      for (let j = 0; j < box.list.length; j++) {
        const c = box.list[j];
        rSum += ((c.r << 3) | (c.r >> 2)) * c.count;
        gSum += ((c.g << 3) | (c.g >> 2)) * c.count;
        bSum += ((c.b << 3) | (c.b >> 2)) * c.count;
        wSum += c.count;
        lut[(c.r << 10) | (c.g << 5) | c.b] = i;
      }
      const off = i * 3;
      palette[off] = Math.round(rSum / wSum);
      palette[off + 1] = Math.round(gSum / wSum);
      palette[off + 2] = Math.round(bSum / wSum);
    }

    const indices = new Uint8Array(pixelCount);
    for (let i = 0, p = 0; i < pixelCount; i++, p += 4) {
      const key = ((rgba[p] >> 3) << 10) | ((rgba[p + 1] >> 3) << 5) | (rgba[p + 2] >> 3);
      indices[i] = lut[key];
    }

    return { palette, indices };
  }

  /* ========================================================================
     2. GIF89a Variable-Width LZW Compressor
     ======================================================================== */
  function lzwEncode(indices, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    const maxTableSize = 4096;

    const HASH_SIZE = 16381;
    const hashKeys = new Int32Array(HASH_SIZE);
    const hashVals = new Int32Array(HASH_SIZE);
    hashKeys.fill(-1);

    const out = [];
    const subBlock = new Uint8Array(255);
    let subLen = 0;
    let bitBuf = 0;
    let bitCount = 0;

    function flushSubBlock() {
      if (subLen > 0) {
        out.push(subLen);
        for (let i = 0; i < subLen; i++) out.push(subBlock[i]);
        subLen = 0;
      }
    }

    function writeCode(code, size) {
      bitBuf |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        subBlock[subLen++] = bitBuf & 0xff;
        if (subLen === 255) flushSubBlock();
        bitBuf >>>= 8;
        bitCount -= 8;
      }
    }

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;

    writeCode(clearCode, codeSize);

    if (indices.length > 0) {
      let prefix = indices[0];

      for (let i = 1; i < indices.length; i++) {
        const k = indices[i];
        const combined = (prefix << 8) | k;

        let slot = ((prefix << 5) ^ k) % HASH_SIZE;
        let found = -1;

        while (true) {
          const existing = hashKeys[slot];
          if (existing === -1) break;
          if (existing === combined) {
            found = hashVals[slot];
            break;
          }
          slot++;
          if (slot >= HASH_SIZE) slot = 0;
        }

        if (found !== -1) {
          prefix = found;
        } else {
          writeCode(prefix, codeSize);

          if (nextCode < maxTableSize) {
            if (nextCode === 1 << codeSize && codeSize < 12) {
              codeSize++;
            }
            hashKeys[slot] = combined;
            hashVals[slot] = nextCode++;
          } else {
            writeCode(clearCode, codeSize);
            hashKeys.fill(-1);
            codeSize = minCodeSize + 1;
            nextCode = eoiCode + 1;
          }

          prefix = k;
        }
      }

      writeCode(prefix, codeSize);
    }

    writeCode(eoiCode, codeSize);

    if (bitCount > 0) {
      subBlock[subLen++] = bitBuf & 0xff;
    }
    flushSubBlock();
    out.push(0x00);

    return out;
  }

  /* ========================================================================
     3. GIF89a Stream Builder
     ======================================================================== */
  class GifEncoder {
    constructor(width, height, repeat = 0) {
      this.width = width;
      this.height = height;
      this.chunks = [];

      const header = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
        width & 0xff, (width >> 8) & 0xff,
        height & 0xff, (height >> 8) & 0xff,
        0x70,
        0x00,
        0x00,
      ]);
      this.chunks.push(header);

      if (repeat >= 0) {
        const netscape = new Uint8Array([
          0x21, 0xff, 0x0b,
          0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
          0x03, 0x01,
          repeat & 0xff, (repeat >> 8) & 0xff,
          0x00,
        ]);
        this.chunks.push(netscape);
      }
    }

    addFrame(rgba, delayCs = 7) {
      const w = this.width;
      const h = this.height;
      const delay = Math.max(2, Math.round(delayCs));

      const { palette, indices } = quantizeFrame(rgba, w * h);
      const lzwBytes = lzwEncode(indices, 8);

      const gce = new Uint8Array([
        0x21, 0xf9, 0x04,
        0x04,
        delay & 0xff, (delay >> 8) & 0xff,
        0x00,
        0x00,
      ]);

      const desc = new Uint8Array([
        0x2c,
        0x00, 0x00,
        0x00, 0x00,
        w & 0xff, (w >> 8) & 0xff,
        h & 0xff, (h >> 8) & 0xff,
        0x87,
      ]);

      this.chunks.push(gce, desc, palette, new Uint8Array([8]), new Uint8Array(lzwBytes));
    }

    finish() {
      this.chunks.push(new Uint8Array([0x3b]));
      return new Blob(this.chunks, { type: 'image/gif' });
    }

    finishBytes() {
      this.chunks.push(new Uint8Array([0x3b]));
      let total = 0;
      for (const c of this.chunks) total += c.length;
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const c of this.chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return merged;
    }
  }

  /* ========================================================================
     4. CORS-Resilient Binary Fetcher
     ======================================================================== */
  async function fetchBinary(url) {
    const candidates = [url];
    if (/^https?:\/\//i.test(url)) {
      candidates.push(
        `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      );
    }

    let lastErr = null;
    for (const target of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 16000);
      try {
        const res = await fetch(target, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status}`);
          continue;
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('text/html') || ct.includes('application/json')) {
          lastErr = new Error('Non-binary response');
          continue;
        }

        const blob = await res.blob();
        if (blob.size < 512) {
          lastErr = new Error('Empty binary response');
          continue;
        }
        return blob;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
      }
    }

    throw lastErr || new Error('无法拉取媒体二进制流');
  }

  /* ========================================================================
     5. Video Blob -> Animated GIF89a Blob
     ======================================================================== */
  function waitForEvent(target, eventName, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for ${eventName}`));
      }, timeoutMs);

      function onOk() {
        cleanup();
        resolve();
      }
      function onErr() {
        cleanup();
        reject(new Error(`Media error during ${eventName}`));
      }
      function cleanup() {
        clearTimeout(timer);
        target.removeEventListener(eventName, onOk);
        target.removeEventListener('error', onErr);
      }

      target.addEventListener(eventName, onOk, { once: true });
      target.addEventListener('error', onErr, { once: true });
    });
  }

  function yieldFrame() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function convertMp4BlobToGif(mp4Blob, onProgress) {
    const objectUrl = URL.createObjectURL(mp4Blob);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objectUrl;

    try {
      const metaReady = waitForEvent(video, 'loadeddata', 10000);
      video.load();
      await metaReady;

      const srcW = video.videoWidth || 480;
      const srcH = video.videoHeight || 320;
      const duration =
        Number.isFinite(video.duration) && video.duration > 0.1
          ? video.duration
          : 2.0;

      // Preserve native Twitter GIF resolution; only scale down if unusually large
      const maxEdge = 640;
      const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
      const outW = Math.max(2, Math.round((srcW * scale) / 2) * 2);
      const outH = Math.max(2, Math.round((srcH * scale) / 2) * 2);

      const maxFrames = 150;
      const targetFps = 15;
      const frameCount = Math.max(
        4,
        Math.min(maxFrames, Math.round(duration * targetFps))
      );
      const stepSec = duration / frameCount;
      const delayCs = Math.max(3, Math.round(stepSec * 100));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const encoder = new GifEncoder(outW, outH, 0);

      for (let i = 0; i < frameCount; i++) {
        const targetTime = Math.min(i * stepSec, Math.max(0, duration - 0.02));
        if (Math.abs(video.currentTime - targetTime) > 0.005) {
          const seeked = waitForEvent(video, 'seeked', 4000);
          video.currentTime = targetTime;
          await seeked;
        }

        ctx.drawImage(video, 0, 0, outW, outH);
        const imgData = ctx.getImageData(0, 0, outW, outH);
        encoder.addFrame(imgData.data, delayCs);

        if (typeof onProgress === 'function') {
          onProgress(Math.round(((i + 1) / frameCount) * 100));
        }

        if (i % 2 === 0) await yieldFrame();
      }

      return encoder.finish();
    } finally {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function convertTweetGifUrlToBlob(mp4Url, options = {}) {
    const onStage = options.onStage || (() => {});
    const onProgress = options.onProgress || (() => {});

    onStage('fetching');
    const mp4Blob = await fetchBinary(mp4Url);

    onStage('encoding');
    return convertMp4BlobToGif(mp4Blob, onProgress);
  }

  Koma.GifEncoder = {
    GifEncoder,
    quantizeFrame,
    lzwEncode,
    fetchBinary,
    convertMp4BlobToGif,
    convertTweetGifUrlToBlob,
  };
})(window);
