/** @import {Config} from '../Public'; */
/** @import {FirebaseOptions, RemoteConfig} from 'firebase/app'; */
/** @import {MaybeRefOrGetter} from 'vue'; */
/** @import {UseFetchOptions, UseFetchReturn} from '@vueuse/core'; */
/** @import {GetPlayersResponse} from './Public'; */

import { createFetch } from 'utils';
import { computed, toRef } from 'vue';
import { createRemoveConfig } from './removeConfig.js';

export const DISCUSSED_MOVIES_TYPES = Object.freeze({
  HOT: 'hot',
});

/**
 * @param {Config} config
 * @param {Partial<FirebaseOptions>} firebaseConfig
 */
export function createApi(config, firebaseConfig) {
  const remoteConfig = createRemoveConfig(firebaseConfig);

  const useFetch = createFetch({
    baseUrl: remoteConfig.apiUrl,
    options: {
      beforeFetch({ options }) {
        if (config.token) {
          options.headers.Authorization = `Bearer ${config.token}`;
        }

        return { options };
      },
      refetch: true,
    },
  });

  return {
    search,
    getShikiInfo,
    getKpInfo,
    getPlayers,
    getMovies,
    getDiscussedMovies,
    getDons,
    imdb2kp,
    getNudityInfoFromIMDB,
    shikimori2kp,
    getKpRating,
    setRating,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    rateComment,
  };

  /**
   * @param {MaybeRefOrGetter<string>} searchTerm
   * @param {UseFetchOptions=} fetchOptions
   */
  function search(searchTerm, fetchOptions = {}) {
    searchTerm = toRef(searchTerm);
    const path = computed(() => `/search/${searchTerm.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<number>} shikiId
   * @param {UseFetchOptions=} fetchOptions
   */
  function getShikiInfo(shikiId, fetchOptions = {}) {
    shikiId = toRef(shikiId);
    const path = computed(() => `/shiki_info/${shikiId.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<number>} kpId
   * @param {UseFetchOptions=} fetchOptions
   */
  function getKpInfo(kpId, fetchOptions = {}) {
    kpId = toRef(kpId);
    const path = computed(() => `/kp_info2/${kpId.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<number>} kpId
   * @param {UseFetchOptions=} fetchOptions
   * @return {UseFetchReturn<GetPlayersResponse>}
   */
  function getPlayers(kpId, fetchOptions = {}) {
    kpId = toRef(kpId);
    const data = computed(() => new URLSearchParams({ kinopoisk: kpId.value, type: 'movie' }));

    return useFetch(`/cache`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, ...fetchOptions }).json().post(data);
  }

  /**
   * @param {object} options
   * @param {MaybeRefOrGetter<string>=} options.activeTime
   * @param {MaybeRefOrGetter<string>=} options.typeFilter
   * @param {MaybeRefOrGetter<number>=} options.limit
   * @param {UseFetchOptions=} fetchOptions
   */
  function getMovies({ activeTime = 'all', typeFilter = 'all', limit } = {}, fetchOptions = {}) {
    activeTime = toRef(activeTime);
    typeFilter = toRef(typeFilter);
    limit = toRef(limit);

    const params = computed(() => new URLSearchParams({
      type: typeFilter.value,
      limit: limit.value,
    }));
    const path = computed(() => `/top/${activeTime.value}?${params.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<typeof DISCUSSED_MOVIES_TYPES.HOT>} type
   * @param {UseFetchOptions=} fetchOptions
   */
  function getDiscussedMovies(type = DISCUSSED_MOVIES_TYPES.HOT, fetchOptions = {}) {
    type = toRef(type);
    const path = computed(() => `/discussed/${type.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  function getDons() {
    return useFetch('/get_dons').get().json();
  }

  /**
   * @param {MaybeRefOrGetter<string>} imdb_id - format 'tt1234567'
   * @param {UseFetchOptions=} fetchOptions
   * @return {UseFetchReturn<number>}
   */
  function imdb2kp(imdb_id, fetchOptions = {}) {
    imdb_id = toRef(imdb_id);
    const path = computed(() => `/imdb_to_kp/${imdb_id.value.replace('tt', '')}`); // convert to api format id

    return useFetch(path, {
      afterFetch: ({ data }) => ({ data: data.id_kp }),
      ...fetchOptions,
    }).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<string>} imdb_id
   * @param {UseFetchOptions=} fetchOptions
   */
  function getNudityInfoFromIMDB(imdb_id, fetchOptions = {}) {
    imdb_id = toRef(imdb_id);
    const path = computed(() => `/imdb_parental_guide/${imdb_id.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<number>} shiki_id
   * @param {UseFetchOptions=} fetchOptions
   * @return {UseFetchReturn<number>}
   */
  function shikimori2kp(shiki_id, fetchOptions = {}) {
    shiki_id = toRef(shiki_id);
    const path = computed(() => `/shiki_to_kp/${shiki_id.value}`);

    return useFetch(path, {
      afterFetch: ({ data }) => ({ data: data.id_kp }),
      ...fetchOptions,
    }).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<number>} kpId
   * @param {UseFetchOptions=} fetchOptions
   */
  function getKpRating(kpId, fetchOptions = {}) {
    kpId = toRef(kpId);
    const path = computed(() => `/rating/${kpId.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {MaybeRefOrGetter<number>} kpId
   * @param {MaybeRefOrGetter<number>} rating
   * @param {UseFetchOptions=} fetchOptions
   */
  function setRating(kpId, rating, fetchOptions = {}) {
    kpId = toRef(kpId);
    rating = toRef(rating);
    const path = computed(() => `/rating/${kpId.value}`);
    const data = computed(() => ({ rating: rating.value }));

    return useFetch(path, fetchOptions).json().post(data);
  }

  /**
   * @param {MaybeRefOrGetter<number>} movieId
   * @param {UseFetchOptions=} fetchOptions
   */
  function getComments(movieId, fetchOptions = {}) {
    movieId = toRef(movieId);
    const path = computed(() => `/comments/${movieId.value}`);

    return useFetch(path, fetchOptions).get().json();
  }

  /**
   * @param {object} options
   * @param {MaybeRefOrGetter<number>} options.movieId
   * @param {MaybeRefOrGetter<string>} options.content
   * @param {MaybeRefOrGetter<string>=} options.parentId
   * @param {UseFetchOptions=} fetchOptions
   */
  function createComment({ movieId, content, parentId }, fetchOptions) {
    movieId = toRef(movieId);
    content = toRef(content);
    parentId = toRef(parentId);
    const path = computed(() => `/comments/${movieId.value}`);
    const data = computed(() => ({ content: content.value, parent_id: parentId.value }));

    return useFetch(path, fetchOptions).json().post(data);
  }

  /**
   * @param {object} options
   * @param {MaybeRefOrGetter<string>} options.commentId
   * @param {MaybeRefOrGetter<string>} options.content
   * @param {UseFetchOptions=} fetchOptions
   */
  function updateComment({ commentId, content }, fetchOptions = {}) {
    commentId = toRef(commentId);
    content = toRef(content);
    const path = computed(() => `/comments/${commentId.value}`);
    const data = computed(() => ({ content: content.value }));

    return useFetch(path, fetchOptions).json().put(data);
  }

  /**
   * @param {object} options
   * @param {MaybeRefOrGetter<string>} options.commentId
   * @param {UseFetchOptions=} fetchOptions
   */
  function deleteComment({ commentId }, fetchOptions = {}) {
    commentId = toRef(commentId);
    const path = computed(() => `/comments/${commentId.value}`);

    return useFetch(path, fetchOptions).json().delete();
  }

  /**
   * @param {object} options
   * @param {MaybeRefOrGetter<string>} options.commentId
   * @param {MaybeRefOrGetter<number>} options.rating
   * @param {UseFetchOptions=} fetchOptions
   */
  function rateComment({ commentId, rating }, fetchOptions = {}) {
    commentId = toRef(commentId);
    rating = toRef(rating);
    const path = computed(() => `/comments/${commentId.value}/rate`);
    const data = computed(() => ({ rating: rating.value }));

    return useFetch(path, fetchOptions).json().post(data);
  }
}
