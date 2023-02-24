// @ts-check
import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'node:path'
const CWD = new URL(".", import.meta.url).pathname;
const contentScope = JSON.parse(readFileSync(join(CWD, "remote.json"), "utf8"));
const js = readFileSync(join(CWD, "..", "build", "apple", "contentScope.js"), "utf8");
const fpjs = readFileSync(join(CWD, "..", "packages/content-scope-scripts-temp/node_modules/@fingerprintjs/fingerprintjs/dist/fp.js"), "utf8");

const expectedFingerprintValues = {
    availTop: 0,
    availLeft: 0,
    wAvailTop: 0,
    wAvailLeft: 0,
    colorDepth: 24,
    pixelDepth: 24,
    productSub: '20030107',
    vendorSub: ''
}

// function testFPValues (values) {
//     for (const [name, prop] of Object.entries(values)) {
//         expect(prop).withContext(`${name}`).toEqual(expectedFingerprintValues[name])
//     }
// }

test.describe('Fingerprint Defense Tests', () => {
    test('verify window.safari is absent', async ({page}, {project}) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>`
            })
        })
        await page.addInitScript((contentScope) => {
            window.$CONTENT_SCOPE$ = {
                unprotectedTemporary: [],
                features: {}
            };
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: "macos" }
            }
        }, contentScope);
        await page.goto('https://playwright.dev');
        await page.evaluate(js);

        const values = await page.evaluate(() => {
            return {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                availTop: screen.availTop,
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                availLeft: screen.availLeft,
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                wAvailTop: window.screen.availTop,
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                wAvailLeft: window.screen.availLeft,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                productSub: navigator.productSub,
                vendorSub: navigator.vendorSub
            }
        })
        console.log(values);
    })
    test.only('First Party Fingerprint Randomization', async ({page}, {project}) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>`
            })
        })
        await page.addInitScript((contentScope) => {
            window.$CONTENT_SCOPE$ = contentScope;
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: "macos" }
            }
        }, contentScope);

        await page.goto('https://playwright.dev');
        await page.evaluate(js);
        await page.evaluate(fpjs);
        const r1 = await runTest(page);

        await page.reload({ waitUntil: "networkidle" });
        await page.evaluate(js);
        await page.evaluate(fpjs);
        const r2 = await runTest(page);

        expect(r1.canvas.geometry).toEqual(r2.canvas.geometry)
        // expect(r1.plugin).toEqual(r2.plugin)
    })
})

async function runTest(page) {
    const fingerprint = await page.evaluate(() => {
        /* global FingerprintJS */
        return (async () => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            const fp = await FingerprintJS.load()
            return fp.get()
        })()
    })
    return {
        canvas: fingerprint.components.canvas.value,
        plugin: fingerprint.components.plugins.value
    }
}
