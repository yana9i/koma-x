/* ==========================================================================
   KOMA · Tweet URL Parser & Pure-Frontend Image/GIF Resolver
   ========================================================================== */

(function (global) {
  'use strict';

  const Koma = (global.Koma = global.Koma || {});

  const TWEET_URL_REGEX =
    /(?:https?:\/\/)?(?:(?:www|mobile|m)\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx|xcancel|twittpr)\.com\/(?:([A-Za-z0-9_]{1,15})|i\/web)\/status(?:es)?\/(\d{10,22})/gi;

  const STATUS_ONLY_REGEX =
    /(?:https?:\/\/)?(?:(?:www|mobile|m)\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx|xcancel)\.com\/status(?:es)?\/(\d{10,22})/i;

  const BARE_ID_REGEX = /^\s*(\d{15,22})\s*$/;
  const SHORT_TCO_REGEX = /(?:https?:\/\/)?t\.co\/[A-Za-z0-9]+/i;

  function parseTweetInput(raw) {
    const text = String(raw || '').trim();
    if (!text) {
      return { ok: false, code: 'EMPTY' };
    }

    const matches = [];
    TWEET_URL_REGEX.lastIndex = 0;
    let m;
    while ((m = TWEET_URL_REGEX.exec(text)) !== null) {
      const user = m[1] || 'i';
      const id = m[2];
      if (!matches.some((item) => item.id === id)) {
        matches.push({
          user,
          id,
          canonicalUrl: `https://x.com/${user}/status/${id}`,
        });
      }
    }

    if (matches.length > 1) {
      return {
        ok: false,
        code: 'MULTIPLE_URLS',
        count: matches.length,
      };
    }

    if (matches.length === 1) {
      return { ok: true, ...matches[0] };
    }

    const statusOnly = text.match(STATUS_ONLY_REGEX);
    if (statusOnly) {
      const id = statusOnly[1];
      return {
        ok: true,
        user: 'i',
        id,
        canonicalUrl: `https://x.com/i/status/${id}`,
      };
    }

    const bareId = text.match(BARE_ID_REGEX);
    if (bareId) {
      const id = bareId[1];
      return {
        ok: true,
        user: 'i',
        id,
        canonicalUrl: `https://x.com/i/status/${id}`,
      };
    }

    if (SHORT_TCO_REGEX.test(text)) {
      return { ok: false, code: 'SHORT_URL' };
    }

    return { ok: false, code: 'INVALID' };
  }

  function normalizeFormat(ext) {
    const clean = String(ext || '').toLowerCase().trim();
    if (clean === 'jpeg' || clean === 'jpg') return 'jpg';
    if (clean === 'png') return 'png';
    if (clean === 'webp') return 'webp';
    return '';
  }

  function buildTwitterPhotoUrl(rawUrl, quality = 'orig', format = 'auto') {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

    try {
      const parsed = new URL(rawUrl);
      if (
        !parsed.hostname.endsWith('twimg.com') ||
        !parsed.pathname.startsWith('/media/')
      ) {
        return rawUrl;
      }

      let segment = parsed.pathname.replace(/^\/media\//, '').split(':')[0];
      let detectedExt = parsed.searchParams.get('format') || '';
      const dotIdx = segment.lastIndexOf('.');
      let mediaId = segment;
      if (dotIdx !== -1) {
        if (!detectedExt) detectedExt = segment.slice(dotIdx + 1);
        mediaId = segment.slice(0, dotIdx);
      }

      const normalizedExt = normalizeFormat(detectedExt) || 'jpg';
      const targetFormat = format === 'auto' ? normalizedExt : format;

      return `https://pbs.twimg.com/media/${mediaId}?format=${targetFormat}&name=${quality}`;
    } catch {
      return rawUrl;
    }
  }

  function detectFormatFromUrl(rawUrl) {
    if (!rawUrl) return 'JPG';
    try {
      const parsed = new URL(rawUrl);
      const qFmt = parsed.searchParams.get('format');
      if (qFmt) return qFmt.toUpperCase();
      const match = parsed.pathname.match(/\.([a-z0-9]{2,5})(?::[a-z]+)?$/i);
      if (match) return match[1].toUpperCase();
    } catch {
      // ignore
    }
    return 'JPG';
  }

  function computeAspectRatio(width, height) {
    if (!width || !height) return '';
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(Math.round(width), Math.round(height));
    const rw = Math.round(width / d);
    const rh = Math.round(height / d);
    if (rw <= 21 && rh <= 21) return `${rw}:${rh}`;
    const ratio = width / height;
    if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
    if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
    if (Math.abs(ratio - 3 / 2) < 0.05) return '3:2';
    if (Math.abs(ratio - 3 / 4) < 0.05) return '3:4';
    if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16';
    if (Math.abs(ratio - 1) < 0.04) return '1:1';
    return `${ratio.toFixed(2)}:1`;
  }

  function pickBestVideoVariant(variants, fallbackUrl) {
    if (!Array.isArray(variants) || variants.length === 0) return fallbackUrl;
    const mp4s = variants
      .filter((v) => v && v.url && (!v.content_type || v.content_type.includes('mp4')))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    return (mp4s[0] && mp4s[0].url) || fallbackUrl;
  }

  /**
   * Extract ONLY photos and GIFs from FxTwitter response (target tweet only)
   */
  function normalizeFxTwitter(data, fallbackId) {
    const tweet = data && data.tweet;
    if (!tweet) {
      throw Object.assign(new Error('接口未返回推文数据'), { code: 'NOT_FOUND' });
    }

    const mediaObj = tweet.media || {};
    const rawList = Array.isArray(mediaObj.all)
      ? mediaObj.all
      : [
          ...(Array.isArray(mediaObj.photos) ? mediaObj.photos : []),
          ...(Array.isArray(mediaObj.videos) ? mediaObj.videos : []),
        ];

    const media = [];
    const seen = new Set();
    let skippedVideoCount = 0;

    for (const item of rawList) {
      if (!item || !item.url) continue;
      const rawType = String(item.type || '').toLowerCase();
      const isGif =
        rawType === 'gif' ||
        rawType === 'animated_gif' ||
        item.url.includes('/tweet_video/');
      const isVideo = !isGif && rawType === 'video';

      if (isVideo) {
        skippedVideoCount++;
        continue;
      }

      const type = isGif ? 'gif' : 'photo';
      const bestUrl =
        type === 'photo'
          ? item.url
          : pickBestVideoVariant(item.variants, item.url);

      if (seen.has(bestUrl)) continue;
      seen.add(bestUrl);

      media.push({
        id: String(media.length + 1),
        type,
        url: bestUrl,
        thumbnailUrl: item.thumbnail_url || (type === 'photo' ? bestUrl : ''),
        width: item.width || 0,
        height: item.height || 0,
        aspectRatio: computeAspectRatio(item.width, item.height),
        format: type === 'photo' ? detectFormatFromUrl(bestUrl) : 'GIF',
        altText: item.altText || item.alt_text || '',
        duration: typeof item.duration === 'number' ? item.duration : null,
      });
    }

    return {
      id: tweet.id || fallbackId,
      url: tweet.url || `https://x.com/i/status/${tweet.id || fallbackId}`,
      text: tweet.text || '',
      createdAt: tweet.created_at || '',
      author: {
        name: (tweet.author && tweet.author.name) || 'X User',
        handle: (tweet.author && tweet.author.screen_name) || 'unknown',
        avatar: (tweet.author && tweet.author.avatar_url) || '',
      },
      media,
      skippedVideoCount,
    };
  }

  /**
   * Extract ONLY photos and GIFs from VxTwitter response (target tweet only)
   */
  function normalizeVxTwitter(data, fallbackId) {
    if (!data || (!data.tweetID && !data.text && !data.user_screen_name)) {
      throw Object.assign(new Error('接口未返回推文数据'), { code: 'NOT_FOUND' });
    }

    const media = [];
    const seen = new Set();
    let skippedVideoCount = 0;

    if (Array.isArray(data.media_extended) && data.media_extended.length > 0) {
      for (const item of data.media_extended) {
        if (!item || !item.url) continue;
        const rawType = String(item.type || '').toLowerCase();
        const isGif =
          rawType === 'gif' ||
          rawType === 'animated_gif' ||
          item.url.includes('/tweet_video/');
        const isVideo = !isGif && rawType === 'video';

        if (isVideo) {
          skippedVideoCount++;
          continue;
        }

        const type = isGif ? 'gif' : 'photo';
        if (seen.has(item.url)) continue;
        seen.add(item.url);

        const w = (item.size && item.size.width) || 0;
        const h = (item.size && item.size.height) || 0;

        media.push({
          id: String(media.length + 1),
          type,
          url: item.url,
          thumbnailUrl: item.thumbnail_url || (type === 'photo' ? item.url : ''),
          width: w,
          height: h,
          aspectRatio: computeAspectRatio(w, h),
          format: type === 'photo' ? detectFormatFromUrl(item.url) : 'GIF',
          altText: item.altText || '',
          duration:
            typeof item.duration_millis === 'number'
              ? item.duration_millis / 1000
              : null,
        });
      }
    } else if (Array.isArray(data.mediaURLs)) {
      for (const u of data.mediaURLs) {
        if (!u || seen.has(u)) continue;
        const isGif = u.includes('/tweet_video/');
        const isVideo = !isGif && u.includes('video.twimg.com');
        if (isVideo) {
          skippedVideoCount++;
          continue;
        }
        seen.add(u);
        const type = isGif ? 'gif' : 'photo';
        media.push({
          id: String(media.length + 1),
          type,
          url: u,
          thumbnailUrl: type === 'photo' ? u : '',
          width: 0,
          height: 0,
          aspectRatio: '',
          format: type === 'photo' ? detectFormatFromUrl(u) : 'GIF',
          altText: '',
          duration: null,
        });
      }
    }

    return {
      id: data.tweetID || fallbackId,
      url:
        data.tweetURL ||
        `https://x.com/${data.user_screen_name || 'i'}/status/${data.tweetID || fallbackId}`,
      text: data.text || '',
      createdAt: data.date || '',
      author: {
        name: data.user_name || 'X User',
        handle: data.user_screen_name || 'unknown',
        avatar: data.user_profile_image_url || '',
      },
      media,
      skippedVideoCount,
    };
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 11000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const err = new Error((payload && payload.message) || `HTTP ${res.status}`);
        err.status = res.status;
        err.code =
          res.status === 404
            ? 'NOT_FOUND'
            : res.status === 401 || res.status === 403
            ? 'PRIVATE_OR_NSFW'
            : res.status === 429
            ? 'RATE_LIMIT'
            : 'API_ERROR';
        throw err;
      }

      return payload;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        const timeoutErr = new Error('请求超时');
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchTweetMedia(parsed) {
    const userSegment = parsed.user && parsed.user !== 'i' ? parsed.user : 'i';
    const providers = [
      {
        url: `https://api.fxtwitter.com/${userSegment}/status/${parsed.id}`,
        normalizer: (payload) => normalizeFxTwitter(payload, parsed.id),
      },
      {
        url: `https://api.vxtwitter.com/${userSegment === 'i' ? 'Twitter' : userSegment}/status/${parsed.id}`,
        normalizer: (payload) => normalizeVxTwitter(payload, parsed.id),
      },
    ];

    const errors = [];

    for (const provider of providers) {
      try {
        const payload = await fetchJsonWithTimeout(provider.url);
        if (payload && payload.code && payload.code !== 200) {
          const e = new Error(payload.message || `API Code ${payload.code}`);
          e.code =
            payload.code === 404
              ? 'NOT_FOUND'
              : payload.code === 401
              ? 'PRIVATE_OR_NSFW'
              : 'API_ERROR';
          throw e;
        }
        return provider.normalizer(payload);
      } catch (err) {
        errors.push(err);
      }
    }

    const allNotFound = errors.every((e) => e && e.code === 'NOT_FOUND');
    const hasPrivate = errors.some((e) => e && e.code === 'PRIVATE_OR_NSFW');
    const hasRateLimit = errors.some((e) => e && e.code === 'RATE_LIMIT');
    const allTimeout = errors.every((e) => e && e.code === 'TIMEOUT');

    let errorCode = 'NETWORK';
    if (allNotFound) errorCode = 'NOT_FOUND';
    else if (hasPrivate) errorCode = 'PRIVATE';
    else if (hasRateLimit) errorCode = 'RATE_LIMIT';
    else if (allTimeout) errorCode = 'TIMEOUT';

    const finalError = new Error(errorCode);
    finalError.errorCode = errorCode;
    throw finalError;
  }

  Koma.Parser = {
    parseTweetInput,
    buildTwitterPhotoUrl,
    detectFormatFromUrl,
    computeAspectRatio,
    normalizeFxTwitter,
    normalizeVxTwitter,
    fetchTweetMedia,
  };
})(window);
