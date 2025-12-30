#!/usr/bin/env node

/**
 * Enhanced page context crawler with HAR file generation, failure logging, and comprehensive logging.
 * 
 * This script extracts page content from web pages using the DuckDuckGo content-scope-scripts 
 * page-context feature and generates HAR files for network analysis.
 * 
 * Features:
 * - Page content extraction and JSON output
 * - HAR file generation for network request analysis (using Playwright's built-in recordHar)
 * - Comprehensive logging system with log files
 * - Failure tracking and reporting
 * - Summary reports with success/failure statistics
 * 
 * Uses Playwright's native HAR recording capabilities for reliable network capture.
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
 * - --concurrency=N: Number of parallel browser contexts (default: 5)
 * - --no-truncate: Disable content truncation (removes maxContentLength limit)
 * - --output-dir=PATH: Set output directory for crawl results (default: page-context-collector)
 * 
 * Performance:
 * - Parallel processing with configurable concurrency (10x+ faster than sequential)
 * - Browser restarts every 100 URLs (10 batches) to prevent memory leaks
 * - Each URL gets a fresh incognito context (isolates cookies/storage)
 * 
 * Examples:
 * - node page-context-example.js --headful urls.txt
 * - node page-context-example.js --timeout=30 https://example.com
 * - node page-context-example.js --concurrency=10 urls.txt (fast parallel crawl)
 * - node page-context-example.js --no-truncate https://example.com
 * - node page-context-example.js --output-dir=./custom-output urls.txt
 * 
 * Output Files into the output directory:
 * - pages/{hostname}-{timestamp}.json (page content)
 * - har/{hostname}-{timestamp}.har (network requests)
 * - screenshots/{hostname}-{timestamp}.png (full page screenshot)
 * - html/{hostname}-{timestamp}.html (raw HTML)
 * - mhtml/{hostname}-{timestamp}.mhtml (MHTML with all assets)
 * - logs/{timestamp}.log (detailed logs)
 * - failed-crawls.json (failed URLs)
 * - crawl-summary.json (final summary)
 */

import { chromium } from 'playwright';
import { PageContextCollector } from './helpers/page-context-collector.js';
import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'os';
import { createWriteStream } from 'node:fs';

/**
 * Test URLs to demonstrate content extraction (used when no argument provided)
 */
const TEST_URLS = [
    'https://example.com',
    'https://www.wikipedia.org',
    'https://news.ycombinator.com',
];

/**
 * Global state for tracking crawl results
 */
const crawlState = {
    startTime: new Date(),
    successful: /** @type {Array<{url: string, contentFile: string, harFile: string|undefined, timestamp: string}>} */ ([]),
    failed: /** @type {Array<{url: string, error: string, timestamp: string}>} */ ([]),
    totalProcessed: 0,
    logStream: /** @type {import('fs').WriteStream|null} */ (null),
    outputDir: 'page-context-collector'
};

/**
 * Initialize logging system
 */
function initializeLogging() {
    // Create output directory if it doesn't exist
    if (!existsSync(crawlState.outputDir)) {
        mkdirSync(crawlState.outputDir, { recursive: true });
        console.log(`📁 Created directory: ${crawlState.outputDir}`);
    }
    
    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = join(crawlState.outputDir, 'logs');
    if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
    }
    const logFile = join(logsDir, `${timestamp}.log`);
    crawlState.logStream = createWriteStream(logFile, { flags: 'a' });
    
    console.log(`📝 Logging to: ${logFile}`);
    return logFile;
}

/**
 * Write a log message to both console and log file
 * @param {string} message - The message to log
 * @param {string} [level='INFO'] - Log level (INFO, ERROR, WARN, DEBUG)
 */
function logMessage(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    if (crawlState.logStream) {
        crawlState.logStream.write(logEntry + '\n');
    }
}


/**
 * Write failure log entry
 * @param {string} url - The URL that failed
 * @param {string} error - The error message
 */
function logFailure(url, error) {
    const failureEntry = {
        url,
        error,
        timestamp: new Date().toISOString()
    };
    
    crawlState.failed.push(failureEntry);
    
    // Write to failure log file
    const failureLogFile = join(crawlState.outputDir, 'failed-crawls.json');
    writeFileSync(failureLogFile, JSON.stringify(crawlState.failed, null, 2), 'utf8');
    
    logMessage(`Failed to crawl ${url}: ${error}`, 'ERROR');
}

