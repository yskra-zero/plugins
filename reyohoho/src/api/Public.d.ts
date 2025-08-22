type PlayerID = 'vibix' | 'turbo' | 'collaps' | 'alloha' | 'hdvb' | 'videocdn' | 'torrents';

export type GetPlayersResponse = {
  iframe: string;
  translate: string;
  quality: '';
  name: PlayerID;
}[];
