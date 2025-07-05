# isTopLevel Condition

The `isTopLevel` condition allows you to apply different settings based on whether the current frame is the top-level frame or not.

## Usage

The `isTopLevel` condition can be used in `conditionalChanges` to apply different settings for top-level frames vs. frames (iframes).

### Basic Usage

```json
{
  "condition": {
    "isTopLevel": true
  },
  "patchSettings": [
    {
      "op": "replace",
      "path": "/setting",
      "value": "top-level-value"
    }
  ]
}
```

### Examples

#### Different Settings for Top-Level vs Frames

```json
{
  "features": {
    "fingerprintingCanvas": {
      "state": "enabled",
      "settings": {
        "bloop": 12,
        "conditionalChanges": [
          {
            "condition": {
              "isTopLevel": true
            },
            "patchSettings": [
              {
                "op": "replace",
                "path": "/bloop",
                "value": 121
              }
            ]
          },
          {
            "condition": {
              "isTopLevel": false
            },
            "patchSettings": [
              {
                "op": "replace",
                "path": "/bloop",
                "value": 0
              }
            ]
          }
        ]
      }
    }
  }
}
```

#### Combined with Other Conditions

```json
{
  "condition": {
    "isTopLevel": true,
    "domain": "example.com"
  },
  "patchSettings": [
    {
      "op": "add",
      "path": "/rules/-",
      "value": "top-level-specific-rule"
    }
  ]
}
```

#### OR Logic with Condition Arrays

```json
{
  "condition": [
    {
      "isTopLevel": false
    },
    {
      "domain": "ads.example.com"
    }
  ],
  "patchSettings": [
    {
      "op": "add",
      "path": "/rules/-",
      "value": "frame-or-ads-rule"
    }
  ]
}
```

## Implementation Details

- **Detection Method**: Uses `window.self !== window.top` and `location.ancestorOrigins` to determine if the frame is top-level
- **Boolean Value**: Expects a boolean value (`true` or `false`)
- **Backwards Compatibility**: Follows the same pattern as other conditions for consistency
- **Logical Operators**: Supports both AND (object) and OR (array) logic with other conditions

## Use Cases

1. **Privacy Features**: Apply stricter privacy protections in frames
2. **Performance**: Different settings for top-level vs. embedded content
3. **Compatibility**: Handle frame-specific web compatibility issues
4. **Security**: Different security policies for frames vs. top-level pages

## Technical Notes

- The condition is evaluated at runtime based on the current frame context
- Works with the existing conditional changes infrastructure
- No performance impact as it uses simple frame detection
- Compatible with all existing condition types (domain, urlPattern, experiment, etc.)

## documentContext Condition (New)

The `documentContext` condition allows you to match only top-level documents or only subframes (frames/iframes) in conditionalChanges. This is more explicit and flexible than `isTopLevel` and supports future extensibility.

### Schema

```json
{
  "condition": {
    "documentContext": { "top": true }
  }
}
```
- `{ "top": true }`: Matches only top-level documents
- `{ "frame": true }`: Matches only subframes/iframes
- `{}` or omitted: Matches all contexts (backward compatible)
- `{ "top": false }` or `{ "frame": false }`: Never matches
- `{ "top": true, "frame": true }`: **Invalid** (will not match)

### Usage Examples

#### Top-level only
```json
{
  "condition": { "documentContext": { "top": true } },
  "patchSettings": [ { "op": "replace", "path": "/val", "value": "top" } ]
}
```
#### Subframe only
```json
{
  "condition": { "documentContext": { "frame": true } },
  "patchSettings": [ { "op": "replace", "path": "/val", "value": "frame" } ]
}
```
#### Both (invalid)
```json
{
  "condition": { "documentContext": { "top": true, "frame": true } },
  "patchSettings": [ { "op": "replace", "path": "/val", "value": "invalid" } ]
}
```
#### Empty object (matches all)
```json
{
  "condition": { "documentContext": {} },
  "patchSettings": [ { "op": "replace", "path": "/val", "value": "empty" } ]
}
```
#### False values (never matches)
```json
{
  "condition": { "documentContext": { "top": false } },
  "patchSettings": [ { "op": "replace", "path": "/val", "value": "shouldNotMatch" } ]
}
```

### Detection Logic
- Top-level: `window.top === window`
- Subframe: `window.top !== window`

### Migration
- Prefer `documentContext` for new rules. `isTopLevel` remains supported for backward compatibility. 