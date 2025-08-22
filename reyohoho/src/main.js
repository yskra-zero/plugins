import { useAppBus } from 'utils';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';
import enLocale from '../locales/en-US.json';
import ruLocale from '../locales/ru-RU.json';
import { createApi } from './api';
import Icon from './assets/basedge.png?inline';
import usePlayerJSIframe from './lib/playerJSIframePlayer/index.js';
import SelectPlayer from './view/SelectPlayer.vue';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  settings: {
    minimumFetchIntervalMillis: 60000,
    fetchTimeoutMillis: 10000,
  },
  defaultConfig: {
    api_url: import.meta.env.VITE_APP_API_URL,
  },
};

// noinspection JSUnusedGlobalSymbols
export default async function plugin({ defineConfig, defineLocales }) {
  const config = defineConfig({
    token: '',
  });
  const bus = useAppBus();
  const { t } = useI18n();
  const api = createApi(config, firebaseConfig);

  const rmPlayer = bus.call('webPlayer.custom:add', {
    name: 'playerJS',
    canPlay: () => false, // will be used by force select: ?type=playerJS
    create: usePlayerJSIframe,
  });

  const rmBtn = bus.call('ui.filmCard:addActionBtn', {
    id: 'reYohoho',
    name: 'watchOnline',
    icon: h('img', { src: Icon }),
    isAvailable: ({ ids, title }) => !!title || !!ids.kp || !!ids.imdb || !!ids.shikimori,
    action,
  });

  defineLocales({
    'ru-RU': ruLocale,
    'en-US': enLocale,
  });

  return () => {
    rmPlayer();
    rmBtn();
  };

  function action(payload) {
    const drawer = bus.call('ui.dialog:drawer', {
      title: t('selectPlayer'),
      body: h(() => h(SelectPlayer, {
        payload,
        api,
      })),
    });
  }
}
