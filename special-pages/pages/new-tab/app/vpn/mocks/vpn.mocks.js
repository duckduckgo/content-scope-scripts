/**
 * @type {Record<string, import("../VpnProvider").VPNWidgetData>}
 */

export const vpnMocks = {
    connected: {
        state: 'connected',
        pending: 'none',
        value: {
            session: {
                currentIp: '185.192.108.45',
                connectedSince: toUnixTimestamp({ hours: 1, seconds: 35, minutes: 6 }),
                dataVolume: {
                    upload: 256.8,
                    download: 1024.5,
                    unit: 'kb/s',
                },
            },
            history: {
                longestConnection: {
                    weeks: 1,
                    days: 3,
                    hours: 12,
                    minutes: 31,
                },
                weeklyUsage: {
                    timeUnit: 'hours',
                    maxValue: 24,
                    days: [
                        { day: 'Sun', value: 5.2 },
                        { day: 'Mon', value: 8.7 },
                        { day: 'Tue', value: 7.9 },
                        { day: 'Wed', value: 4.2 },
                        { day: 'Thu', value: 6.5 },
                        { day: 'Fri', value: 2.1 },
                        { day: 'Sat', value: 3.8 },
                    ],
                },
            },
        },
    },
    disconnected: {
        state: 'disconnected',
        pending: 'none',
        value: {
            lastSession: {
                lastIp: '45.89.174.233',
                lastConnectionTime: {
                    hours: 5,
                    minutes: 33,
                },
            },
            history: {
                longestConnection: {
                    weeks: 0,
                    days: 4,
                    hours: 17,
                    minutes: 22,
                },
                weeklyUsage: {
                    timeUnit: 'hours',
                    maxValue: 24,
                    days: [
                        { day: 'Sun', value: 4.5 },
                        { day: 'Mon', value: 6.2 },
                        { day: 'Tue', value: 5.8 },
                        { day: 'Wed', value: 0 },
                        { day: 'Thu', value: 0 },
                        { day: 'Fri', value: 0 },
                        { day: 'Sat', value: 0 },
                    ],
                },
            },
        },
    },
    unsubscribed: {
        state: 'unsubscribed',
        value: null,
        pending: 'none',
    },
};

/**
 * Converts a past duration specified in seconds, minutes, and hours into a Unix timestamp.
 * @param {Object} duration - The duration object.
 * @param {number} [duration.seconds=0] - The number of seconds in the past.
 * @param {number} [duration.minutes=0] - The number of minutes in the past.
 * @param {number} [duration.hours=0] - The number of hours in the past.
 * @returns {number} - The Unix timestamp representing the current time minus the specified duration.
 */
export function toUnixTimestamp({ seconds = 0, minutes = 0, hours = 0 } = {}) {
    const totalMilliseconds = seconds * 1000 + minutes * 60 * 1000 + hours * 60 * 60 * 1000;
    return Date.now() - totalMilliseconds;
}
