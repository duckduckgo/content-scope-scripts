// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - Typing will be fixed in the future

export function serpNotify() {
    window.dispatchEvent(
        new CustomEvent('ddg-serp-yt-response', {
            detail: {
                kind: 'initialSetup',
                data: {
                    privatePlayerMode: { enabled: {} },
                    overlayInteracted: false,
                },
            },
            composed: true,
            bubbles: true,
        }),
    );
}
