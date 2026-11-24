# Adding a New Bundle

Bundles are how platforms integrate content-scope-scripts, they're often used within a context and so serve a distinct purpose. There is a cost to serving multiple bundles within the web page context so that should be avoided.

To add a new bundle to the Content Scope Scripts build system:

## 1. Define Build Configuration

**File**: `injected/scripts/bundles.js`

Add your bundle to the `builds` object, with its entry point, output files and features. Features load and init in
the order listed, and each bundle only contains (and only knows about) its own list:

```js
'my-new-bundle': {
    input: 'entry-points/my-entry.js',
    output: ['../build/my-platform/myScript.js'],
    features: ['cookie', ...baseFeatures, 'mySpecificFeature'],
},
```

## 2. Update TypeScript Types

**File**: `injected/src/globals.d.ts`

Add the bundle name to the `injectName` union type:

```ts
injectName?:
    | 'firefox'
    | 'apple'
    | 'my-new-bundle'  // Add here
```

## Optional: 3. Create Entry Point

**Directory**: `injected/entry-points/`

Create your entry point file (e.g., `my-entry.js`) that imports and configures the required features for your bundle.

**Entry points** are the main files that define the implementation of a build. These should only be added if absolutely required.

## Remote configuration

Inject Name is a condition that can then be used in the config.

**Example**: Target specific bundles in feature configuration:

```json
{
    "features": {
        "myFeature": {
            "state": "enabled",
            "settings": {
                "something": "hello",
                "conditionalChanges": [
                    {
                        "condition": {
                            "injectName": "android-adsjs"
                        },
                        "patchSettings": [
                            {
                                "op": "replace",
                                "path": "/something",
                                "value": "else"
                            }
                        ]
                    }
                ]
            }
        }
    }
}
```

This allows the same feature to have different behavior depending on which bundle it's running in.
