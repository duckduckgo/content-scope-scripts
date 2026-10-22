import { formatTranscript, parseTranscriptPanelText, parseTranscriptResponse } from '../src/features/youtube-transcript.js';

/**
 * @param {number} startMs
 * @param {object} snippet
 */
function segment(startMs, snippet) {
    return { transcriptSegmentRenderer: { startMs: String(startMs), endMs: String(startMs + 3000), snippet } };
}

describe('youtube-transcript.js', () => {
    it('reads segments from a get_transcript response', () => {
        const response = {
            actions: [
                {
                    updateEngagementPanelAction: {
                        content: {
                            transcriptRenderer: {
                                content: {
                                    transcriptSearchPanelRenderer: {
                                        body: {
                                            transcriptSegmentListRenderer: {
                                                initialSegments: [
                                                    segment(0, { runs: [{ text: 'This is a ' }, { text: 'three.' }] }),
                                                    { transcriptSectionHeaderRenderer: { snippet: { simpleText: 'Chapter 1' } } },
                                                    segment(4200, { simpleText: '  It is sloppily\nwritten ' }),
                                                    segment(9000, { runs: [] }),
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        };
        expect(parseTranscriptResponse(response)).toEqual([
            { startMs: 0, text: 'This is a three.' },
            { startMs: 4200, text: 'It is sloppily written' },
        ]);
    });

    it('returns no segments for an error response', () => {
        expect(parseTranscriptResponse({ error: { code: 400 } })).toEqual([]);
        expect(parseTranscriptResponse(null)).toEqual([]);
    });

    it('reads segments from the transcript panel text', () => {
        const text = 'Transcript\nSearch in video\n0:00\nThis is a three.\n0:04\nIt is sloppily written\n1:02:03\nThe end\n';
        expect(parseTranscriptPanelText(text)).toEqual([
            { startMs: 0, text: 'This is a three.' },
            { startMs: 4000, text: 'It is sloppily written' },
            { startMs: 3723000, text: 'The end' },
        ]);
    });

    it('groups segments into timestamped lines of about 20 seconds', () => {
        const segments = [
            { startMs: 0, text: 'a' },
            { startMs: 5000, text: 'b' },
            { startMs: 21000, text: 'c' },
            { startMs: 754000, text: 'd' },
            { startMs: 3723000, text: 'e' },
        ];
        expect(formatTranscript(segments)).toBe('[0:00] a b\n[0:21] c\n[12:34] d\n[1:02:03] e');
    });
});
