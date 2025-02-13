export const EVENT_PLAY = 'ddg-duckplayer-play';
export const EVENT_PAUSE = 'ddg-duckplayer-pause';

export function usePlaybackControl() {
    return {
        playVideo: () => {
            window.dispatchEvent(new Event(EVENT_PLAY));
            console.log(EVENT_PLAY);
        },
        pauseVideo: () => {
            window.dispatchEvent(new Event(EVENT_PAUSE));
            console.log(EVENT_PAUSE);
        },
    };
}
