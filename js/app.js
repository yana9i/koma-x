/* ==========================================================================
   KOMA · Application Controller (Full i18n)
   ========================================================================== */

(function (global) {
  'use strict';

  const Koma = (global.Koma = global.Koma || {});
  const { I18n, Parser, GifEncoder } = Koma;
  const { t } = I18n;
  const gifBlobCache = new Map();

  const ICONS = {
    copy: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    external: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    expand: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 3 6 6"/><path d="M21 3h-6v6"/><path d="m9 21-6-6"/><path d="M3 21h6v-6"/></svg>`,
    pause: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    play: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    imageOff: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  };

  function getInitialTheme() {
    try {
      const saved = global.localStorage.getItem('koma_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  const HISTORY_KEY = 'koma_history_v1';
  const MAX_HISTORY = 25;

  function loadHistory() {
    try {
      const raw = global.localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(list) {
    try {
      global.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  function addHistoryEntry(result) {
    if (!result || !result.id) return state.history;
    const first = result.media && result.media[0];
    const thumb = first ? first.thumbnailUrl || (first.type === 'photo' ? first.url : '') : '';
    const photoCount = (result.media || []).filter((m) => m.type === 'photo').length;
    const gifCount = (result.media || []).filter((m) => m.type === 'gif').length;

    const entry = {
      id: result.id,
      url: result.url,
      savedAt: Date.now(),
      thumb,
      photoCount,
      gifCount,
      author: result.author,
      text: (result.text || '').slice(0, 120),
      payload: result,
    };

    const next = [entry, ...state.history.filter((item) => item.id !== result.id)].slice(0, MAX_HISTORY);
    saveHistory(next);
    return next;
  }

  const state = {
    theme: getInitialTheme(),
    lang: I18n.getLang(),
    loading: false,
    result: null,
    lastErrorCode: null,
    filter: 'all', // 'all' | 'photo' | 'gif'
    quality: 'orig',
    format: 'auto',
    history: loadHistory(),
    lightbox: {
      open: false,
      index: 0,
      zoomed: false,
    },
  };

  const els = {};

  function cacheElements() {
    const ids = [
      'mainStage',
      'heroTitle',
      'urlForm',
      'urlInput',
      'clearInputBtn',
      'pasteBtn',
      'pasteBtnLabel',
      'parseBtn',
      'dockFeedback',
      'dockDetected',
      'errorBanner',
      'errorTitle',
      'errorDetail',
      'loadingState',
      'resultsWorkspace',
      'tweetRibbon',
      'workspaceToolbar',
      'filterGroup',
      'filterTabs',
      'photoControlsGroup',
      'qualityGroup',
      'formatSelect',
      'batchGroup',
      'copyAllBtn',
      'copyAllLabel',
      'mediaGrid',
      'langSwitcher',
      'langToggleBtn',
      'langLabel',
      'langMenu',
      'historyToggleBtn',
      'historyBtnLabel',
      'historyBadge',
      'backdrop',
      'historyDrawer',
      'drawerTitle',
      'closeHistoryBtn',
      'clearHistoryBtn',
      'historyList',
      'themeToggleBtn',
      'shortcutFocus',
      'shortcutNav',
      'shortcutCopy',
      'shortcutClose',
      'lightbox',
      'lbCounter',
      'lbMeta',
      'lbMediaWrap',
      'lbPrev',
      'lbNext',
      'lbUrl',
      'lbCopyBtn',
      'lbOpenBtn',
      'lbDownloadBtn',
      'lbCloseBtn',
      'toastStack',
    ];
    for (const id of ids) {
      els[id] = document.getElementById(id);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatParseError(parsed) {
    if (parsed.code === 'EMPTY') return t('errEmpty');
    if (parsed.code === 'MULTIPLE_URLS') return t('errMultipleUrls', { count: parsed.count });
    if (parsed.code === 'SHORT_URL') return t('errShortUrl');
    return t('errInvalidUrl');
  }

  function formatFetchError(code) {
    if (code === 'NOT_FOUND') return { title: t('errTitleNotFound'), detail: t('errDetailNotFound') };
    if (code === 'PRIVATE') return { title: t('errTitlePrivate'), detail: t('errDetailPrivate') };
    if (code === 'RATE_LIMIT') return { title: t('errTitleRateLimit'), detail: t('errDetailRateLimit') };
    if (code === 'TIMEOUT') return { title: t('errTitleTimeout'), detail: t('errDetailTimeout') };
    return { title: t('errTitleNetwork'), detail: t('errDetailNetwork') };
  }

  function resolveMediaUrl(item) {
    if (item.type === 'photo') {
      return Parser.buildTwitterPhotoUrl(item.url, state.quality, state.format);
    }
    return item.url;
  }

  function getFilteredMedia() {
    if (!state.result || !Array.isArray(state.result.media)) return [];
    if (state.filter === 'all') return state.result.media;
    return state.result.media.filter((item) => item.type === state.filter);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast is-${type}`;
    toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
    els.toastStack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  }

  async function copyText(text, triggerEl, labelAfter) {
    const doneLabel = labelAfter || t('copiedBtn');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      if (triggerEl) {
        const prevHtml = triggerEl.innerHTML;
        triggerEl.classList.add('is-copied');
        triggerEl.innerHTML = `${ICONS.check}<span>${escapeHtml(doneLabel)}</span>`;
        setTimeout(() => {
          triggerEl.classList.remove('is-copied');
          triggerEl.innerHTML = prevHtml;
        }, 1400);
      }
      return true;
    } catch {
      showToast(t('toastCopyFailed'), 'error');
      return false;
    }
  }

  function triggerBlobDownload(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  }

  async function downloadMediaAsset(item, idx, triggerBtn) {
    const safeHandle = (state.result && state.result.author.handle) || 'tweet';
    const safeId = (state.result && state.result.id) || 'media';
    const frameTag = String(idx + 1).padStart(2, '0');

    if (item.type === 'gif') {
      const filename = `${safeHandle}_${safeId}_${frameTag}.gif`;
      const sourceUrl = resolveMediaUrl(item);

      if (gifBlobCache.has(sourceUrl)) {
        triggerBlobDownload(gifBlobCache.get(sourceUrl), filename);
        showToast(t('toastSavedFile', { filename }), 'success');
        return;
      }

      if (triggerBtn && triggerBtn.dataset.busy === '1') return;
      const origHtml = triggerBtn ? triggerBtn.innerHTML : '';
      const setBtnLabel = (text) => {
        if (triggerBtn) {
          triggerBtn.disabled = true;
          triggerBtn.dataset.busy = '1';
          triggerBtn.innerHTML = `<span class="spinner"></span><span>${escapeHtml(text)}</span>`;
        }
      };

      try {
        setBtnLabel(t('gifFetching'));
        const gifBlob = await GifEncoder.convertTweetGifUrlToBlob(sourceUrl, {
          onStage: (stage) => {
            if (stage === 'fetching') setBtnLabel(t('gifFetching'));
            else if (stage === 'encoding') setBtnLabel(t('gifEncoding', { pct: 0 }));
          },
          onProgress: (pct) => {
            setBtnLabel(t('gifEncoding', { pct }));
          },
        });

        gifBlobCache.set(sourceUrl, gifBlob);
        triggerBlobDownload(gifBlob, filename);
        showToast(
          t('toastSavedGif', { filename, kb: (gifBlob.size / 1024).toFixed(0) }),
          'success'
        );
      } catch (err) {
        console.error('[KOMA GIF Download Error]', err);
        showToast(t('toastGifFailed'), 'error');
      } finally {
        if (triggerBtn) {
          triggerBtn.disabled = false;
          delete triggerBtn.dataset.busy;
          triggerBtn.innerHTML = origHtml;
        }
      }
      return;
    }

    const targetUrl = resolveMediaUrl(item);
    const ext =
      state.format === 'auto'
        ? (item.format || 'jpg').toLowerCase()
        : state.format;
    const filename = `${safeHandle}_${safeId}_${frameTag}.${ext}`;

    showToast(t('toastDownloadingPhoto'), 'info');
    try {
      const blob = await GifEncoder.fetchBinary(targetUrl);
      triggerBlobDownload(blob, filename);
      showToast(t('toastSavedFile', { filename }), 'success');
    } catch {
      global.open(targetUrl, '_blank', 'noopener,noreferrer');
      showToast(t('toastCorsFallbackPhoto'), 'info');
    }
  }

  /* ---------------- Theme & Language ---------------- */
  function updateThemeButtonMeta() {
    const title = state.theme === 'dark' ? t('themeToLight') : t('themeToDark');
    els.themeToggleBtn.innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;
    els.themeToggleBtn.title = title;
    els.themeToggleBtn.setAttribute('aria-label', title);
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      global.localStorage.setItem('koma_theme', theme);
    } catch {
      // ignore
    }
    updateThemeButtonMeta();
  }

  function closeLangMenu() {
    els.langMenu.hidden = true;
    els.langToggleBtn.setAttribute('aria-expanded', 'false');
  }

  function applyLanguage(lang) {
    state.lang = I18n.setLang(lang);
    document.title = t('pageTitle');

    // Header
    els.langLabel.textContent = t('langShort');
    els.langToggleBtn.title = t('langLabel');
    els.langMenu.querySelectorAll('.lang-option').forEach((opt) => {
      const active = opt.dataset.lang === state.lang;
      opt.classList.toggle('is-active', active);
      opt.setAttribute('aria-selected', String(active));
    });

    els.historyBtnLabel.textContent = t('historyBtn');
    els.historyToggleBtn.title = t('historyTitle');
    updateThemeButtonMeta();

    // Hero & Input Dock
    els.heroTitle.innerHTML = t('heroHtml');
    els.urlInput.placeholder = t('inputPlaceholder');
    els.urlInput.setAttribute('aria-label', t('inputAria'));
    els.clearInputBtn.title = t('clearTitle');
    els.pasteBtnLabel.textContent = t('pasteBtn');
    els.pasteBtn.title = t('pasteTitle');
    if (!state.loading) {
      els.parseBtn.innerHTML = `<span>${escapeHtml(t('parseBtn'))}</span>`;
    } else {
      els.parseBtn.innerHTML = `<span class="spinner"></span><span>${escapeHtml(t('parsingBtn'))}</span>`;
    }

    // Toolbar & Footer
    els.copyAllLabel.textContent = t('copyAllBtn');
    els.shortcutFocus.textContent = t('shortcutFocus');
    els.shortcutNav.textContent = t('shortcutNav');
    els.shortcutCopy.textContent = t('shortcutCopy');
    els.shortcutClose.textContent = t('shortcutClose');

    // Drawer
    els.drawerTitle.textContent = t('drawerTitle');
    els.clearHistoryBtn.textContent = t('drawerClear');
    els.closeHistoryBtn.setAttribute('aria-label', t('drawerClose'));

    // Lightbox static labels
    els.lbCopyBtn.textContent = t('copyUrlBtn');
    els.lbOpenBtn.textContent = t('openNewTabBtn');
    els.lbPrev.setAttribute('aria-label', t('lbPrev'));
    els.lbNext.setAttribute('aria-label', t('lbNext'));
    els.lbCloseBtn.setAttribute('aria-label', t('drawerClose'));

    // Re-render dynamic views seamlessly
    updateInputFeedback();
    renderHistory();

    if (!els.errorBanner.hidden && state.lastErrorCode) {
      const err = formatFetchError(state.lastErrorCode);
      els.errorTitle.textContent = err.title;
      els.errorDetail.textContent = err.detail;
    }

    if (state.result) {
      renderWorkspace();
    }

    if (state.lightbox.open) {
      renderLightbox();
    }
  }

  /* ---------------- Live Input Recognition ---------------- */
  function updateInputFeedback() {
    const trimmed = els.urlInput.value.trim();
    els.clearInputBtn.hidden = trimmed.length === 0;

    if (!trimmed) {
      els.urlForm.classList.remove('is-valid');
      els.dockFeedback.hidden = true;
      return;
    }

    const parsed = Parser.parseTweetInput(trimmed);
    els.dockFeedback.hidden = false;

    if (parsed.ok) {
      els.urlForm.classList.add('is-valid');
      els.dockDetected.innerHTML = `
        <span class="tag-ok">${escapeHtml(t('dockReady'))}</span>
        <span>@${escapeHtml(parsed.user)} · #${escapeHtml(parsed.id)}</span>
      `;
    } else if (parsed.code === 'SHORT_URL' || parsed.code === 'MULTIPLE_URLS') {
      els.urlForm.classList.remove('is-valid');
      els.dockDetected.innerHTML = `<span class="tag-warn">${escapeHtml(t('dockNotice'))}</span><span>${escapeHtml(formatParseError(parsed))}</span>`;
    } else {
      els.urlForm.classList.remove('is-valid');
      els.dockDetected.innerHTML = `<span class="tag-err">${escapeHtml(t('dockInvalid'))}</span><span>${escapeHtml(formatParseError(parsed))}</span>`;
    }
  }

  /* ---------------- Parsing Flow ---------------- */
  function setLoading(isLoading) {
    state.loading = isLoading;
    els.parseBtn.disabled = isLoading;
    els.parseBtn.innerHTML = isLoading
      ? `<span class="spinner"></span><span>${escapeHtml(t('parsingBtn'))}</span>`
      : `<span>${escapeHtml(t('parseBtn'))}</span>`;
    els.loadingState.hidden = !isLoading;
    if (isLoading) {
      els.errorBanner.hidden = true;
      els.resultsWorkspace.hidden = true;
    }
  }

  function showError(errorCode) {
    state.lastErrorCode = errorCode || 'NETWORK';
    const err = formatFetchError(state.lastErrorCode);
    els.errorTitle.textContent = err.title;
    els.errorDetail.textContent = err.detail;
    els.errorBanner.hidden = false;
    els.resultsWorkspace.hidden = true;
  }

  async function handleParseSubmit(rawValue) {
    const input = rawValue !== undefined ? rawValue : els.urlInput.value;
    const parsed = Parser.parseTweetInput(input);

    if (!parsed.ok) {
      updateInputFeedback();
      showToast(formatParseError(parsed), 'error');
      els.urlInput.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await Parser.fetchTweetMedia(parsed);
      state.lastErrorCode = null;
      state.result = result;
      state.filter = 'all';
      state.history = addHistoryEntry(result);
      renderHistory();
      renderWorkspace();

      if (result.media.length > 0) {
        showToast(t('toastExtracted', { count: result.media.length }), 'success');
      } else if (result.skippedVideoCount > 0) {
        showToast(t('toastOnlyVideo'), 'info');
      } else {
        showToast(t('toastNoMedia'), 'info');
      }
    } catch (err) {
      showError((err && err.errorCode) || 'NETWORK');
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- Render Workspace ---------------- */
  function renderWorkspace() {
    const result = state.result;
    if (!result) return;

    els.mainStage.classList.add('has-results');
    els.errorBanner.hidden = true;
    els.resultsWorkspace.hidden = false;

    renderTweetRibbon(result);
    renderToolbar(result);
    renderMediaGrid();
  }

  function renderTweetRibbon(result) {
    const initials = (result.author.name || result.author.handle || 'X')
      .slice(0, 2)
      .toUpperCase();

    const avatarHtml = result.author.avatar
      ? `<img src="${escapeHtml(result.author.avatar)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" />`
      : '';

    const needsExpand = (result.text || '').length > 130;

    els.tweetRibbon.innerHTML = `
      <div class="tweet-author-block">
        <div class="author-avatar">${avatarHtml}<span>${escapeHtml(initials)}</span></div>
        <div class="tweet-meta">
          <div class="author-line">
            <span class="author-name">${escapeHtml(result.author.name)}</span>
            <span class="author-handle">@${escapeHtml(result.author.handle)}</span>
            ${result.createdAt ? `<span class="tweet-date">· ${escapeHtml(result.createdAt)}</span>` : ''}
          </div>
          ${result.text ? `<p class="tweet-text" id="tweetTextBody">${escapeHtml(result.text)}</p>` : ''}
          ${needsExpand ? `<button type="button" class="expand-text-btn" id="expandTweetTextBtn">${escapeHtml(t('expandText'))}</button>` : ''}
        </div>
      </div>
      <a class="source-link" href="${escapeHtml(result.url)}" target="_blank" rel="noopener noreferrer">
        <span>${escapeHtml(t('sourceTweet'))}</span>
        ${ICONS.external}
      </a>
    `;

    const expandBtn = document.getElementById('expandTweetTextBtn');
    const textBody = document.getElementById('tweetTextBody');
    if (expandBtn && textBody) {
      expandBtn.addEventListener('click', () => {
        const expanded = textBody.classList.toggle('is-expanded');
        expandBtn.textContent = expanded ? t('collapseText') : t('expandText');
      });
    }
  }

  function renderToolbar(result) {
    const media = result.media || [];
    const photoCount = media.filter((m) => m.type === 'photo').length;
    const gifCount = media.filter((m) => m.type === 'gif').length;

    const showFilter = photoCount > 0 && gifCount > 0;
    const showPhotoControls = photoCount > 0;
    const showBatch = media.length > 1;

    els.filterGroup.hidden = !showFilter;
    els.photoControlsGroup.hidden = !showPhotoControls;
    els.batchGroup.hidden = !showBatch;
    els.workspaceToolbar.hidden = !showFilter && !showPhotoControls && !showBatch;

    if (showFilter) {
      const tabs = [
        { key: 'all', label: t('filterAll'), count: media.length },
        { key: 'photo', label: t('filterPhoto'), count: photoCount },
        { key: 'gif', label: t('filterGif'), count: gifCount },
      ];
      els.filterTabs.innerHTML = tabs
        .map(
          (tab) => `
          <button
            type="button"
            class="filter-tab ${state.filter === tab.key ? 'is-active' : ''}"
            data-filter="${tab.key}"
          >
            <span>${escapeHtml(tab.label)}</span>
            <span class="tab-num">${tab.count}</span>
          </button>`
        )
        .join('');
    }

    els.qualityGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.quality === state.quality);
    });
    els.formatSelect.value = state.format;
  }

  function renderMediaGrid() {
    const items = getFilteredMedia();
    els.mediaGrid.dataset.count = String(items.length);

    if (items.length === 0) {
      const hasSkippedVideo = state.result && state.result.skippedVideoCount > 0;
      els.mediaGrid.innerHTML = `
        <div class="empty-media-card">
          <div class="empty-media-icon">${ICONS.imageOff}</div>
          <h3 style="font-size:0.96rem;font-weight:650;">${escapeHtml(
            hasSkippedVideo ? t('emptyOnlyVideo') : t('emptyNoMedia')
          )}</h3>
        </div>
      `;
      return;
    }

    els.mediaGrid.innerHTML = items
      .map((item, idx) => renderMediaCardHtml(item, idx))
      .join('');

    bindMediaCardEvents(items);
  }

  function renderMediaCardHtml(item, idx) {
    const frameIndex = String(idx + 1).padStart(2, '0');
    const resolvedUrl = resolveMediaUrl(item);

    const badgeHtml =
      item.type === 'gif'
        ? `<span class="type-badge is-gif"><span class="live-dot"></span>GIF</span>`
        : `<span class="type-badge is-photo">PHOTO · ${state.format === 'auto' ? item.format : state.format.toUpperCase()}</span>`;

    const mediaElementHtml =
      item.type === 'photo'
        ? `<img src="${escapeHtml(resolvedUrl)}" alt="${escapeHtml(item.altText || t('frameAlt', { num: frameIndex }))}" loading="lazy" referrerpolicy="no-referrer" data-role="preview-img" />`
        : `<video src="${escapeHtml(resolvedUrl)}" poster="${escapeHtml(item.thumbnailUrl || '')}" autoplay loop muted playsinline preload="metadata" data-role="preview-video"></video>`;

    const chips = [];
    if (item.width && item.height) {
      chips.push(`<span class="meta-chip">${item.width} × ${item.height}</span>`);
    }
    if (item.aspectRatio) {
      chips.push(`<span class="meta-chip">${escapeHtml(item.aspectRatio)}</span>`);
    }
    if (item.type === 'photo') {
      const qLabel = state.quality === 'orig' ? 'ORIG' : state.quality === '4096x4096' ? '4K' : state.quality.toUpperCase();
      chips.push(`<span class="meta-chip accent">${qLabel}</span>`);
    } else if (item.duration) {
      chips.push(`<span class="meta-chip">${item.duration.toFixed(1)}s</span>`);
    }

    const altHtml = item.altText
      ? `<div class="alt-strip"><span class="alt-label">ALT</span><span class="alt-text" title="${escapeHtml(item.altText)}">${escapeHtml(item.altText)}</span></div>`
      : '';

    const posterBtnHtml =
      item.type === 'gif' && item.thumbnailUrl
        ? `<button type="button" class="btn-secondary-sm" data-action="copy-poster" data-idx="${idx}" title="${escapeHtml(t('posterTitle'))}">${escapeHtml(t('posterBtn'))}</button>`
        : '';

    const playPauseControl =
      item.type === 'gif'
        ? `<button type="button" class="vp-btn" data-action="toggle-play" data-idx="${idx}" title="${escapeHtml(t('playPauseTitle'))}">${ICONS.pause}</button>`
        : '';

    return `
      <article class="media-card" style="animation-delay:${Math.min(idx * 55, 240)}ms">
        <div class="media-viewport" data-action="open-lightbox" data-idx="${idx}">
          <div class="viewport-top-bar">
            <span class="frame-num">FRAME ${frameIndex}</span>
            ${badgeHtml}
          </div>
          ${mediaElementHtml}
          <div class="viewport-controls">
            ${playPauseControl}
            <button type="button" class="vp-btn" data-action="open-lightbox" data-idx="${idx}" title="${escapeHtml(t('lightboxTitle'))}">${ICONS.expand}</button>
          </div>
        </div>
        <div class="media-body">
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div class="media-meta-row">
              <div class="meta-chips">${chips.join('')}</div>
            </div>
            ${altHtml}
            <div class="url-box" title="${escapeHtml(resolvedUrl)}">
              <span class="url-text">${escapeHtml(resolvedUrl)}</span>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-primary-sm" data-action="copy-url" data-idx="${idx}">
              ${ICONS.copy}
              <span>${escapeHtml(t('copyUrlBtn'))}</span>
            </button>
            ${posterBtnHtml}
            <button type="button" class="btn-secondary-sm" data-action="download" data-idx="${idx}">
              ${ICONS.download}
              <span>${escapeHtml(item.type === 'gif' ? t('downloadGifBtn') : t('downloadBtn'))}</span>
            </button>
            <a
              class="btn-secondary-sm"
              href="${escapeHtml(resolvedUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              title="${escapeHtml(t('openNewTabTitle'))}"
            >
              ${ICONS.external}
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function bindMediaCardEvents(items) {
    els.mediaGrid.querySelectorAll('img[data-role="preview-img"]').forEach((img) => {
      img.addEventListener('error', () => {
        const vp = img.closest('.media-viewport');
        if (!vp || vp.querySelector('.media-fallback')) return;
        img.style.display = 'none';
        const fb = document.createElement('div');
        fb.className = 'media-fallback';
        fb.innerHTML = `${ICONS.imageOff}<p>${escapeHtml(t('previewFailed'))}</p>`;
        vp.appendChild(fb);
      });
    });

    els.mediaGrid.onclick = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const idx = Number(btn.dataset.idx);
      const item = items[idx];
      if (!item) return;

      if (action === 'toggle-play') {
        e.stopPropagation();
        const card = btn.closest('.media-card');
        const video = card && card.querySelector('video');
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
            btn.innerHTML = ICONS.pause;
          } else {
            video.pause();
            btn.innerHTML = ICONS.play;
          }
        }
        return;
      }

      if (action === 'open-lightbox') {
        openLightbox(idx);
        return;
      }

      if (action === 'copy-url') {
        copyText(resolveMediaUrl(item), btn, t('copiedBtn')).then((ok) => {
          if (ok) showToast(t('toastCopiedFrame', { num: String(idx + 1).padStart(2, '0') }), 'success');
        });
        return;
      }

      if (action === 'copy-poster') {
        copyText(item.thumbnailUrl, null).then((ok) => {
          if (ok) showToast(t('toastCopiedPoster'), 'success');
        });
        return;
      }

      if (action === 'download') {
        downloadMediaAsset(item, idx, btn);
      }
    };
  }

  /* ---------------- History Drawer ---------------- */
  function formatRelativeTime(timestamp) {
    const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 60) return t('timeJustNow');
    if (diffSec < 3600) return t('timeMinutesAgo', { n: Math.floor(diffSec / 60) });
    if (diffSec < 86400) return t('timeHoursAgo', { n: Math.floor(diffSec / 3600) });
    return t('timeDaysAgo', { n: Math.floor(diffSec / 86400) });
  }

  function renderHistory() {
    const list = state.history;
    els.historyBadge.textContent = String(list.length);
    els.historyBadge.hidden = list.length === 0;

    if (!list.length) {
      els.historyList.innerHTML = `<div class="drawer-empty">${escapeHtml(t('drawerEmpty'))}</div>`;
      return;
    }

    els.historyList.innerHTML = list
      .map((entry) => {
        const stats = [];
        if (entry.photoCount) stats.push(t('historyPhotoCount', { count: entry.photoCount }));
        if (entry.gifCount) stats.push(t('historyGifCount', { count: entry.gifCount }));
        const thumbHtml = entry.thumb
          ? `<img src="${escapeHtml(entry.thumb)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" />`
          : ICONS.imageOff;

        const authorName = (entry.author && entry.author.name) || 'X User';
        const authorHandle = (entry.author && entry.author.handle) || 'unknown';

        return `
          <div class="history-item" data-history-id="${escapeHtml(entry.id)}" role="button" tabindex="0">
            <div class="history-thumb">${thumbHtml}</div>
            <div class="history-meta">
              <div class="history-author">${escapeHtml(authorName)} <span style="color:var(--ink-tertiary);font-weight:400;">@${escapeHtml(authorHandle)}</span></div>
              <div class="history-snippet">${escapeHtml(entry.text || entry.url)}</div>
              <div class="history-foot">
                <span>${escapeHtml(stats.join(' · ') || t('historyNoMedia'))}</span>
                <span>·</span>
                <span>${escapeHtml(formatRelativeTime(entry.savedAt))}</span>
              </div>
            </div>
            <button type="button" class="history-del" data-delete-id="${escapeHtml(entry.id)}" title="${escapeHtml(t('historyDeleteTitle'))}">${ICONS.trash}</button>
          </div>
        `;
      })
      .join('');
  }

  function openDrawer() {
    closeLangMenu();
    els.backdrop.classList.add('is-open');
    els.historyDrawer.classList.add('is-open');
  }

  function closeDrawer() {
    els.historyDrawer.classList.remove('is-open');
    els.backdrop.classList.remove('is-open');
  }

  function restoreHistoryById(id) {
    const entry = state.history.find((h) => h.id === id);
    if (entry && entry.payload) {
      els.urlInput.value = entry.url;
      updateInputFeedback();
      state.result = entry.payload;
      state.filter = 'all';
      renderWorkspace();
      closeDrawer();
      showToast(t('toastHistoryRestored'), 'info');
    }
  }

  /* ---------------- Lightbox ---------------- */
  function openLightbox(index) {
    const items = getFilteredMedia();
    if (!items.length) return;
    closeLangMenu();
    state.lightbox.open = true;
    state.lightbox.index = Math.max(0, Math.min(index, items.length - 1));
    state.lightbox.zoomed = false;
    renderLightbox();
    els.lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!state.lightbox.open) return;
    state.lightbox.open = false;
    state.lightbox.zoomed = false;
    els.lightbox.classList.remove('is-open');
    els.lbMediaWrap.innerHTML = '';
    document.body.style.overflow = '';
  }

  function renderLightbox() {
    const items = getFilteredMedia();
    const item = items[state.lightbox.index];
    if (!item) return;

    const resolvedUrl = resolveMediaUrl(item);
    els.lbCounter.textContent = `${String(state.lightbox.index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    const metaParts = [item.type.toUpperCase()];
    if (item.width && item.height) metaParts.push(`${item.width}×${item.height}`);
    if (item.aspectRatio) metaParts.push(item.aspectRatio);
    els.lbMeta.textContent = metaParts.join(' · ');
    els.lbUrl.textContent = resolvedUrl;
    els.lbOpenBtn.href = resolvedUrl;
    els.lbDownloadBtn.textContent = item.type === 'gif' ? t('downloadGifBtn') : t('downloadBtn');

    els.lbPrev.hidden = items.length <= 1;
    els.lbNext.hidden = items.length <= 1;
    els.lbMediaWrap.classList.toggle('is-zoomed', state.lightbox.zoomed);

    if (item.type === 'photo') {
      els.lbMediaWrap.innerHTML = `<img src="${escapeHtml(resolvedUrl)}" alt="${escapeHtml(item.altText || '')}" referrerpolicy="no-referrer" />`;
      const img = els.lbMediaWrap.querySelector('img');
      if (img) {
        img.addEventListener('click', () => {
          state.lightbox.zoomed = !state.lightbox.zoomed;
          els.lbMediaWrap.classList.toggle('is-zoomed', state.lightbox.zoomed);
        });
      }
    } else {
      els.lbMediaWrap.innerHTML = `<video src="${escapeHtml(resolvedUrl)}" controls autoplay loop muted playsinline></video>`;
    }
  }

  function stepLightbox(delta) {
    const items = getFilteredMedia();
    if (items.length <= 1) return;
    state.lightbox.index = (state.lightbox.index + delta + items.length) % items.length;
    state.lightbox.zoomed = false;
    renderLightbox();
  }

  /* ---------------- Events ---------------- */
  function bindEvents() {
    // Theme toggle
    els.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Language switcher
    els.langToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = els.langMenu.hidden;
      els.langMenu.hidden = !willOpen;
      els.langToggleBtn.setAttribute('aria-expanded', String(willOpen));
    });

    els.langMenu.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-lang]');
      if (!opt) return;
      applyLanguage(opt.dataset.lang);
      closeLangMenu();
    });

    document.addEventListener('click', (e) => {
      if (!els.langMenu.hidden && !els.langSwitcher.contains(e.target)) {
        closeLangMenu();
      }
    });

    // URL Form
    els.urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleParseSubmit();
    });

    els.urlInput.addEventListener('input', updateInputFeedback);
    els.urlInput.addEventListener('paste', () => setTimeout(updateInputFeedback, 10));

    els.clearInputBtn.addEventListener('click', () => {
      els.urlInput.value = '';
      updateInputFeedback();
      els.urlInput.focus();
    });

    els.pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          els.urlInput.value = text.trim();
          updateInputFeedback();
          const parsed = Parser.parseTweetInput(text.trim());
          if (parsed.ok) handleParseSubmit(text.trim());
        } else {
          showToast(t('toastClipboardEmpty'), 'info');
        }
      } catch {
        els.urlInput.focus();
        showToast(t('toastPasteManual'), 'info');
      }
    });

    els.filterTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      state.filter = btn.dataset.filter;
      renderToolbar(state.result);
      renderMediaGrid();
    });

    els.qualityGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quality]');
      if (!btn) return;
      state.quality = btn.dataset.quality;
      renderToolbar(state.result);
      renderMediaGrid();
    });

    els.formatSelect.addEventListener('change', () => {
      state.format = els.formatSelect.value;
      renderMediaGrid();
    });

    els.copyAllBtn.addEventListener('click', () => {
      const items = getFilteredMedia();
      if (!items.length) return;
      const output = items.map(resolveMediaUrl).join('\n');
      copyText(output, els.copyAllBtn, t('copiedCount', { count: items.length })).then((ok) => {
        if (ok) showToast(t('toastCopiedAll', { count: items.length }), 'success');
      });
    });

    els.historyToggleBtn.addEventListener('click', openDrawer);
    els.closeHistoryBtn.addEventListener('click', closeDrawer);
    els.backdrop.addEventListener('click', closeDrawer);
    els.clearHistoryBtn.addEventListener('click', () => {
      state.history = [];
      saveHistory([]);
      renderHistory();
      showToast(t('toastHistoryCleared'), 'info');
    });

    els.historyList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-delete-id]');
      if (delBtn) {
        e.stopPropagation();
        state.history = state.history.filter((item) => item.id !== delBtn.dataset.deleteId);
        saveHistory(state.history);
        renderHistory();
        return;
      }
      const row = e.target.closest('[data-history-id]');
      if (row) restoreHistoryById(row.dataset.historyId);
    });

    els.historyList.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('[data-history-id]');
      if (row && !e.target.closest('[data-delete-id]')) {
        e.preventDefault();
        restoreHistoryById(row.dataset.historyId);
      }
    });

    els.lbCloseBtn.addEventListener('click', closeLightbox);
    els.lbPrev.addEventListener('click', () => stepLightbox(-1));
    els.lbNext.addEventListener('click', () => stepLightbox(1));
    els.lbCopyBtn.addEventListener('click', () => {
      const items = getFilteredMedia();
      const item = items[state.lightbox.index];
      if (!item) return;
      copyText(resolveMediaUrl(item), els.lbCopyBtn, t('copiedBtn')).then((ok) => {
        if (ok) showToast(t('toastCopiedCurrent'), 'success');
      });
    });
    els.lbDownloadBtn.addEventListener('click', () => {
      const items = getFilteredMedia();
      const item = items[state.lightbox.index];
      if (item) downloadMediaAsset(item, state.lightbox.index, els.lbDownloadBtn);
    });

    document.addEventListener('keydown', (e) => {
      if (state.lightbox.open) {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') stepLightbox(-1);
        else if (e.key === 'ArrowRight') stepLightbox(1);
        else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
          els.lbCopyBtn.click();
        }
        return;
      }

      if (e.key === 'Escape') {
        closeLangMenu();
        closeDrawer();
        return;
      }

      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (!isTyping && e.key === '/')) {
        e.preventDefault();
        els.urlInput.focus();
        els.urlInput.select();
      }
    });
  }

  function init() {
    cacheElements();
    applyTheme(state.theme);
    bindEvents();
    applyLanguage(state.lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
