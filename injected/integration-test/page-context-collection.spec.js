import { test, expect } from '@playwright/test';
import { PageContextCollector } from './helpers/page-context-collector.js';

test.describe('Page Context Collection', () => {
    test('should collect basic page content', async ({ page }, testInfo) => {
        const collector = PageContextCollector.create(page, testInfo);

        // Test with a simple HTML page
        const testUrl =
            'data:text/html,<!DOCTYPE html><html><head><title>Test Page</title><meta name="description" content="Test description"></head><body><h1>Main Heading</h1><p>This is test content.</p><a href="https://example.com">Example Link</a></body></html>';

        const content = await collector.loadAndCollect(testUrl);

        // Verify the collected content structure
        expect(content).toHaveProperty('title');
        expect(content).toHaveProperty('metaDescription');
        expect(content).toHaveProperty('content');
        expect(content).toHaveProperty('headings');
        expect(content).toHaveProperty('links');
        expect(content).toHaveProperty('images');
        expect(content).toHaveProperty('url');
        expect(content).toHaveProperty('timestamp');

        // Verify specific content
        expect(content.title).toBe('Test Page');
        expect(content.metaDescription).toBe('Test description');
        expect(content.content).toContain('Main Heading');
        expect(content.content).toContain('This is test content');

        // Check headings structure
        expect(content.headings).toHaveLength(1);
        expect(content.headings[0]).toEqual({
            level: 1,
            text: 'Main Heading',
        });

        // Check links structure
        expect(content.links).toHaveLength(1);
        expect(content.links[0]).toEqual({
            text: 'Example Link',
            href: 'https://example.com',
        });
    });

    test('should handle content truncation', async ({ page }, testInfo) => {
        const collector = PageContextCollector.create(page, testInfo);

        // Create content that will be truncated (default maxContentLength is 9500)
        const longContent = 'A'.repeat(10000);
        const testUrl = `data:text/html,<!DOCTYPE html><html><body><p>${longContent}</p></body></html>`;

        const content = await collector.loadAndCollect(testUrl);

        expect(content.content.length).toBeLessThanOrEqual(9503); // 9500 + "..."
        expect(content.truncated).toBe(true);
        expect(content.fullContentLength).toBeGreaterThan(9500);
    });

    test('should exclude specified selectors', async ({ page }, testInfo) => {
        const collector = PageContextCollector.create(page, testInfo);

        // Test with selectors that should be excluded by default (.ad, .sidebar, .footer, .nav, .header)
        const testUrl =
            'data:text/html,<!DOCTYPE html><html><body><p>Include this</p><div class="ad">Exclude this ad</div><div class="sidebar">Exclude this sidebar</div></body></html>';

        const content = await collector.loadAndCollect(testUrl);

        expect(content.content).toContain('Include this');
        expect(content.content).not.toContain('Exclude this ad');
        expect(content.content).not.toContain('Exclude this sidebar');
    });

    test('should collect multiple headings', async ({ page }, testInfo) => {
        const collector = PageContextCollector.create(page, testInfo);

        const testUrl = 'data:text/html,<!DOCTYPE html><html><body><h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3></body></html>';

        const content = await collector.loadAndCollect(testUrl);

        expect(content.headings).toHaveLength(3);
        expect(content.headings[0]).toEqual({ level: 1, text: 'Heading 1' });
        expect(content.headings[1]).toEqual({ level: 2, text: 'Heading 2' });
        expect(content.headings[2]).toEqual({ level: 3, text: 'Heading 3' });
    });

    test('should collect images with alt text', async ({ page }, testInfo) => {
        const collector = PageContextCollector.create(page, testInfo);

        const testUrl =
            'data:text/html,<!DOCTYPE html><html><body><img src="test.jpg" alt="Test Image"><img src="test2.png"></body></html>';

        const content = await collector.loadAndCollect(testUrl);

        expect(content.images).toHaveLength(2);
        expect(content.images[0]).toEqual({
            src: 'test.jpg',
            alt: 'Test Image',
        });
        expect(content.images[1]).toEqual({
            src: 'test2.png',
            alt: '',
        });
    });
});
