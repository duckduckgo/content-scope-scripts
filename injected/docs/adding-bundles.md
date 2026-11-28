# Adding a New Bundle

Bundles are how platforms integrate content-scope-scripts, they're often used within a context and so serve a distinct purpose. There is a cost to serving multiple bundles within the web page context so that should be avoided.

To add a new bundle to the Content Scope Scripts build system:

## 1. Define Build Configuration

**File**: `injected/scripts/entry-points.js`

Add your bundle to the `builds` object:

```js
'my-new-bundle': {
    input: 'entry-points/my-entry.js',
    output: ['../build/my-platform/myScript.js'],
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

## 3. Configure Platform Features (Optional)

**File**: `injected/src/features.js`

If creating a platform-specific bundle, add feature configuration:

```js
'my-platform': [
    'cookie',
    ...baseFeatures,
    'mySpecificFeature',
],
```

## Optional: 4. Create Entry Point

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

## Blank-frame builds

Some sites add hundreds of empty frames, and every frame pays the memory cost of each bundle that runs in it. A
blank-frame target builds a bundle that does nothing in frames whose URL protocol is `about:`:

```js
'apple-isolated-ios': {
    input: 'entry-points/apple.js',
    output: ['../Sources/ContentScopeScripts/dist/contentScopeIsolated.ios.js'],
    injectName: 'apple-isolated',
    blankFrameOptimized: true,
},
```

- The bundle is wrapped in a function that the activation check only calls outside `about:` frames. Until then it
  allocates nothing, and native's placeholders inside it are never evaluated.
- `injectName` gives it the same features and remote config as the `apple-isolated` bundle. iOS selects it with a
  feature flag.
- Only the isolated-world bundle has a blank-frame target: page-world protections must keep running in blank frames.

`scripts/utils/blank-frame-activation.js` wraps the bundle, and `unit-test/blank-frame-activation.spec.js` shows its
exact shape.
