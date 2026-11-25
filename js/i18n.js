/* ==========================================================================
   KOMA · Internationalization (zh-CN / en / ja)
   ========================================================================== */

(function (global) {
  'use strict';

  const Koma = (global.Koma = global.Koma || {});
  const LANG_KEY = 'koma_lang';
  const SUPPORTED = ['zh-CN', 'en', 'ja'];

  const MESSAGES = {
    'zh-CN': {
      pageTitle: 'KOMA — X / Twitter 推文媒体解析',
      langShort: '中文',
      langLabel: '切换语言',
      historyBtn: '历史',
      historyTitle: '解析历史',
      themeToDark: '切换暗房模式',
      themeToLight: '切换浅色模式',

      heroHtml:
        '提取推文中的<span class="editorial-accent">静像</span>与<span class="editorial-accent">动图</span>',

      inputPlaceholder: '粘贴 X / Twitter 推文链接',
      inputAria: 'X / Twitter 推文链接',
      clearTitle: '清空',
      pasteBtn: '粘贴',
      pasteTitle: '从剪贴板粘贴',
      parseBtn: '解析',
      parsingBtn: '解析中',

      dockReady: 'READY',
      dockNotice: 'NOTICE',
      dockInvalid: 'INVALID',

      errEmpty: '请输入推文链接',
      errMultipleUrls: '检测到 {count} 条推文链接，请每次输入单条链接',
      errShortUrl: '纯前端无法直接展开 t.co 短链，请粘贴展开后的完整推文链接',
      errInvalidUrl: '未识别到有效的 X / Twitter 推文链接',

      errTitleNotFound: '找不到该推文',
      errDetailNotFound: '该推文可能已被删除、链接有误或属于私密账号。',
      errTitlePrivate: '无权访问该推文',
      errDetailPrivate: '私密账号或受限内容无法通过公开接口获取。',
      errTitleRateLimit: '请求过于频繁',
      errDetailRateLimit: '解析接口触发频率限制，请稍后重试。',
      errTitleTimeout: '请求超时',
      errDetailTimeout: '解析接口响应超时，请稍后重试。',
      errTitleNetwork: '网络请求失败',
      errDetailNetwork: '无法连接到解析接口，请检查网络连接后重试。',
      errTitleGeneric: '解析失败',

      expandText: '展开全文',
      collapseText: '收起',
      sourceTweet: '原推文',

      filterAll: '全部',
      filterPhoto: '图片',
      filterGif: '动图',
      copyAllBtn: '复制全部链接',
      copiedCount: '已复制 {count} 条',

      emptyOnlyVideo: '该推文仅包含视频，不含图片或动图',
      emptyNoMedia: '该推文不包含图片或动图',
      previewFailed: '直链已提取，预览图加载失败',

      frameAlt: '帧 {num}',
      playPauseTitle: '播放/暂停',
      lightboxTitle: '全屏预览',
      openNewTabTitle: '在新标签页打开',
      openNewTabBtn: '新标签打开',
      copyUrlBtn: '复制直链',
      copiedBtn: '已复制',
      posterBtn: '封面图',
      posterTitle: '复制封面图直链',
      downloadBtn: '下载',
      downloadGifBtn: '下载 GIF',
      gifFetching: '拉取中…',
      gifEncoding: '转码 {pct}%',

      shortcutFocus: '输入',
      shortcutNav: '切帧',
      shortcutCopy: '复制',
      shortcutClose: '关闭',

      drawerTitle: '历史',
      drawerClear: '清空',
      drawerClose: '关闭',
      drawerEmpty: '暂无记录',
      historyPhotoCount: '{count} 图',
      historyGifCount: '{count} 动图',
      historyNoMedia: '无媒体',
      historyDeleteTitle: '删除',
      timeJustNow: '刚刚',
      timeMinutesAgo: '{n} 分钟前',
      timeHoursAgo: '{n} 小时前',
      timeDaysAgo: '{n} 天前',

      lbPrev: '上一帧',
      lbNext: '下一帧',

      toastExtracted: '提取到 {count} 项媒体',
      toastOnlyVideo: '该推文仅包含视频，不含图片或动图',
      toastNoMedia: '该推文不包含图片或动图',
      toastCopiedFrame: '已复制第 {num} 帧直链',
      toastCopiedCurrent: '已复制当前帧直链',
      toastCopiedAll: '已复制 {count} 条直链',
      toastCopiedPoster: '已复制封面图直链',
      toastCopyFailed: '复制失败，请手动选中链接复制',
      toastSavedFile: '已保存 {filename}',
      toastSavedGif: '已保存 {filename} ({kb} KB)',
      toastDownloadingPhoto: '正在下载原图…',
      toastCorsFallbackPhoto: '跨域受限，已在新标签页打开图片',
      toastGifFailed: 'GIF 拉取或转码失败，请稍后重试',
      toastClipboardEmpty: '剪贴板为空',
      toastPasteManual: '请使用 ⌘V / Ctrl+V 粘贴',
      toastHistoryCleared: '已清空历史',
      toastHistoryRestored: '已恢复历史记录',
    },

    en: {
      pageTitle: 'KOMA — X / Twitter Media Extractor',
      langShort: 'EN',
      langLabel: 'Switch language',
      historyBtn: 'History',
      historyTitle: 'History',
      themeToDark: 'Switch to darkroom mode',
      themeToLight: 'Switch to light mode',

      heroHtml:
        'Extract <span class="editorial-accent">stills</span> &amp; <span class="editorial-accent">GIFs</span> from any post',

      inputPlaceholder: 'Paste an X / Twitter post URL',
      inputAria: 'X / Twitter post URL',
      clearTitle: 'Clear',
      pasteBtn: 'Paste',
      pasteTitle: 'Paste from clipboard',
      parseBtn: 'Extract',
      parsingBtn: 'Parsing',

      dockReady: 'READY',
      dockNotice: 'NOTICE',
      dockInvalid: 'INVALID',

      errEmpty: 'Enter a post URL',
      errMultipleUrls: '{count} post URLs detected — please enter one at a time',
      errShortUrl: 't.co short links cannot be expanded client-side — paste the full post URL',
      errInvalidUrl: 'No valid X / Twitter post URL recognized',

      errTitleNotFound: 'Post not found',
      errDetailNotFound: 'This post may have been deleted, invalid, or from a protected account.',
      errTitlePrivate: 'Access restricted',
      errDetailPrivate: 'Protected or restricted posts cannot be fetched via public endpoints.',
      errTitleRateLimit: 'Rate limited',
      errDetailRateLimit: 'The resolver endpoint is rate-limiting requests. Try again shortly.',
      errTitleTimeout: 'Request timed out',
      errDetailTimeout: 'The resolver endpoint took too long to respond. Please retry.',
      errTitleNetwork: 'Network error',
      errDetailNetwork: 'Unable to reach the resolver endpoint. Check your connection and retry.',
      errTitleGeneric: 'Extraction failed',

      expandText: 'Show more',
      collapseText: 'Show less',
      sourceTweet: 'View post',

      filterAll: 'All',
      filterPhoto: 'Photos',
      filterGif: 'GIFs',
      copyAllBtn: 'Copy all URLs',
      copiedCount: 'Copied {count}',

      emptyOnlyVideo: 'This post contains only video, no images or GIFs',
      emptyNoMedia: 'No images or GIFs found in this post',
      previewFailed: 'Direct URL extracted, preview unavailable',

      frameAlt: 'Frame {num}',
      playPauseTitle: 'Play / Pause',
      lightboxTitle: 'Inspect fullscreen',
      openNewTabTitle: 'Open in new tab',
      openNewTabBtn: 'Open',
      copyUrlBtn: 'Copy URL',
      copiedBtn: 'Copied',
      posterBtn: 'Poster',
      posterTitle: 'Copy GIF poster URL',
      downloadBtn: 'Save',
      downloadGifBtn: 'Save GIF',
      gifFetching: 'Fetching…',
      gifEncoding: 'GIF {pct}%',

      shortcutFocus: 'Focus',
      shortcutNav: 'Navigate',
      shortcutCopy: 'Copy',
      shortcutClose: 'Close',

      drawerTitle: 'History',
      drawerClear: 'Clear',
      drawerClose: 'Close',
      drawerEmpty: 'No history yet',
      historyPhotoCount: '{count} photos',
      historyGifCount: '{count} GIFs',
      historyNoMedia: 'No media',
      historyDeleteTitle: 'Delete',
      timeJustNow: 'Just now',
      timeMinutesAgo: '{n}m ago',
      timeHoursAgo: '{n}h ago',
      timeDaysAgo: '{n}d ago',

      lbPrev: 'Previous frame',
      lbNext: 'Next frame',

      toastExtracted: 'Extracted {count} media items',
      toastOnlyVideo: 'This post contains only video, no images or GIFs',
      toastNoMedia: 'No images or GIFs found in this post',
      toastCopiedFrame: 'Copied frame {num} URL',
      toastCopiedCurrent: 'Copied current frame URL',
      toastCopiedAll: 'Copied {count} URLs',
      toastCopiedPoster: 'Copied poster image URL',
      toastCopyFailed: 'Copy failed — please copy manually',
      toastSavedFile: 'Saved {filename}',
      toastSavedGif: 'Saved {filename} ({kb} KB)',
      toastDownloadingPhoto: 'Downloading image…',
      toastCorsFallbackPhoto: 'Opened original image in new tab',
      toastGifFailed: 'Failed to fetch or encode GIF — please retry',
      toastClipboardEmpty: 'Clipboard is empty',
      toastPasteManual: 'Press ⌘V / Ctrl+V to paste',
      toastHistoryCleared: 'History cleared',
      toastHistoryRestored: 'Restored from history',
    },

    ja: {
      pageTitle: 'KOMA — X / Twitter メディア抽出',
      langShort: '日本語',
      langLabel: '言語を切替',
      historyBtn: '履歴',
      historyTitle: '解析履歴',
      themeToDark: 'ダークルームに切替',
      themeToLight: 'ライトモードに切替',

      heroHtml:
        'ポストから<span class="editorial-accent">静止画</span>と<span class="editorial-accent">GIF</span>を抽出',

      inputPlaceholder: 'X / Twitter ポストのURLを貼り付け',
      inputAria: 'X / Twitter ポストURL',
      clearTitle: 'クリア',
      pasteBtn: '貼付',
      pasteTitle: 'クリップボードから貼り付け',
      parseBtn: '抽出',
      parsingBtn: '解析中',

      dockReady: 'READY',
      dockNotice: 'NOTICE',
      dockInvalid: 'INVALID',

      errEmpty: 'ポストのURLを入力してください',
      errMultipleUrls: '{count} 件のURLを検出しました。1件ずつ入力してください',
      errShortUrl: 't.co 短縮URLは展開できません。完全なポストURLを貼り付けてください',
      errInvalidUrl: '有効な X / Twitter ポストURLが見つかりません',

      errTitleNotFound: 'ポストが見つかりません',
      errDetailNotFound: '削除されたか、URLが誤っている、または非公開アカウントの可能性があります。',
      errTitlePrivate: 'アクセス制限されています',
      errDetailPrivate: '非公開アカウントや制限付きコンテンツは公開APIから取得できません。',
      errTitleRateLimit: 'リクエスト制限',
      errDetailRateLimit: '解析エンドポイントの制限に達しました。しばらくしてから再試行してください。',
      errTitleTimeout: 'タイムアウト',
      errDetailTimeout: '解析エンドポイントからの応答がタイムアウトしました。',
      errTitleNetwork: 'ネットワークエラー',
      errDetailNetwork: '解析エンドポイントに接続できません。通信環境を確認してください。',
      errTitleGeneric: '解析に失敗しました',

      expandText: '全文を表示',
      collapseText: '折りたたむ',
      sourceTweet: '元のポスト',

      filterAll: 'すべて',
      filterPhoto: '画像',
      filterGif: 'GIF',
      copyAllBtn: '全URLをコピー',
      copiedCount: '{count} 件コピー済み',

      emptyOnlyVideo: 'このポストには動画のみ含まれています（画像・GIFなし）',
      emptyNoMedia: 'このポストに画像やGIFは含まれていません',
      previewFailed: 'URLは抽出済みですがプレビューを読み込めませんでした',

      frameAlt: 'フレーム {num}',
      playPauseTitle: '再生 / 一時停止',
      lightboxTitle: 'フルスクリーン表示',
      openNewTabTitle: '新しいタブで開く',
      openNewTabBtn: '開く',
      copyUrlBtn: 'URLをコピー',
      copiedBtn: 'コピー済み',
      posterBtn: 'カバー',
      posterTitle: 'サムネイルURLをコピー',
      downloadBtn: '保存',
      downloadGifBtn: 'GIF保存',
      gifFetching: '取得中…',
      gifEncoding: '変換 {pct}%',

      shortcutFocus: '入力',
      shortcutNav: '切替',
      shortcutCopy: 'コピー',
      shortcutClose: '閉じる',

      drawerTitle: '履歴',
      drawerClear: '消去',
      drawerClose: '閉じる',
      drawerEmpty: '履歴はありません',
      historyPhotoCount: '画像 {count}',
      historyGifCount: 'GIF {count}',
      historyNoMedia: 'メディアなし',
      historyDeleteTitle: '削除',
      timeJustNow: 'たった今',
      timeMinutesAgo: '{n} 分前',
      timeHoursAgo: '{n} 時間前',
      timeDaysAgo: '{n} 日前',

      lbPrev: '前のフレーム',
      lbNext: '次のフレーム',

      toastExtracted: '{count} 件のメディアを抽出しました',
      toastOnlyVideo: 'このポストには動画のみ含まれています',
      toastNoMedia: '画像やGIFは見つかりませんでした',
      toastCopiedFrame: 'フレーム {num} のURLをコピーしました',
      toastCopiedCurrent: '現在のフレームURLをコピーしました',
      toastCopiedAll: '{count} 件のURLをコピーしました',
      toastCopiedPoster: 'カバー画像URLをコピーしました',
      toastCopyFailed: 'コピーに失敗しました',
      toastSavedFile: '{filename} を保存しました',
      toastSavedGif: '{filename} を保存しました ({kb} KB)',
      toastDownloadingPhoto: '画像をダウンロード中…',
      toastCorsFallbackPhoto: '新しいタブで元画像を開きました',
      toastGifFailed: 'GIFの取得または変換に失敗しました',
      toastClipboardEmpty: 'クリップボードが空です',
      toastPasteManual: '⌘V / Ctrl+V で貼り付けてください',
      toastHistoryCleared: '履歴を消去しました',
      toastHistoryRestored: '履歴から復元しました',
    },
  };

  function detectInitialLang() {
    try {
      const saved = global.localStorage.getItem(LANG_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {
      // ignore
    }
    const nav = (global.navigator && global.navigator.language) || 'zh-CN';
    if (/^zh/i.test(nav)) return 'zh-CN';
    if (/^ja/i.test(nav)) return 'ja';
    return 'en';
  }

  let currentLang = detectInitialLang();

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return currentLang;
    currentLang = lang;
    document.documentElement.lang = lang;
    try {
      global.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
    return currentLang;
  }

  function t(key, params) {
    const dict = MESSAGES[currentLang] || MESSAGES['zh-CN'];
    let template = dict[key] !== undefined ? dict[key] : MESSAGES['zh-CN'][key] || key;
    if (params) {
      template = template.replace(/\{(\w+)\}/g, (_, k) =>
        params[k] !== undefined ? String(params[k]) : `{${k}}`
      );
    }
    return template;
  }

  Koma.I18n = {
    SUPPORTED,
    getLang,
    setLang,
    t,
  };
})(window);
