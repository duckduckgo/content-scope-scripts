# Bugbot Review Guidance

Patterns to watch for during automated and manual review.

## Early returns that silently change behavior

When adding null/undefined guards for type safety, prefer preserving the original runtime behavior over silently skipping logic. A guard that `return`s early can hide bugs or regress functionality.

**Bad** -- silently drops the thumbnail:
```js
if (!videoId) return;
const imageUrl = getLargeThumbnailSrc(videoId);
```

**Better** -- preserves original behavior, satisfies types:
```js
const imageUrl = getLargeThumbnailSrc(videoId ?? '');
```

**Best** -- handles the missing value explicitly:
```js
if (!videoId) {
    log.warn('Missing videoId for thumbnail');
    return;
}
```

## Error stringification

Use a consistent pattern for catch-block error messages. Prefer `String(e)` over `e.toString()` (they differ for `null`/`undefined`). Always handle the non-`Error` case since third-party code and browser APIs can throw anything:

```js
} catch (e) {
    const message = e instanceof Error ? e.message : String(e);
}
```
