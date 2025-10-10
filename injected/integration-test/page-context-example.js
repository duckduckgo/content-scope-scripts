#!/usr/bin/env node

/**
 * Example script demonstrating how to use PageContextCollector to extract
 * content from web pages using the DuckDuckGo content-scope-scripts page-context feature.
 * 
 * The script extracts page content and saves it to JSON files for further analysis.
 * 
 * Usage:
 * node page-context-example.js [url]
 * 
 * If no URL is provided, it will test with a few example URLs.
 * Files are saved as: page-content-{hostname}-{timestamp}.json
 */

import { chromium } from 'playwright';
import { PageContextCollector } from './helpers/page-context-collector.js';
import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'os';

/**
 * Test URLs to demonstrate content extraction
 */
const TEST_URLS = [
    'https://example.com',
    'https://www.wikipedia.org',
    'https://news.ycombinator.com',
];

/**
 * Extract and display page content from a URL
 * @param {string} url - The URL to extract content from
 */
async function extractPageContent(url) {
    console.log(`\n🔍 Extracting content from: ${url}`);
    console.log('=' .repeat(60));

    // Create temporary directory for persistent context (like the test harness)
    const tmpDirPrefix = join(tmpdir(), 'ddg-temp-');
    const dataDir = mkdtempSync(tmpDirPrefix);

    // Launch browser with persistent context (like the test harness does)
    const context = await chromium.launchPersistentContext(dataDir, {
        headless: false,
        viewport: { width: 1280, height: 720 },
        args: [
            '--disable-extensions-except=integration-test/extension',
            '--load-extension=integration-test/extension'
        ]
    });

    try {
        const page = await context.newPage();

        // Create a mock use config (what ResultsCollector needs)
        const mockUse = {
            injectName: 'integration',
            platform: 'extension'
        };

        // Create the page context collector using ResultsCollector directly
        // @ts-ignore - Using simplified mock for standalone example
        const collector = PageContextCollector.create(page, { project: { use: mockUse } });

        // Note: Settings are configured via JSON config file, not runtime options
        // This method is kept for API compatibility but actual config is in:
        // ./integration-test/test-pages/page-context/config/page-context-enabled.json

        console.log('Loading and collecting page content');
        // Load and collect page content
        const content = await collector.loadAndCollect(url);
        console.log("Collected page content");
        // Display the extracted content
        displayContent(content);
        
        // Write content to file
        writeContentToFile(content, url);

        await context.close();
        
        // Clean up temporary data directory
        rmSync(dataDir, { recursive: true, force: true });
    } catch (error) {
        console.error(`❌ Error extracting content from ${url}:`, error.message);
        // Still clean up on error
        try {
            await context.close();
            rmSync(dataDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError.message);
        }
    }
}

/**
 * Write page content to a JSON file
 * @param {Object} content - The extracted page content
 * @param {string} url - The URL that was processed
 */
function writeContentToFile(content, url) {
    // Create a safe filename from the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `page-content-${hostname}-${timestamp}.json`;
    
    // Prepare the output data
    const outputData = {
        url: url,
        extractedAt: new Date().toISOString(),
        content: content
    };
    
    try {
        writeFileSync(filename, JSON.stringify(outputData, null, 2), 'utf8');
        console.log(`💾 Content saved to: ${filename}`);
        return filename;
    } catch (error) {
        console.error(`❌ Failed to write file: ${error.message}`);
        return null;
    }
}

/**
 * Display extracted content in a formatted way
 * @param {Object} content - The extracted page content
 */
function displayContent(content) {
    console.log(`📄 Title: ${content.title || 'No title'}`);
    
    if (content.metaDescription) {
        console.log(`📝 Description: ${content.metaDescription}`);
    }

    if (content.headings && content.headings.length > 0) {
        console.log('\n📋 Headings:');
        content.headings.forEach(heading => {
            const indent = '  '.repeat(heading.level - 1);
            console.log(`${indent}${heading.level === 1 ? '█' : '▶'} ${heading.text}`);
        });
    }

    if (content.links && content.links.length > 0) {
        console.log(`\n🔗 Links found: ${content.links.length}`);
        content.links.slice(0, 5).forEach(link => {
            console.log(`  → ${link.text} (${link.href})`);
        });
        if (content.links.length > 5) {
            console.log(`  ... and ${content.links.length - 5} more`);
        }
    }

    if (content.images && content.images.length > 0) {
        console.log(`\n🖼️  Images found: ${content.images.length}`);
        content.images.slice(0, 3).forEach(img => {
            console.log(`  → ${img.alt || 'No alt text'} (${img.src})`);
        });
        if (content.images.length > 3) {
            console.log(`  ... and ${content.images.length - 3} more`);
        }
    }

    console.log(`\n📄 Content preview (${content.fullContentLength || content.content?.length || 0} chars total):`);
    const preview = content.content ? content.content.substring(0, 300) : 'No content';
    console.log(preview + (content.content?.length > 300 ? '...' : ''));

    if (content.truncated) {
        console.log(`\n⚠️  Content was truncated (original length: ${content.fullContentLength} chars)`);
    }

    console.log(`\n📊 Extraction stats:`);
    console.log(`  • URL: ${content.url}`);
    console.log(`  • Timestamp: ${new Date(content.timestamp).toLocaleString()}`);
    console.log(`  • Favicon: ${content.favicon ? 'Yes' : 'No'}`);
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const customUrl = args[0];

    console.log('🦆 DuckDuckGo Page Context Content Extractor');
    console.log('Using content-scope-scripts page-context feature\n');

    if (customUrl) {
        // Extract content from the provided URL
        await extractPageContent(customUrl);
    } else {
        // Test with example URLs
        console.log('No URL provided. Testing with example URLs...\n');
        
        for (const url of TEST_URLS) {
            await extractPageContent(url);
            
            // Add a small delay between requests
            if (TEST_URLS.indexOf(url) < TEST_URLS.length - 1) {
                console.log('\n' + '─'.repeat(60));
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    console.log('\n✅ Content extraction complete! JSON files saved to current directory.');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}
