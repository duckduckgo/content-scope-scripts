/**
 * Uses Anthropic Claude as an LLM judge to classify a PR diff into semver
 * severity: major (breaking), minor (new features/non-trivial changes), or
 * patch (bug fixes, docs, refactors with no API surface change).
 *
 * Expects env vars:
 *   ANTHROPIC_API_KEY - Anthropic API key
 *   PR_DIFF          - The full diff text
 *   PR_TITLE         - Pull request title
 *   PR_BODY          - Pull request body/description
 *   PR_FILES         - Newline-separated list of changed file paths
 *
 * Outputs to stdout a JSON object: { "severity": "major"|"minor"|"patch", "reasoning": "..." }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_DIFF_CHARS = 80_000;

const SYSTEM_PROMPT = `You are a semver classification expert for the duckduckgo/content-scope-scripts repository.

This is an npm workspace monorepo that ships privacy features and special pages to DuckDuckGo's native apps (macOS, Windows, iOS, Android). Downstream consumers integrate via npm, Swift Package Manager, and git submodules.

## Public API surfaces (changes here are semver-sensitive):

1. **messaging/ package** (@duckduckgo/messaging) — Messaging, MessagingContext, MessagingTransport, platform configs (Webkit/Windows/Android), schema types, createTypedMessages, and subpath exports (lib/shared-types, lib/test-utils.mjs, lib/webkit.js, etc.)
2. **Build artifact paths** — build/<platform>/contentScope.js, Sources/ContentScopeScripts/dist/*.js, dist/pages/<name>/ — native apps reference these exact paths
3. **Feature config contracts** — LoadArgs shape, feature init/load signatures in content-scope-features.js
4. **Generated types from JSON schemas** — message types consumed by special-pages and injected features
5. **Entry points** — injected/entry-points/*.js files and their export shapes

## Classification rules:

**MAJOR** (breaking change) — assign when ANY of these apply:
- Removed or renamed exports from messaging/
- Changed method signatures, constructor parameters, or return types in public messaging classes
- Removed or renamed build artifact files that native apps reference
- Removed, renamed, or changed the shape of LoadArgs or feature init/load contracts
- Removed or renamed JSON schema message types
- Deleted or moved entry point files
- Any change that would cause a downstream consumer's existing code to fail without modification

**MINOR** (new feature / non-breaking enhancement) — assign when ANY of these apply:
- Added new exports, classes, methods, or features without removing existing ones
- Added new build artifacts, special pages, or entry points
- Added new optional parameters or config fields
- New privacy features or significant feature enhancements
- Non-trivial behavioral changes that don't break existing contracts
- New platform support or messaging transport

**PATCH** (bug fix / internal) — assign when ALL of these apply:
- No public API surface changes
- Bug fixes, performance improvements, internal refactors
- Documentation, test, or CI/tooling changes only
- Dependency updates that don't change public API
- Config/settings changes that don't alter contracts
- CSS/style-only changes in special pages
- Comment or logging changes

Always respond with valid JSON: { "severity": "major"|"minor"|"patch", "reasoning": "..." }
The reasoning should be 2-3 concise sentences explaining the classification.`;

function truncateDiff(diff) {
    if (diff.length <= MAX_DIFF_CHARS) return diff;
    return diff.slice(0, MAX_DIFF_CHARS) + '\n\n... [diff truncated at 80k chars] ...';
}

function buildUserPrompt({ diff, title, body, files }) {
    return `Classify this PR's semver impact.

## PR Title
${title}

## PR Description
${body || '(no description)'}

## Changed Files
${files || '(not available)'}

## Diff
\`\`\`diff
${truncateDiff(diff)}
\`\`\`

Respond with JSON only: { "severity": "major"|"minor"|"patch", "reasoning": "..." }`;
}

async function callAnthropic(systemPrompt, userPrompt, apiKey) {
    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 512,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) {
        throw new Error('Empty response from Anthropic API');
    }
    return content;
}

function parseResponse(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error(`Could not extract JSON from LLM response: ${text}`);
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const severity = parsed.severity?.toLowerCase();
    if (!['major', 'minor', 'patch'].includes(severity)) {
        throw new Error(`Invalid severity "${parsed.severity}" in LLM response`);
    }
    return { severity, reasoning: parsed.reasoning || '' };
}

async function main() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('ANTHROPIC_API_KEY is required');
        process.exit(1);
    }

    const diff = process.env.PR_DIFF || '';
    const title = process.env.PR_TITLE || '';
    const body = process.env.PR_BODY || '';
    const files = process.env.PR_FILES || '';

    if (!diff) {
        console.error('PR_DIFF is required');
        process.exit(1);
    }

    const userPrompt = buildUserPrompt({ diff, title, body, files });
    const rawResponse = await callAnthropic(SYSTEM_PROMPT, userPrompt, apiKey);
    const result = parseResponse(rawResponse);

    console.log(JSON.stringify(result));
}

main();
