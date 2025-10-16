#!/usr/bin/env node

/**
 * Example script demonstrating how to use PageContextCollector to extract
 * content from web pages using the DuckDuckGo content-scope-scripts page-context feature.
 * 
 * The script extracts page content and saves it to JSON files for further analysis.
 * 
 * Usage:
 * node page-context-example.js [url|file]
 * 
 * Arguments:
 * - Single URL: node page-context-example.js https://example.com
 * - URL file: node page-context-example.js urls.txt (newline-separated URLs)
 * - No args: Uses default test URLs
 * 
 * Options:
 * - --headful: Run with visible browser (default: headless)
 * - --timeout=N: Set browser launch timeout in seconds (default: 60)
 * 
 * Examples:
 * - node page-context-example.js --headful urls.txt
 * - node page-context-example.js --timeout=30 https://example.com
 * 
 * Files are saved to: page-context-collector/page-content-{hostname}-{timestamp}.json
 */

import { chromium } from 'playwright';
import { PageContextCollector } from './helpers/page-context-collector.js';
import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'os';

/**
 * Test URLs to demonstrate content extraction (used when no argument provided)
 */
const TEST_URLS = [
    'https://example.com',
    'https://www.wikipedia.org',
    'https://news.ycombinator.com',
];

/**
 * Read URLs from a text file (one URL per line)
 * @param {string} filePath - Path to the text file containing URLs
 * @returns {string[]} Array of URLs
 */
function readUrlsFromFile(filePath) {
    try {
        const fileContent = readFileSync(filePath, 'utf8');
        const urls = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#')); // Skip empty lines and comments
        
        console.log(`📁 Loaded ${urls.length} URLs from ${filePath}`);
        return urls;
    } catch (error) {
        console.error(`❌ Failed to read URL file ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Extract and display page content from a URL
 * @param {string} url - The URL to extract content from
 * @param {{headful: boolean, timeout: number}} options - Browser options
 */
async function extractPageContent(url, options = { headful: false, timeout: 60 }) {
    console.log(`\n🔍 Extracting content from: ${url}`);
    console.log('=' .repeat(60));

    // Create temporary directory for persistent context (like the test harness)
    const tmpDirPrefix = join(tmpdir(), 'ddg-temp-');
    const dataDir = mkdtempSync(tmpDirPrefix);

    // Launch browser with persistent context (like the test harness does)
    const launchOptions = {
        headless: !options.headful, // Use headless mode unless --headful specified
        channel: 'chromium',
        viewport: { width: 1280, height: 720 },
        timeout: options.timeout * 1000, // Convert seconds to milliseconds
        args: [
            '--disable-extensions-except=integration-test/extension',
            '--load-extension=integration-test/extension',
            '--disable-dev-shm-usage', // Helps with resource constraints
            '--no-sandbox' // Helps in some environments
        ]
    };

    let context;
    try {
        console.log('🚀 Launching browser...');
        context = await chromium.launchPersistentContext(dataDir, launchOptions);
        console.log('✅ Browser launched successfully');
    } catch (error) {
        if (error.message.includes('Timeout')) {
            console.log('⚠️  Browser launch timed out, trying with fallback options...');
            // Fallback: try without extension for basic testing
            const fallbackOptions = {
                ...launchOptions,
                args: launchOptions.args.filter(arg => !arg.includes('extension'))
            };
            context = await chromium.launchPersistentContext(dataDir, fallbackOptions);
            console.log('✅ Browser launched in fallback mode (without extension)');
        } else {
            throw error;
        }
    }

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
 * Write page content to a JSON file in the page-context-collector directory
 * @param {Object} content - The extracted page content
 * @param {string} url - The URL that was processed
 */
function writeContentToFile(content, url) {
    // Create output directory if it doesn't exist
    const outputDir = 'page-context-collector';
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created directory: ${outputDir}`);
    }
    
    // Create a safe filename from the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `page-content-${hostname}-${timestamp}.json`;
    const filepath = join(outputDir, filename);
    
    // Prepare the output data
    const outputData = {
        url: url,
        extractedAt: new Date().toISOString(),
        content: content
    };
    
    try {
        writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf8');
        console.log(`💾 Content saved to: ${filepath}`);
        return filepath;
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
 * Determine if a string is a URL or a file path
 * @param {string} input - The input string to check
 * @returns {boolean} True if it looks like a URL
 */
function isUrl(input) {
    return input.startsWith('http://') || input.startsWith('https://');
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {{input: string|null, headful: boolean, timeout: number}}
 */
function parseArgs(args) {
    /** @type {{input: string|null, headful: boolean, timeout: number}} */
    const options = {
        input: null,
        headful: false,
        timeout: 60
    };

    for (const arg of args) {
        if (arg === '--headful') {
            options.headful = true;
        } else if (arg.startsWith('--timeout=')) {
            options.timeout = parseInt(arg.split('=')[1]) || 60;
        } else if (!arg.startsWith('--')) {
            options.input = arg;
        }
    }

    return options;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    console.log('🦆 DuckDuckGo Page Context Content Extractor');
    console.log('Using content-scope-scripts page-context feature');
    console.log(`Mode: ${options.headful ? 'Visible browser' : 'Headless'}`);
    console.log(`Timeout: ${options.timeout}s\n`);

    let urlsToProcess = [];

    if (options.input) {
        if (isUrl(options.input)) {
            // Single URL provided
            console.log('Processing single URL...\n');
            urlsToProcess = [options.input];
        } else {
            // File path provided - read URLs from file
            console.log('Reading URLs from file...\n');
            urlsToProcess = readUrlsFromFile(options.input);
        }
    } else {
        // No argument provided - use default test URLs
        console.log('No argument provided. Using default test URLs...\n');
        urlsToProcess = TEST_URLS;
    }

    // Process all URLs
    for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        console.log(`📊 Progress: ${i + 1}/${urlsToProcess.length}`);
        
        try {
            await extractPageContent(url, options);
        } catch (error) {
            console.error(`❌ Failed to extract content from ${url}: ${error.message}`);
            console.log('⏭️  Continuing with next URL...');
        }
        
        // Add a small delay between requests (except for the last one)
        if (i < urlsToProcess.length - 1) {
            console.log('\n' + '─'.repeat(60));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n✅ Content extraction complete! JSON files saved to page-context-collector/ directory.');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}