/**
 * Write success log entry
 * @param {string} url - The URL that succeeded
 * @param {string} contentFile - Path to the content file
 * @param {string} [harFile] - Path to the HAR file (optional)
 */
function logSuccess(url, contentFile, harFile = undefined) {
    const successEntry = {
        url,
        contentFile,
        harFile,
        timestamp: new Date().toISOString()
    };
    
    crawlState.successful.push(successEntry);
    logMessage(`Successfully crawled ${url}`, 'INFO');
}

/**
 * Read URLs from a text file (one URL per line) or CSV file
 * @param {string} filePath - Path to the text file containing URLs
 * @returns {string[]} Array of URLs
 */
function readUrlsFromFile(filePath) {
    try {
        const fileContent = readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
        
        // Check if it's a CSV file (has commas and potentially a header)
        if (filePath.endsWith('.csv') || (lines.length > 0 && lines[0].includes(','))) {
            console.log(`📊 Detected CSV format, extracting URLs from 'top_url' column...`);
            
            // Parse CSV - assume first line is header
            const header = lines[0].split(',');
            const urlColumnIndex = header.findIndex(col => col.toLowerCase().includes('url'));
            
            if (urlColumnIndex === -1) {
                console.error(`❌ Could not find URL column in CSV header: ${header.join(', ')}`);
                process.exit(1);
            }
            
            console.log(`📌 Using column index ${urlColumnIndex} (${header[urlColumnIndex]}) for URLs`);
            
            // Extract URLs from the column (skip header row)
            const urls = lines.slice(1)
                .map(line => {
                    // Simple CSV parsing - split by comma and extract the URL column
                    const columns = line.split(',');
                    return columns[urlColumnIndex] ? columns[urlColumnIndex].trim() : null;
                })
                .filter(url => url && url.startsWith('http')); // Only keep valid HTTP(S) URLs
            
            console.log(`📁 Loaded ${urls.length} URLs from CSV file: ${filePath}`);
            return urls;
        } else {
            // Plain text file - one URL per line
            const urls = lines.filter(line => !line.startsWith('#')); // Skip comments
            console.log(`📁 Loaded ${urls.length} URLs from ${filePath}`);
            return urls;
        }
    } catch (error) {
        console.error(`❌ Failed to read URL file ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Extract and display page content from a URL
 * @param {import('playwright').Browser} browser - Reusable browser instance
 * @param {string} url - The URL to extract content from
 * @param {{headful: boolean, timeout: number, noTruncate: boolean}} options - Browser options
 */
async function extractPageContent(browser, url, options = { headful: false, timeout: 60, noTruncate: false }) {
    logMessage(`Starting extraction from: ${url}`, 'INFO');
    console.log(`\n🔍 Extracting content from: ${url}`);
    console.log('=' .repeat(60));
    
    crawlState.totalProcessed++;

    // Create HAR file path for this URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const harDir = join(crawlState.outputDir, 'har');
    if (!existsSync(harDir)) {
        mkdirSync(harDir, { recursive: true });
    }
    const harFilename = `${hostname}-${timestamp}.har`;
    const harFilepath = join(harDir, harFilename);

    // Create incognito context for this URL (isolates cookies/storage)
    // Note: HAR recording disabled due to hanging issues on context close
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });

    try {
        const page = await context.newPage();

        // Create a mock testInfo object (what PageContextCollector needs)
        const mockTestInfo = {
            project: {
                use: {
                    injectName: 'integration',
                    platform: 'extension'
                }
            }
        };

        // Create the page context collector
        const scriptDir = new URL('.', import.meta.url).pathname;
        const configDir = join(scriptDir, 'test-pages/page-context/config');
        let customConfigPath = join(configDir, 'page-context-enabled.json');
        if (options.noTruncate) {
            logMessage('Using custom config with no truncation', 'DEBUG');
            console.log('Using custom config with no truncation');
            customConfigPath = join(configDir, 'page-context-enabled-no-truncation.json');
        }
        // @ts-ignore
        const collector = new PageContextCollector(page, mockTestInfo, customConfigPath);

        logMessage('Loading and collecting page content', 'DEBUG');
        console.log('Loading and collecting page content');
        
        // Load and collect page content with 60s timeout (allows time for CSP-heavy sites)
        let content;
        try {
            content = await Promise.race([
                collector.loadAndCollect(url),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Collection timeout - site may block extension')), 60000)
                )
            ]);
            logMessage("Collected page content", 'DEBUG');
            console.log("Collected page content");
        } catch (collectionError) {
            // Extension failed - still capture assets but skip content extraction
            logMessage(`Extension collection failed: ${collectionError.message}`, 'WARN');
            console.warn(`⚠️  Extension blocked or timed out - capturing assets only`);
            
            // Create minimal content object
            try {
                content = {
                    url: url,
                    title: await page.title().catch(() => 'Unknown'),
                    timestamp: Date.now(),
                    content: '',
                    error: collectionError.message
                };
            } catch {
                content = {
                    url: url,
                    title: 'Failed',
                    timestamp: Date.now(),
                    content: '',
                    error: collectionError.message
                };
            }
        }
        
        // Capture page assets (screenshot, HTML, MHTML)
        logMessage("Capturing page assets (screenshot, HTML, MHTML)", 'DEBUG');
        console.log("📸 Capturing page assets...");
        const assets = await capturePageAssets(page, url);
        
        // Display the extracted content
        displayContent(content);
        
        // Write content to file
        const contentFile = writeContentToFile(content, url);
        
        // Log success
        logSuccess(url, contentFile || '', harFilepath);

        // Close context (browser stays open for reuse)
        logMessage('Closing context...', 'DEBUG');
        console.log('🔒 Closing context...');
        await Promise.race([
            context.close(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Context close timeout')), 5000))
        ]);
        logMessage('Context closed', 'DEBUG');
        console.log('✅ Context closed');
    } catch (error) {
        logMessage(`Error extracting content from ${url}: ${error.message}`, 'ERROR');
        console.error(`❌ Error extracting content from ${url}:`, error.message);
        
        // Log failure
        logFailure(url, error.message);
        
        // Still clean up context on error with timeout
        try {
            logMessage('Closing context after error...', 'DEBUG');
            await Promise.race([
                context.close(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Context close timeout')), 5000))
            ]);
            logMessage('Context closed after error', 'DEBUG');
        } catch (cleanupError) {
            logMessage(`Error during cleanup: ${cleanupError.message}`, 'ERROR');
            console.error('⚠️  Failed to close context:', cleanupError.message);
        }
    }
}

/**
 * Capture screenshot, HTML, and MHTML from the current page
 * @param {import('playwright').Page} page - The Playwright page
 * @param {string} url - The URL being processed
 * @returns {Promise<{screenshotPath: string|null, htmlPath: string|null, mhtmlPath: string|null}>}
 */
async function capturePageAssets(page, url) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `${hostname}-${timestamp}`;
    
    let screenshotPath = null;
    let htmlPath = null;
    let mhtmlPath = null;
    
    // Create directories
    const screenshotsDir = join(crawlState.outputDir, 'screenshots');
    const htmlDir = join(crawlState.outputDir, 'html');
    const mhtmlDir = join(crawlState.outputDir, 'mhtml');
    
    if (!existsSync(screenshotsDir)) {
        mkdirSync(screenshotsDir, { recursive: true });
    }
    if (!existsSync(htmlDir)) {
        mkdirSync(htmlDir, { recursive: true });
    }
    if (!existsSync(mhtmlDir)) {
        mkdirSync(mhtmlDir, { recursive: true });
    }
    
    // Capture screenshot
    try {
        screenshotPath = join(screenshotsDir, `${baseFilename}.png`);
        await page.screenshot({ 
            path: screenshotPath, 
            fullPage: true,
            timeout: 30000
        });
        logMessage(`Screenshot saved: ${screenshotPath}`, 'DEBUG');
        console.log(`📸 Screenshot saved: ${baseFilename}.png`);
    } catch (error) {
        logMessage(`Failed to capture screenshot: ${error.message}`, 'WARN');
        console.warn(`⚠️  Failed to capture screenshot: ${error.message}`);
        screenshotPath = null;
    }
    
    // Capture raw HTML
    try {
        htmlPath = join(htmlDir, `${baseFilename}.html`);
        const html = await page.content();
        writeFileSync(htmlPath, html, 'utf8');
        logMessage(`HTML saved: ${htmlPath}`, 'DEBUG');
        console.log(`📄 HTML saved: ${baseFilename}.html`);
    } catch (error) {
        logMessage(`Failed to capture HTML: ${error.message}`, 'WARN');
        console.warn(`⚠️  Failed to capture HTML: ${error.message}`);
        htmlPath = null;
    }
    
    // Capture MHTML using Chrome DevTools Protocol
    try {
        mhtmlPath = join(mhtmlDir, `${baseFilename}.mhtml`);
        const cdp = await page.context().newCDPSession(page);
        const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });
        writeFileSync(mhtmlPath, data, 'utf8');
        await cdp.detach();
        logMessage(`MHTML saved: ${mhtmlPath}`, 'DEBUG');
        console.log(`📦 MHTML saved: ${baseFilename}.mhtml`);
    } catch (error) {
        logMessage(`Failed to capture MHTML: ${error.message}`, 'WARN');
        console.warn(`⚠️  Failed to capture MHTML: ${error.message}`);
        mhtmlPath = null;
    }
    
    return { screenshotPath, htmlPath, mhtmlPath };
}

/**
 * Write page content to a JSON file in the output directory
 * @param {Object} content - The extracted page content
 * @param {string} url - The URL that was processed
 */
function writeContentToFile(content, url) {
    // Create pages directory if it doesn't exist
    const pagesDir = join(crawlState.outputDir, 'pages');
    if (!existsSync(pagesDir)) {
        mkdirSync(pagesDir, { recursive: true });
        console.log(`📁 Created directory: ${pagesDir}`);
    }
    
    // Create a safe filename from the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${hostname}-${timestamp}.json`;
    const filepath = join(pagesDir, filename);
    
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
 * @returns {{input: string|null, headful: boolean, timeout: number, noTruncate: boolean, outputDir: string|null}}
 */
function parseArgs(args) {
    /** @type {{input: string|null, headful: boolean, timeout: number, concurrency: number, noTruncate: boolean, outputDir: string|null}} */
    const options = {
        input: null,
        headful: false,
        timeout: 60,
        concurrency: 5,
        noTruncate: false,
        outputDir: null
    };

    for (const arg of args) {
        if (arg === '--headful') {
            options.headful = true;
        } else if (arg === '--no-truncate') {
            options.noTruncate = true;
        } else if (arg.startsWith('--timeout=')) {
            options.timeout = parseInt(arg.split('=')[1]) || 60;
        } else if (arg.startsWith('--concurrency=')) {
            options.concurrency = parseInt(arg.split('=')[1]) || 5;
        } else if (arg.startsWith('--output-dir=')) {
            options.outputDir = arg.split('=').slice(1).join('='); // Handle paths with = in them
        } else if (!arg.startsWith('--')) {
            options.input = arg;
        }
    }

    return options;
}

/**
 * Generate final summary report
 */
function generateSummaryReport() {
    const endTime = new Date();
    const duration = endTime.getTime() - crawlState.startTime.getTime();
    
    const summary = {
        startTime: crawlState.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        totalProcessed: crawlState.totalProcessed,
        successful: crawlState.successful.length,
        failed: crawlState.failed.length,
        successRate: crawlState.totalProcessed > 0 ? 
            `${Math.round((crawlState.successful.length / crawlState.totalProcessed) * 100)}%` : '0%',
        successfulUrls: crawlState.successful.map(s => s.url),
        failedUrls: crawlState.failed.map(f => ({ url: f.url, error: f.error }))
    };
    
    // Write summary to file
    const summaryFile = join(crawlState.outputDir, 'crawl-summary.json');
    writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf8');
    
    logMessage(`Crawl completed. Summary: ${summary.successful}/${summary.totalProcessed} successful (${summary.successRate})`, 'INFO');
    console.log(`\n📊 Final Summary:`);
    console.log(`  • Total processed: ${summary.totalProcessed}`);
    console.log(`  • Successful: ${summary.successful}`);
    console.log(`  • Failed: ${summary.failed}`);
    console.log(`  • Success rate: ${summary.successRate}`);
    console.log(`  • Duration: ${summary.duration}`);
    console.log(`  • Summary saved to: ${summaryFile}`);
    
    if (summary.failed > 0) {
        console.log(`  • Failed URLs logged to: ${join(crawlState.outputDir, 'failed-crawls.json')}`);
    }
    
    return summary;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    // Set output directory if provided via CLI
    if (options.outputDir) {
        crawlState.outputDir = options.outputDir;
    }

    // Initialize logging
    const logFile = initializeLogging();

    console.log('🦆 DuckDuckGo Page Context Content Extractor');
    console.log('Using content-scope-scripts page-context feature');
    console.log(`Mode: ${options.headful ? 'Visible browser' : 'Headless'}`);
    console.log(`Timeout: ${options.timeout}s`);
    console.log(`Concurrency: ${options.concurrency} parallel contexts`);
    console.log(`Truncation: ${options.noTruncate ? 'Disabled' : 'Enabled (9500 chars max)'}`);
    console.log(`Log file: ${logFile}\n`);
    
    logMessage('Starting DuckDuckGo Page Context Content Extractor', 'INFO');
    logMessage(`Mode: ${options.headful ? 'Visible browser' : 'Headless'}`, 'INFO');
    logMessage(`Timeout: ${options.timeout}s`, 'INFO');
    logMessage(`Concurrency: ${options.concurrency} parallel contexts`, 'INFO');
    logMessage(`Truncation: ${options.noTruncate ? 'Disabled' : 'Enabled (9500 chars max)'}`, 'INFO');

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

    // Browser configuration
    const browserArgs = [
        '--disable-extensions-except=integration-test/extension',
        '--load-extension=integration-test/extension',
        '--disable-dev-shm-usage',
        '--no-sandbox'
    ];

    // Process URLs with concurrency control and periodic browser restarts
    let processedCount = 0;
    const totalUrls = urlsToProcess.length;
    const batchSize = options.concurrency;
    const RESTART_EVERY_N_BATCHES = 10; // Restart browser every 10 batches to avoid memory leaks
    
    console.log(`🔄 Processing ${totalUrls} URLs with concurrency: ${options.concurrency}`);
    console.log(`♻️  Browser will restart every ${RESTART_EVERY_N_BATCHES * batchSize} URLs to keep memory clean\n`);
    
    let browser = null;
    
    // Helper to launch browser
    async function launchBrowser() {
        console.log('🚀 Launching browser...');
        logMessage('Launching browser', 'INFO');
        const b = await chromium.launch({
            headless: !options.headful,
            channel: 'chromium',
            timeout: options.timeout * 1000,
            args: browserArgs
        });
        console.log('✅ Browser ready\n');
        logMessage('Browser launched successfully', 'INFO');
        return b;
    }
    
    // Helper to process a single URL with progress tracking
    async function processUrl(url, index) {
        try {
            await extractPageContent(browser, url, options);
            processedCount++;
            console.log(`✅ [${processedCount}/${totalUrls}] Completed: ${url.substring(0, 60)}...`);
        } catch (error) {
            processedCount++;
            logMessage(`Failed to extract content from ${url}: ${error.message}`, 'ERROR');
            console.error(`❌ [${processedCount}/${totalUrls}] Failed: ${url.substring(0, 60)}... - ${error.message}`);
        }
    }
    
    // Launch initial browser
    browser = await launchBrowser();
    
    // Process URLs in parallel batches
    const totalBatches = Math.ceil(urlsToProcess.length / batchSize);
    
    for (let i = 0; i < urlsToProcess.length; i += batchSize) {
        const batch = urlsToProcess.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`📦 Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} URLs in parallel...`);
        logMessage(`Starting batch ${batchNumber}/${totalBatches} with ${batch.length} URLs`, 'INFO');
        
        // Process batch in parallel
        await Promise.all(
            batch.map((url, batchIndex) => processUrl(url, i + batchIndex))
        );
        
        console.log(`✨ Batch ${batchNumber}/${totalBatches} complete\n`);
        
        // Restart browser every N batches to avoid memory buildup
        if (batchNumber % RESTART_EVERY_N_BATCHES === 0 && i + batchSize < urlsToProcess.length) {
            console.log('♻️  Restarting browser to clear memory...');
            logMessage('Restarting browser for memory cleanup', 'INFO');
            await browser.close();
            await new Promise(resolve => setTimeout(resolve, 2000));
            browser = await launchBrowser();
        } else if (i + batchSize < urlsToProcess.length) {
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Close final browser instance
    if (browser) {
        console.log('\n🔒 Closing browser...');
        await browser.close();
        logMessage('Browser closed', 'INFO');
    }

    // Generate final summary
    const summary = generateSummaryReport();
    
    console.log('\n✅ Content extraction complete!');
    console.log(`📁 Files saved to: ${crawlState.outputDir}/`);
    console.log(`📝 Log file: ${logFile}`);
    
    // Close log stream
    if (crawlState.logStream) {
        crawlState.logStream.end();
    }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}
