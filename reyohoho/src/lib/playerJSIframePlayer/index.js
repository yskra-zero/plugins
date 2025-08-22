/** @import {Player} from '../Public' */

import { reactive } from 'vue';
import { usePlayerJSIframeAPI } from './playerJSFrame.js';

/**
 * @type Player
 */
export default function usePlayerJSIframe(mediaElement) {
  hardwareSupport();

  const iframe = createIframe();
  const originalElement = mediaElement;
  const player = usePlayerJSIframeAPI(iframe);
  const mediaControls = reactive({ ...player });

  mediaElement.parentNode?.replaceChild(iframe, mediaElement);

  return {
    mediaControls,
    load,
    destroy,
    onPlayerError: player.onSourceError,
  };

  function createIframe() {
    const iframe = document.createElement('iframe');

    iframe.classList.add('w-full', 'h-full', 'pointer-events-none');

    return iframe;
  }

  function hardwareSupport() {
    if ('postMessage' in window) {
      return;
    }
    return new Error('Not supported iframe for PlayerJS');
  }

  /**
   * @param {string} src
   */
  async function load(src) {
    await player.loadSource(src);
  }

  function destroy() {
    if (iframe) {
      iframe.parentNode?.replaceChild(originalElement, iframe);
      iframe.remove();
    }
  }
}
