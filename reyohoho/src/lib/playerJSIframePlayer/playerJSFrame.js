/** @import {Ref, MaybeRefOrGetter} from 'vue'; */
import { createEventHook, useEventListener, watchDebounced, watchIgnorable } from 'utils';
import { computed, ref, shallowRef, toValue } from 'vue';

/**
 * Wrap PlayerJS iframe API to useMediaControls-like API
 * @param {MaybeRefOrGetter<HTMLIFrameElement>} iframe
 */
export function usePlayerJSIframeAPI(iframe) {
  iframe = toValue(iframe);

  const sourceLoadedEvent = createEventHook();
  const playerIsReadyEvent = createEventHook();
  const sourceErrorEvent = createEventHook();
  const playbackErrorEvent = createEventHook();

  window.addEventListener('message', messageListener);

  iframe.addEventListener('load', async (event) => {
    await sourceLoadedEvent.trigger(event);
  });

  const currentTime = shallowRef(0);
  const duration = shallowRef(0);
  const seeking = shallowRef(false); // not provided by iframe API
  const volume = shallowRef(1);
  const waiting = shallowRef(false);
  const ended = shallowRef(false);
  const playing = shallowRef(false);
  const rate = shallowRef(1);
  const stalled = shallowRef(false); // not provided by iframe API
  /** @type {Ref<[number, number][]>} */
  const buffered = ref([]);
  const tracks = ref([]);
  const selectedTrack = shallowRef(-1);
  const isPictureInPicture = shallowRef(false); // not provided by iframe API
  const muted = shallowRef(false);
  const loop = shallowRef(false);
  const qualities = ref([]);
  const quality = shallowRef(0);
  const audioTracks = ref([]); // iframe api not provide audio tracks
  const audioTrack = shallowRef(-1); // iframe api not provide audio tracks

  const { ignoreUpdates: ignoreSeekingUpdates } = watchIgnorable(currentTime, (time) => {
    command('seek', time);
  });
  const { ignoreUpdates: ignorePlayingUpdates } = watchIgnorable(playing, (isPlaying) => {
    if (isPlaying) {
      command('play');
    }
    else {
      command('pause');
    }
  });
  const { ignoreUpdates: ignoreRateUpdates } = watchIgnorable(rate, (rate) => {
    command('speed', rate);
  });
  const { ignoreUpdates: ignoreVolumeUpdates } = watchIgnorable(volume, (volume) => {
    command('volume', volume);
  });
  const { ignoreUpdates: ignoreMuteUpdates } = watchIgnorable(muted, (isMuted) => {
    if (isMuted) {
      command('mute');
    }
    else {
      command('unmute');
    }
  });
  const { ignoreUpdates: ignoreLoopUpdates } = watchIgnorable(loop, (bool) => {
    command('loop', bool ? 1 : 0);
  });
  const { ignoreUpdates: ignoreQualityUpdates } = watchIgnorable(quality, (quality) => {
    command('quality', quality);
  });

  watchDebounced(
    currentTime,
    async () => {
      buffered.value = [
        [0, await commandWithAnswer('buffered')],
      ];
    },
    { debounce: 1000 },
  );

  playerIsReadyEvent.on(async () => {
    command('ui', 0);
    command('showplaylist', 0);

    qualities.value = await commandWithAnswer('qualities').then((resp) => resp.map((name) => ({ name })));
  });

  const iframeReady = new Promise((resolve) => {
    const { off } = sourceLoadedEvent.on(() => {
      resolve(true);
      off();
    });
  });
  const playerReady = new Promise((resolve) => {
    const { off } = playerIsReadyEvent.on(() => {
      resolve(true);
      off();
    });
  });

  const handlers = {
    inited: () => playerIsReadyEvent.trigger(),
    time: (data) => ignoreSeekingUpdates(() => currentTime.value = data),
    duration: (data) => duration.value = data,
    speed: (data) => ignoreRateUpdates(() => rate.value = data),
    audiotrack: (data) => ignoreSelectedTrackUpdates(() => audioTrack.value = data),
    quality: (data) => ignoreQualityUpdates(() => quality.value = qualities.value.indexOf(data)),
    end: () => ended.value = true,
    loop: (data) => ignoreLoopUpdates(() => loop.value = data === 1),
    play: () => {
      waiting.value = false;
      ended.value = false;
      ignorePlayingUpdates(() => playing.value = true);
    },
    paused: () => ignorePlayingUpdates(() => playing.value = false),
    waiting: () => {
      waiting.value = true;
      // выключить: кривой порядок прилетает команд: сначала play потом waiting, потом buffered и молча автоматически запускается
      // ignorePlayingUpdates(() => playing.value = false);
    },
    buffered: () => {
      waiting.value = false;
    },
    mute: () => ignoreMuteUpdates(() => muted.value = true),
    unmute: () => ignoreMuteUpdates(() => muted.value = false),
    volume: (data) => ignoreVolumeUpdates(() => volume.value = Number.parseFloat(data)),
  };

  return {
    currentTime,
    duration,
    waiting,
    seeking,
    ended,
    stalled,
    buffered,
    playing,
    rate,
    loop,
    togglePlay: () => playing.value = !playing.value,
    toggleMute: () => muted.value = !muted.value,
    endBuffer: computed(() => buffered.value.length ? buffered.value.at(-1)?.[1] ?? 0 : 0),

    // Volume
    volume,
    muted,

    // Tracks
    tracks,
    selectedTrack,
    enableTrack: () => null,
    disableTrack: () => null,

    // Qualities
    qualities,
    quality,

    // // Translations audio tracks
    // audioTracks,
    // audioTrack,

    // Picture in Picture
    supportsPictureInPicture: false,
    togglePictureInPicture: () => Promise.resolve(),
    isPictureInPicture,

    // Events
    onSourceError: sourceErrorEvent.on,
    onPlaybackError: playbackErrorEvent.on,

    // iframe
    command,
    commandWithAnswer,
    loadSource,
  };

  /**
   * Send command to the iframe
   * @param {string} command
   * @param {any=} args
   */
  function command(command, args) {
    const el = toValue(iframe);

    el.contentWindow?.postMessage({
      api: command,
      set: args,
    }, '*');
  }

  /**
   * Send command to the iframe and wait for answer
   * @param {string} apiCommand
   * @param {any=} args
   * @return {Promise<any>}
   */
  function commandWithAnswer(apiCommand, args) {
    return new Promise((resolve) => {
      const cleanup = useEventListener('message', (event) => {
        const el = toValue(iframe);

        if (event.source !== el.contentWindow || !event.data) {
          return;
        }

        const { answer, event: eventName } = event.data;

        if (eventName === apiCommand) {
          cleanup();
          resolve(answer);
        }
      });

      command(apiCommand, args);
    });
  }

  /**
   * @param {string} source direct link to iframe
   * @return {Promise<void>}
   */
  async function loadSource(source) {
    const el = toValue(iframe);
    const src = new URL(source);

    el.setAttribute('allow', 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    el.setAttribute('frameborder', '0');
    el.src = src.toString();

    await iframeReady;
    await playerReady;
  }

  /**
   * Handle messages from the iframe to make state reactive
   * @param {MessageEvent} event
   */
  function messageListener(event) {
    const el = toValue(iframe);

    if (event.source !== el.contentWindow || !event.data) {
      return;
    }

    const { data, event: eventName } = event.data;

    if (handlers[eventName]) {
      const handler = handlers[eventName];

      if (handler.length === 1 && data !== undefined) {
        handler(data);
      }
      else {
        handler();
      }
    }
  }
}
