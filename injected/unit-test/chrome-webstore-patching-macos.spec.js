import { getCrxDownloadUrl } from '../src/features/chrome-webstore-patching/macos.js';

describe('macOS CRX download URL', () => {
    it('uses the fixed Google endpoint and encodes the extension-specific query', () => {
        const id = 'nngceckbapebfimnlniiiahkandclblb';
        const downloadUrl = getCrxDownloadUrl(id);
        expect(downloadUrl).not.toBeNull();
        if (!downloadUrl) return;
        const url = new URL(downloadUrl);
        expect(url.origin + url.pathname).toBe('https://clients2.google.com/service/update2/crx');
        expect(url.searchParams.get('x')).toBe(`id=${id}&installsource=ondemand&uc`);
        expect(url.searchParams.get('prodversion')).toBe('9999.0.0.0');
        expect(url.searchParams.get('acceptformat')).toBe('crx3');
        expect(url.searchParams.get('response')).toBe('redirect');
    });

    for (const id of ['', 'a'.repeat(31), 'a'.repeat(33), 'z'.repeat(32), 'a'.repeat(32) + '&x=other', 'https://example.com/a.crx']) {
        it(`rejects invalid IDs: ${id}`, () => {
            expect(getCrxDownloadUrl(id)).toBeNull();
        });
    }
});
