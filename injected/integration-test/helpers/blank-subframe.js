/**
 * @param {import('@playwright/test').Page} page
 */
export function blankFrame(page) {
    const frame = page.frames().find((f) => f !== page.mainFrame() && f.url() === 'about:blank');
    if (!frame) throw new Error('blank iframe not found');
    return frame;
}

/**
 * Messages sent through the mocked webkit handlers from inside a frame.
 * @param {import('@playwright/test').Frame} frame
 * @param {string} method
 */
export async function frameMessages(frame, method) {
    const outgoing = await frame.evaluate(() => /** @type {any} */ (window).__playwright_01?.mocks.outgoing ?? []);
    return outgoing.filter((/** @type {any} */ m) => m.payload.method === method);
}
