// Background script for integration test extension
// Handles configuration loading and communication with content scripts

let configData = null;
let enabledFeatures = [];

// Set configuration in storage on startup
chrome.storage.local.set({
    cssConfig: configData,
    cssFeatures: enabledFeatures
}).then(() => {
    console.log('Background: Configuration set in storage', { configData, enabledFeatures });
}).catch((error) => {
    console.error('Background: Failed to set configuration:', error);
});

// Listen for installation to set up initial config
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        loadConfigurationFromStorage();
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CONFIG') {
        sendResponse({
            config: configData,
            enabledFeatures: enabledFeatures
        });
        return true; // Keep message channel open for async response
    }
});

// Load configuration from chrome.storage (set by command line args)
async function loadConfigurationFromStorage() {
    try {
        const result = await chrome.storage.local.get(['cssConfig', 'cssFeatures']);
        if (result.cssConfig) {
            configData = result.cssConfig;
        }
        if (result.cssFeatures) {
            enabledFeatures = result.cssFeatures;
        }
        console.log('Background: Loaded config from storage', { configData, enabledFeatures });
    } catch (error) {
        console.warn('Background: Failed to load config from storage:', error);
    }
}

// Listen for storage changes (in case config is updated)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.cssConfig) {
            configData = changes.cssConfig.newValue;
            console.log('Background: Config updated', configData);
        }
        if (changes.cssFeatures) {
            enabledFeatures = changes.cssFeatures.newValue;
            console.log('Background: Features updated', enabledFeatures);
        }
    }
});

// Initialize on startup
loadConfigurationFromStorage();
