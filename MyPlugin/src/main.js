import styles from 'virtual:styles';
import { ref, toRef } from 'vue';
import enLocale from '../locales/en-US.json';
import ruLocale from '../locales/ru-RU.json';
import MyComponent from './components/MyComponent.vue';

// noinspection JSUnusedGlobalSymbols
export default function plugin({ useStyle, defineLocales }) {
  useStyle(styles);

  defineLocales({
    'ru-RU': ruLocale,
    'en-US': enLocale,
  });

  return () => null
}
