# API manipulation

`apiManipulation` changes page-visible DOM APIs from remote config. Prefer a named `serviceAreas` entry when one exists; use raw `apiChanges` only for one-off API fixes.

## Service areas

Service areas are reviewed bundles for common high-risk API mitigations.

```json
{
    "serviceAreas": {
        "mediaDevicesDeviceChangeEvents": "enabled"
    }
}
```

`mediaDevicesDeviceChangeEvents` suppresses JavaScript-side `MediaDevices` `devicechange` subscriptions without touching `EventTarget.prototype`.

## Raw descriptor targets

Raw descriptor changes default to the safest target:

| `target`          | Behavior                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| omitted / `"own"` | Only modify an own descriptor on the target object. Inherited or missing properties are skipped.                                 |
| `"existing"`      | Modify an own descriptor, or shadow-define a compatible inherited descriptor as an own property. Missing properties are skipped. |
| `"missing"`       | Define a new own property only when the key is absent from the target and its prototype chain.                                   |

`define: true` is a deprecated compatibility alias for `target: "missing"`; new config should use `target`.

## Descriptor shapes

Use exactly one shape per descriptor change:

- Accessor shape: `getterValue` and/or `setterValue`.
- Value shape: `value`.

Do not mix `value` with `getterValue` or `setterValue`.

Function-valued getters, setters, and values are masked so `toString()`, `toString.toString()`, `name`, and `length` resemble DOM APIs instead of exposing the configured replacement.
