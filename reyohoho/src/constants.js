// noinspection SpellCheckingInspection

export const PLAYER_TO_CDN = {
  vibix: 'playerJS', // registered by plugin
  DEFAULT: 'iframe',
};

// VIBIX   https://playerjs.com/docs/ru=apicommands
// HDVB LUMEX  - playerjs ?
// collaps - VenomPlayer ???
// TURBO  ALLOHA - ???

export const SUPPORT_STATUS = Object.freeze({
  UNKNOWN: -1,
  NOT_SUPPORTED: 0,
  NATIVE: 1,
  PROXY: 2,
});

/** @type {Record<SUPPORT_STATUS, { key: string, color: string }>} */
export const SUPPORT_STATUS_FORMATTED = Object.freeze({
  [SUPPORT_STATUS.UNKNOWN]: { key: 'unknown', color: 'error' },
  [SUPPORT_STATUS.NOT_SUPPORTED]: { key: 'notSupported', color: 'error' },
  [SUPPORT_STATUS.NATIVE]: { key: 'native', color: 'success' },
  [SUPPORT_STATUS.PROXY]: { key: 'proxy', color: 'warning' },
});

/** @type {Record<string, typeof SUPPORT_STATUS[keyof typeof SUPPORT_STATUS]>} */
export const SUPPORT_STATUS_TO_CDN = Object.freeze({
  turbo: SUPPORT_STATUS.PROXY, // Жестко запутанный плеер. Обнаружен HLS, но его юзает только 1 поток
  collaps: SUPPORT_STATUS.PROXY, // VenomPlayer. Полная поддержка всех функций
  alloha: SUPPORT_STATUS.NOT_SUPPORTED, // кривые пути к ассетам + CORS
  torrents: SUPPORT_STATUS.UNKNOWN,
  vibix: SUPPORT_STATUS.NATIVE, // Подключается напрямую к апи postMessage PlayerJS, но не возможно управлять плейлистом из этого апи
  hdvb: SUPPORT_STATUS.PROXY, // PlayerJS v19 - выключен postMessage апи
  videocdn: SUPPORT_STATUS.NOT_SUPPORTED, // кривые пути к ассетам + CORS
});
