/**
 * @type {Record<string, {content: NonNullable<import("../../../../../types/new-tab").UpdateNotificationData['content']>}>}
 */
export const updateNotificationExamples = {
    empty: {
        content: {
            version: '1.65.0',
            notes: [],
        },
    },
    populated: {
        content: {
            notes: ['Bug fixes and improvements'],
            version: '1.91',
        },
    },
};
