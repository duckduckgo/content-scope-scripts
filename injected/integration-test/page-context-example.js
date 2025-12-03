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
 * - --no-truncate: Disable content truncation (removes maxContentLength limit)
 * - --output-dir=PATH: Set output directory for crawl results (default: page-context-collector)
 * 
 * Examples:
 * - node page-context-example.js --headful urls.txt
 * - node page-context-example.js --timeout=30 https://example.com
 * - node page-context-example.js --no-truncate https://example.com
 * - node page-context-example.js --output-dir=./custom-output urls.txt
 * 
 * Output Files into the output directory:
 * - pages/{hostname}-{timestamp}.json (page content)
 * - har/{hostname}-{timestamp}.har (network requests)
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
 * @param {{headful: boolean, timeout: number, noTruncate: boolean}} options - Browser options
 */
async function extractPageContent(url, options = { headful: false, timeout: 60, noTruncate: false }) {
    logMessage(`Starting extraction from: ${url}`, 'INFO');
    console.log(`\n🔍 Extracting content from: ${url}`);
    console.log('=' .repeat(60));
    
    crawlState.totalProcessed++;

    // Create temporary directory for persistent context (like the test harness)
    const tmpDirPrefix = join(tmpdir(), 'ddg-temp-');
    const dataDir = mkdtempSync(tmpDirPrefix);

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

    // Launch browser with persistent context and HAR recording
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
        ],
        // Enable HAR recording using Playwright's built-in feature
        recordHar: {
            path: harFilepath,
            mode: /** @type {'full'} */ ('full') // Record all network activity
        }
    };

    let context;
    try {
        logMessage('Launching browser...', 'DEBUG');
        console.log('🚀 Launching browser...');
        context = await chromium.launchPersistentContext(dataDir, launchOptions);
        logMessage('Browser launched successfully', 'DEBUG');
        console.log('✅ Browser launched successfully');
    } catch (error) {
        if (error.message.includes('Timeout')) {
            logMessage('Browser launch timed out, trying fallback options', 'WARN');
            console.log('⚠️  Browser launch timed out, trying with fallback options...');
            // Fallback: try without extension for basic testing
            const fallbackOptions = {
                ...launchOptions,
                args: launchOptions.args.filter(arg => !arg.includes('extension'))
            };
            context = await chromium.launchPersistentContext(dataDir, fallbackOptions);
            logMessage('Browser launched in fallback mode (without extension)', 'WARN');
            console.log('✅ Browser launched in fallback mode (without extension)');
        } else {
            throw error;
        }
    }

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

        // Create the page context collector using ResultsCollector directly
        const scriptDir = new URL('.', import.meta.url).pathname;
        //const scriptDir = './integration-test';
        const configDir = join(scriptDir, 'test-pages/page-context/config');
        let customConfigPath = join(configDir, 'page-context-enabled.json');
        if (options.noTruncate) {
            logMessage('Using custom config with no truncation', 'DEBUG');
            console.log('Using custom config with no truncation');
            customConfigPath = join(configDir, 'page-context-enabled-no-truncation.json');
        }
        // @ts-ignore - Using simplified mock for standalone example - mockTestInfo doesn't have all TestInfo properties
        const collector = new PageContextCollector(page, mockTestInfo, customConfigPath);

        logMessage('Loading and collecting page content', 'DEBUG');
        console.log('Loading and collecting page content');
        
        // Load and collect page content
        const content = await collector.loadAndCollect(url);
        logMessage("Collected page content", 'DEBUG');
        console.log("Collected page content");
        
        // Display the extracted content
        displayContent(content);
        
        // Write content to file
        const contentFile = writeContentToFile(content, url);
        
        // Log success (HAR file is automatically generated by Playwright)
        logSuccess(url, contentFile || '', harFilepath);

        await context.close();
        
        // Clean up temporary data directory
        rmSync(dataDir, { recursive: true, force: true });
    } catch (error) {
        logMessage(`Error extracting content from ${url}: ${error.message}`, 'ERROR');
        console.error(`❌ Error extracting content from ${url}:`, error.message);
        
        // Log failure
        logFailure(url, error.message);
        
        // Still clean up on error
        try {
            await context.close();
            rmSync(dataDir, { recursive: true, force: true });
        } catch (cleanupError) {
            logMessage(`Error during cleanup: ${cleanupError.message}`, 'ERROR');
            console.error('Error during cleanup:', cleanupError.message);
        }
    }
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
    /** @type {{input: string|null, headful: boolean, timeout: number, noTruncate: boolean, outputDir: string|null}} */
    const options = {
        input: null,
        headful: false,
        timeout: 60,
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
    console.log(`Truncation: ${options.noTruncate ? 'Disabled' : 'Enabled (9500 chars max)'}`);
    console.log(`Log file: ${logFile}\n`);
    
    logMessage('Starting DuckDuckGo Page Context Content Extractor', 'INFO');
    logMessage(`Mode: ${options.headful ? 'Visible browser' : 'Headless'}`, 'INFO');
    logMessage(`Timeout: ${options.timeout}s`, 'INFO');
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

    // Process all URLs
    for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        console.log(`📊 Progress: ${i + 1}/${urlsToProcess.length}`);
        logMessage(`Processing URL ${i + 1}/${urlsToProcess.length}: ${url}`, 'INFO');
        
        try {
            await extractPageContent(url, options);
        } catch (error) {
            logMessage(`Failed to extract content from ${url}: ${error.message}`, 'ERROR');
            console.error(`❌ Failed to extract content from ${url}: ${error.message}`);
            console.log('⏭️  Continuing with next URL...');
        }
        
        // Add a small delay between requests (except for the last one)
        if (i < urlsToProcess.length - 1) {
            console.log('\n' + '─'.repeat(60));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
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
