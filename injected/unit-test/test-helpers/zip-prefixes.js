// Re-exports state ZIP data and helpers for tests.

import STATE_CITY_ZIPS from '../../src/features/broker-protection/actions/state-city-zips.json' with { type: 'json' };

export { STATE_CITY_ZIPS };

/** Matches any 5-digit string. */
export const ANY_FIVE_DIGIT_ZIP = /^\d{5}$/;
