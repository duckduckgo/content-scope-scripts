import { test, expect } from '@playwright/test'
import { ResultsCollector } from "./page-objects/results-collector.js";

test.skip('Harmful APIs protections', async ({ page }, testInfo) => {
    const htmlPage = '/harmful-apis/index.html'
    const config = './integration-test/test-pages/harmful-apis/config/apis.json'

    const collector = ResultsCollector.create(page, testInfo)
    await collector.load(htmlPage, config);

    const results = await collector.runTests();
    // note that if protections are disabled, the browser will show a device selection pop-up, which will never be dismissed

    [
        'deviceOrientation',
        'GenericSensor',
        'UaClientHints',
        'NetworkInformation',
        'getInstalledRelatedApps',
        'FileSystemAccess',
        'WindowPlacement',
        'WebBluetooth',
        'WebUsb',
        'WebSerial',
        'WebHid',
        'WebMidi',
        'IdleDetection',
        'WebNfc',
        'StorageManager'
    ].forEach((name) => {
        for (const result of results[name]) {
            expect(result.result).toEqual(result.expected)
        }
    })
})
