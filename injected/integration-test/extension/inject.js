function injectContentScript(src) {
    const elem = document.head || document.documentElement;
    const script = document.createElement('script');
    script.src = src;
    script.onload = function () {
        this.remove();
    };
    elem.appendChild(script);
}

// Load configuration from background script or URL parameters
async function loadConfiguration() {
    let configData = null;
    let enabledFeatures = [];

    // First, try to get config from background script
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
        if (response && (response.config || response.enabledFeatures)) {
            configData = response.config;
            enabledFeatures = response.enabledFeatures || [];
            console.log('Content script: Got config from background script', { configData, enabledFeatures });
        }
    } catch (error) {
        console.log('Content script: No background config, falling back to URL params');
    }

    // Fallback to URL parameters if no background config
    if (!configData && !enabledFeatures.length) {
        const urlParams = new URLSearchParams(window.location.search);
        const configPath = urlParams.get('config');
        enabledFeatures = urlParams.get('features') ? 
            urlParams.get('features').split(',') : [];

        if (configPath) {
            try {
                const response = await fetch(`/test-pages/${configPath}`);
                configData = await response.json();
                console.log('Content script: Loaded config from URL', configData);
            } catch (error) {
                console.warn('Content script: Failed to load configuration from URL:', error);
            }
        }
    }

    // Dispatch configuration event if we have any config
    if (configData || enabledFeatures.length > 0) {
        const finalConfig = configData || {
            unprotectedTemporary: [],
            features: {}
        };

        const finalFeatures = enabledFeatures.length > 0 ? enabledFeatures : 
            Object.keys(finalConfig.features || {}).filter(name => 
                finalConfig.features[name].state === 'enabled'
            );

        // If we have features but no config, create minimal config
        if (enabledFeatures.length > 0 && !configData) {
            enabledFeatures.forEach(feature => {
                finalConfig.features[feature] = {
                    state: 'enabled',
                    exceptions: [],
                    settings: {}
                };
            });
        }

        document.dispatchEvent(new CustomEvent('content-scope-init-args', {
            detail: {
                debug: true,
                platform: {
                    name: 'extension',
                },
                site: {
                    domain: location.hostname,
                    isBroken: false,
                    allowlisted: false,
                    enabledFeatures: finalFeatures,
                },
                featureSettings: finalConfig.features || {},
                bundledConfig: finalConfig,
            }
        }));

        console.log('Content script: Dispatched config event', {
            enabledFeatures: finalFeatures,
            config: finalConfig
        });
    }
}

injectContentScript(chrome.runtime.getURL('/contentScope.js'));

// Load configuration after a short delay to ensure contentScope.js is loaded
setTimeout(loadConfiguration, 100);
