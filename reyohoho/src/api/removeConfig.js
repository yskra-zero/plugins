/** @import {FirebaseOptions, RemoteConfig} from 'firebase/app'; */

import { initializeApp } from 'firebase/app';
import { fetchAndActivate, getRemoteConfig, getValue } from 'firebase/remote-config';
import { asyncComputed, Logger } from 'utils';
import { computed, watchEffect } from 'vue';

/**
 * @param {Partial<FirebaseOptions>} firebaseConfig
 */
export function createRemoveConfig(firebaseConfig) {
  const logger = new Logger('ReYohoho');

  const firebaseApp = asyncComputed(async () => {
    return initializeApp(firebaseConfig);
  }, {});
  const config = asyncComputed(async () => {
    return getRemoteConfig(firebaseApp.value);
  });

  const apiUrl = computed(() => {
    return getConfigValue('api_url') ?? import.meta.env.VITE_APP_API_URL;
  });

  watchEffect(async () => {
    if (!config.value) {
      return;
    }
    await fetchAndActivate(config.value);

    logger.info(`remote config:`, config.value._storageCache);
  });

  return {
    getConfigValue,
    getValue,
    config,

    apiUrl,
  };

  /**
   * @param {string} key
   */
  function getConfigValue(key) {
    if (!config.value) {
      return;
    }
    return getValue(config.value, key).asString();
  }
}
