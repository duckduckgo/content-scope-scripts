/* global process */
import { defineConfig } from '@playwright/test';

/**
 * Browser tests for the detector benchmark harness itself.
 *
 * Separate from `playwright.config.js` because these tests need a real layout engine and a
 * CDP session and nothing else: no injected content-scope build, no `injectName`, no test
 * server. They follow the `playwright-e2e.config.js` precedent - own config, own npm script -
 * rather than joining `test-int`, whose projects all exist to exercise injected features.
 *
 * Not wired into any CI job. Two of these tests assert that one thing costs measurably more
 * than another, which is sound on a developer machine and a coin toss on a shared runner.
 */
export default defineConfig({
    testDir: 'integration-test',
    testMatch: ['detector-bench.spec.js'],

    // The end-to-end cases spawn `run.mjs`, which launches its own browser and generates
    // DOMs of a hundred thousand nodes.
    timeout: 180 * 1000,
    expect: { timeout: 10 * 1000 },

    // Timing assertions and parallel workers do not mix: contention is exactly the noise
    // these tests are trying to see past.
    fullyParallel: false,
    workers: 1,

    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : [['list']],
});
