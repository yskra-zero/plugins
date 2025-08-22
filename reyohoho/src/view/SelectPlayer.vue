<script setup lang="ts">
import type { createApi } from '../api';
import { useAppBus } from 'utils';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { PLAYER_TO_CDN, SUPPORT_STATUS, SUPPORT_STATUS_FORMATTED, SUPPORT_STATUS_TO_CDN } from '../constants';

const props = defineProps<{
  payload: {
    title?: string;
    ids: {
      kp?: number;
      imdb?: string;
      shikimori?: number;
    };
  };
  api: ReturnType<typeof createApi>;
}>();
const router = useRouter();
const bus = useAppBus();
const { t } = useI18n();

const kpId = ref();
const gettingKpId = ref(false);
const { data, isFetching: dataLoading, error } = props.api.getPlayers(kpId, { immediate: false, initialData: {} });
const isLoading = computed(() => dataLoading.value || gettingKpId.value);
const players = computed(() => Object.fromEntries(
  data.value.map((v) => {
    const status = SUPPORT_STATUS_TO_CDN[v.name] ?? SUPPORT_STATUS.UNKNOWN;

    return [
      v.name,
      {
        id: v.name,
        url: v.iframe,
        name: v.translate,
        type: PLAYER_TO_CDN[v.name] ?? PLAYER_TO_CDN.DEFAULT,
        status,
        badge: SUPPORT_STATUS_FORMATTED[status],
      },
    ];
  }),
));

watch(() => props.payload, async () => {
  gettingKpId.value = true;
  kpId.value = await getKpId();
  gettingKpId.value = false;
}, { immediate: true });

async function getKpId() {
  const { title, ids } = props.payload;

  let kpId = ids.kp;

  if (!kpId && ids.imdb) {
    const { data } = await props.api.imdb2kp(ids.imdb);

    kpId = data.value;
  }
  if (!kpId && ids.shikimori) {
    const { data } = await props.api.shikimori2kp(ids.shikimori);

    kpId = data.value;
  }
  if (!kpId && title) {
    const { data, error } = await props.api.search(title);

    if (!error.value) {
      kpId = data.results[0]?.id;
    }
  }

  return kpId;
}

async function openPlayer(player: { id: string; url: string; type: string; status: typeof SUPPORT_STATUS[keyof typeof SUPPORT_STATUS] }, event: Event) {
  if (player.status === SUPPORT_STATUS.PROXY || player.status === SUPPORT_STATUS.NATIVE) {
    router.push({ name: 'player', query: {
      url: player.url,
      type: player.type,
    } });
  }
  else {
    const { onConfirm } = bus.call('ui.dialog:confirm', {
      text: player.status === SUPPORT_STATUS.UNKNOWN ? t('confirmRunUnknownPlayer') : t('confirmRunUnsupportedPlayer'),
      targetRef: event.target,
    });

    onConfirm(() => {
      router.push({ name: 'player', query: {
        url: player.url,
        type: PLAYER_TO_CDN.DEFAULT,
        playerOpts: JSON.stringify({ noProxy: true }),
      } });
    });
  }
}
</script>

<template>
  <div v-if="isLoading" class="align-center w-full flex justify-center">
    <BaseLoading class="mt-10 h-30 w-30" />
  </div>

  <div v-else-if="error" class="flex flex-col items-center justify-center">
    <div class="i-mingcute:close-circle-line mb-3 h-5em w-5em" />
    <p>{{ $t('errorLoadData') }}</p>
    <p class="text-sm">
      {{ error }}
    </p>
  </div>

  <BaseMenu v-else class="w-full p-0">
    <BaseMenuItem v-for="player in players" :key="player.id">
      <BaseButton class="my-2 h-full justify-start p-5" @click="openPlayer(player, $event)">
        <div>
          <span>{{ player.name }}</span>

          <BaseBadge class="ml-2" :color="player.badge.color">
            {{ $t(player.badge.key) }}
          </BaseBadge>
        </div>
      </BaseButton>
    </BaseMenuItem>
  </BaseMenu>
</template>

<style scoped>

</style>
