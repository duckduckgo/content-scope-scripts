import { validateSettings } from '../src/features/duckplayer/util.js'

describe('Duck Player - settings', () => {
    it('gives defaults for overlays.youtube ', () => {
        // this test ensures that existing clients won't break with existing config (where these fields are absent)
        const actual = validateSettings({})
        expect(actual).toEqual({
            selectors: {
                thumbLink: "a[href^='/watch']:has(img)",
                excludedRegions: [
                    '#playlist'
                ],
                videoElement: '#player video',
                videoElementContainer: '#player .html5-video-player'
            },
            thumbnailOverlays: {
                state: 'enabled'
            },
            clickInterception: {
                state: 'enabled'
            },
            videoOverlays: {
                state: 'enabled'
            }
        })
    })
    it('allows individual overrides for overlays.youtube', () => {
        // this test ensures that existing clients won't break with existing config (where these fields are absent)
        const actual = validateSettings({ selectors: { excludedRegions: ['#a', '#b', '.cde'] } })
        expect(actual).toEqual({
            selectors: {
                thumbLink: "a[href^='/watch']:has(img)",
                excludedRegions: ['#a', '#b', '.cde'],
                videoElement: '#player video',
                videoElementContainer: '#player .html5-video-player'
            },
            thumbnailOverlays: {
                state: 'enabled'
            },
            clickInterception: {
                state: 'enabled'
            },
            videoOverlays: {
                state: 'enabled'
            }
        })
    })
})
