/**
 * Claude-API pull request reviewer.
 *
 * Replaces the Cursor Bugbot / Cursor Automation checks the repo used to
 * depend on. Instead of waiting for a third-party GitHub App to publish a
 * check run and then grading its prose, we send the diff to Claude directly
 * and get a structured review back.
 *
 * Raw HTTP rather than @anthropic-ai/sdk on purpose: the workflows that call
 * this sparse-checkout `.github/scripts` and run `node` with no install step,
 * so there is no node_modules to import an SDK from.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { resolveReviewModel } from './anthropic-config.mjs';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
export const FINDING_SEVERITIES = ['info', 'warning', 'error', 'critical'];
export const FINDING_STATUSES = ['confirmed', 'uncertain'];
export const REVIEW_PROFILES = ['dependency', 'general'];

export const MAX_TOTAL_DIFF_CHARS = 60000;
export const MAX_PATCH_CHARS = 8000;
export const MAX_FILES_LISTED = 200;
export const REVIEW_COMMENT_MARKER = '<!-- CLAUDE_REVIEW -->';

/**
 * Paths whose diffs are generated, vendored or lockfile noise. We keep the
 * file header (so the reviewer still sees that the file changed, and by how
 * much) but drop the hunks, which would otherwise swamp the context window on
 * a routine Dependabot bump.
 */
const OMITTED_PATCH_PATTERNS = [
    /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/,
    /^build\//,
    /^Sources\//,
    /^docs\//,
    /(?:^|\/)types\//,
    /\.snap$/,
];

/** @param {string} path */
export function shouldOmitPatch(path) {
    return OMITTED_PATCH_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * @param {string} value
 * @param {number} limit
 */
export function truncate(value, limit) {
    const text = value ?? '';
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}\n… [truncated ${text.length - limit} characters]`;
}

/**
 * Splits a unified diff into one entry per file.
 *
 * @param {string} diff
 * @returns {{ path: string, patch: string }[]}
 */
export function splitDiffByFile(diff) {
    const text = diff ?? '';
    if (!text.trim()) return [];

    const entries = [];
    const lines = text.split('\n');
    /** @type {{ path: string, lines: string[] } | null} */
    let current = null;

    for (const line of lines) {
        const header = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
        if (header) {
            if (current) entries.push({ path: current.path, patch: current.lines.join('\n') });
            current = { path: header[2], lines: [line] };
            continue;
        }
        if (current) current.lines.push(line);
    }
    if (current) entries.push({ path: current.path, patch: current.lines.join('\n') });

    return entries;
}

/**
 * Builds the diff the model actually sees: real patches for source files,
 * a one-line placeholder for generated/lockfile paths, and a hard overall cap.
 *
 * @param {{ diff: string, maxTotalChars?: number, maxPatchChars?: number }} options
 */
export function buildDiffDigest({ diff, maxTotalChars = MAX_TOTAL_DIFF_CHARS, maxPatchChars = MAX_PATCH_CHARS }) {
    const entries = splitDiffByFile(diff);
    const rendered = entries.map((entry) => {
        if (shouldOmitPatch(entry.path)) {
            const changed = entry.patch.split('\n').filter((line) => /^[+-][^+-]/.test(line)).length;
            return `diff --git a/${entry.path} b/${entry.path}\n[patch omitted: generated or lockfile content, ${changed} changed line(s)]`;
        }
        return truncate(entry.patch, maxPatchChars);
    });
    return truncate(rendered.join('\n'), maxTotalChars);
}

/**
 * @param {{ filename: string, status?: string, additions?: number, deletions?: number }[]} files
 */
export function summariseFiles(files) {
    const listed = (files ?? []).slice(0, MAX_FILES_LISTED).map((file) => ({
        path: file.filename,
        status: file.status ?? 'modified',
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
    }));
    const omitted = Math.max(0, (files ?? []).length - listed.length);
    return { files: listed, omittedFileCount: omitted };
}

export const SUBMIT_REVIEW_TOOL_NAME = 'submit_review';
export const SUBMIT_REVIEW_TOOL = {
    name: SUBMIT_REVIEW_TOOL_NAME,
    description:
        'Submit the structured review for this pull request. ' +
        'Call this tool exactly once with your final review. Do not include any other text or reasoning in your response.',
    input_schema: {
        type: 'object',
        properties: {
            risk_level: {
                type: 'string',
                enum: RISK_LEVELS,
                description: 'Overall risk of merging this pull request. Only "low" is eligible for automated approval.',
            },
            summary: {
                type: 'string',
                description: 'Two to four sentences describing what the pull request changes and the review outcome.',
            },
            findings: {
                type: 'array',
                description: 'Specific issues found. Empty when the change is clean.',
                items: {
                    type: 'object',
                    properties: {
                        severity: { type: 'string', enum: FINDING_SEVERITIES },
                        status: {
                            type: 'string',
                            enum: FINDING_STATUSES,
                            description:
                                'confirmed when the diff proves the problem; uncertain when it rests on an assumption that still needs validating.',
                        },
                        file: { type: 'string', description: 'Repository-relative path, or an empty string if not file-specific.' },
                        description: {
                            type: 'string',
                            description:
                                'The problem, referencing the relevant review pattern. State the concrete fix where one is needed, and for an uncertain finding the assumption and what would validate it.',
                        },
                    },
                    required: ['severity', 'status', 'file', 'description'],
                    additionalProperties: false,
                },
            },
            sections: {
                type: 'array',
                description: 'Short prose assessments, one entry per heading the system prompt asks for.',
                items: {
                    type: 'object',
                    properties: {
                        heading: { type: 'string', description: 'Section heading requested by the system prompt.' },
                        body: { type: 'string', description: 'Two to four sentences.' },
                    },
                    required: ['heading', 'body'],
                    additionalProperties: false,
                },
            },
            blocking: {
                type: 'boolean',
                description: 'True when a human must act before this pull request can merge.',
            },
            confidence: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Confidence in this review.',
            },
        },
        required: ['risk_level', 'summary', 'findings', 'sections', 'blocking', 'confidence'],
        additionalProperties: false,
    },
};

/*
 * System prompts live as markdown next to this file so they can be edited
 * without touching code. They carry over the retired Cursor automations:
 *   dependency -> "Cursor Automation: Review dependabot"
 *   general    -> "Cursor Automation: Web compat and sec" (plus the
 *                 correctness review Bugbot used to provide)
 */
/** @type {Map<string, string>} */
const promptCache = new Map();

/** @param {string} profile */
export function systemPromptFor(profile) {
    if (!REVIEW_PROFILES.includes(profile)) {
        throw new Error(`Unknown review profile '${profile}'; expected one of ${REVIEW_PROFILES.join(', ')}`);
    }
    const cached = promptCache.get(profile);
    if (cached) return cached;
    const prompt = readFileSync(new URL(`./review-prompts/${profile}.md`, import.meta.url), 'utf8').trim();
    promptCache.set(profile, prompt);
    return prompt;
}

/**
 * @typedef {Object} ReviewFinding
 * @property {string} severity
 * @property {string} status
 * @property {string} file
 * @property {string} description
 */

/**
 * @typedef {Object} ReviewSection
 * @property {string} heading
 * @property {string} body
 */

/**
 * @typedef {Object} Review
 * @property {string} risk_level
 * @property {string} summary
 * @property {ReviewFinding[]} findings
 * @property {ReviewSection[]} sections
 * @property {boolean} blocking
 * @property {string} confidence
 */

/**
 * @param {unknown} response
 * @returns {Review}
 */
export function extractReviewFromAnthropicResponse(response) {
    const content = Array.isArray(/** @type {any} */ (response)?.content) ? /** @type {any} */ (response).content : [];
    const blocks = content.filter((block) => block?.type === 'tool_use' && block?.name === SUBMIT_REVIEW_TOOL_NAME);
    if (blocks.length !== 1) {
        throw new Error(`Expected exactly one ${SUBMIT_REVIEW_TOOL_NAME} tool call, received ${blocks.length}`);
    }
    const input = blocks[0].input;
    if (!input || typeof input !== 'object') {
        throw new Error(`${SUBMIT_REVIEW_TOOL_NAME} tool call had no input object`);
    }

    const { risk_level: riskLevel, summary, findings, blocking, confidence } = /** @type {any} */ (input);
    if (!RISK_LEVELS.includes(riskLevel)) {
        throw new Error(`Review risk_level must be one of ${RISK_LEVELS.join(', ')}; received ${JSON.stringify(riskLevel)}`);
    }
    if (typeof summary !== 'string' || summary.trim().length === 0) {
        throw new Error('Review summary must be a non-empty string');
    }
    if (typeof blocking !== 'boolean') {
        throw new Error('Review blocking must be a boolean');
    }
    if (!['high', 'medium', 'low'].includes(confidence)) {
        throw new Error(`Review confidence must be high, medium or low; received ${JSON.stringify(confidence)}`);
    }
    if (!Array.isArray(findings)) {
        throw new Error('Review findings must be an array');
    }
    const normalisedFindings = findings.map((finding, index) => {
        if (!finding || typeof finding !== 'object') {
            throw new Error(`Review finding ${index} is not an object`);
        }
        const { severity, status, file, description } = /** @type {any} */ (finding);
        if (!FINDING_SEVERITIES.includes(severity)) {
            throw new Error(`Review finding ${index} severity must be one of ${FINDING_SEVERITIES.join(', ')}`);
        }
        if (!FINDING_STATUSES.includes(status)) {
            throw new Error(`Review finding ${index} status must be one of ${FINDING_STATUSES.join(', ')}`);
        }
        if (typeof description !== 'string' || description.trim().length === 0) {
            throw new Error(`Review finding ${index} description must be a non-empty string`);
        }
        return { severity, status, file: typeof file === 'string' ? file : '', description };
    });

    const sections = Array.isArray(/** @type {any} */ (input).sections) ? /** @type {any} */ (input).sections : [];
    const normalisedSections = sections
        .filter((section) => section && typeof section === 'object')
        .map((section) => ({ heading: String(section.heading ?? ''), body: String(section.body ?? '') }))
        .filter((section) => section.heading && section.body);

    return { risk_level: riskLevel, summary, findings: normalisedFindings, sections: normalisedSections, blocking, confidence };
}

/** @param {Pick<Review, 'risk_level' | 'blocking'>} review */
export function isLowRisk(review) {
    return review.risk_level === 'low' && review.blocking === false;
}

/**
 * @param {Review} review
 * @param {{ model: string, headSha: string }} context
 */
export function formatReviewComment(review, { model, headSha }) {
    const level = review.risk_level.charAt(0).toUpperCase() + review.risk_level.slice(1);
    const lines = [REVIEW_COMMENT_MARKER, '## Claude review', '', `**${level} Risk**`, '', review.summary, ''];

    if (review.findings.length === 0) {
        lines.push('No findings.', '');
    } else {
        lines.push('| Severity | Status | File | Finding |', '| --- | --- | --- | --- |');
        for (const finding of review.findings) {
            const file = finding.file ? `\`${finding.file}\`` : '—';
            const description = finding.description.replace(/\|/g, '\\|');
            lines.push(`| ${finding.severity} | ${finding.status} | ${file} | ${description} |`);
        }
        lines.push('');
    }

    for (const section of review.sections ?? []) {
        lines.push(`### ${section.heading}`, '', section.body, '');
    }

    if (review.blocking) {
        lines.push('This review is **blocking**: a human should act on the findings above before merging.', '');
    }

    lines.push(`<sub>Reviewed by \`${model}\` for commit ${headSha}. Confidence: ${review.confidence}.</sub>`);
    return lines.join('\n');
}

/**
 * @param {{ apiKey: string, model: string, profile: string, pullRequest: object, diffDigest: string, fileSummary: object, fetchImpl?: typeof fetch }} options
 */
export async function requestReview({ apiKey, model, profile, pullRequest, diffDigest, fileSummary, fetchImpl = fetch }) {
    const payload = { pullRequest, ...fileSummary, diff: diffDigest };
    const body = JSON.stringify({
        model,
        max_tokens: 16000,
        system: systemPromptFor(profile),
        tools: [SUBMIT_REVIEW_TOOL],
        tool_choice: { type: 'tool', name: SUBMIT_REVIEW_TOOL_NAME, disable_parallel_tool_use: true },
        messages: [
            {
                role: 'user',
                content: `Review this pull request:\n\n${JSON.stringify(payload, null, 2)}`,
            },
        ],
    });

    const response = await fetchImpl(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'anthropic-version': ANTHROPIC_VERSION,
            'x-api-key': apiKey,
        },
        body,
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Anthropic request failed with ${response.status}: ${text.slice(0, 500)}`);
    }
    return extractReviewFromAnthropicResponse(JSON.parse(text));
}

export const MAX_OPEN_PRS_LISTED = 50;

/**
 * Open pull requests, most recently updated first, as lightweight context.
 *
 * @param {{ apiRoot: string, headers: Record<string, string>, fetchImpl?: typeof fetch, exclude?: number }} options
 */
export async function listOpenPullRequests({ apiRoot, headers, fetchImpl = fetch, exclude }) {
    const url = `${apiRoot}/pulls?state=open&sort=updated&direction=desc&per_page=${MAX_OPEN_PRS_LISTED}`;
    const response = await fetchImpl(url, { headers: { ...headers, accept: 'application/vnd.github+json' } });
    if (!response.ok) {
        // Context only — a failure here must not fail the review.
        console.warn(`Could not list open pull requests (${response.status}); reviewing without that context.`);
        return [];
    }
    const pulls = await response.json();
    return (Array.isArray(pulls) ? pulls : [])
        .filter((pull) => pull.number !== exclude)
        .map((pull) => ({ number: pull.number, title: pull.title, author: pull.user?.login, draft: Boolean(pull.draft) }));
}

/**
 * Full review of one pull request: fetch the diff and file list from GitHub,
 * then ask Claude for a structured verdict.
 *
 * @param {{ apiKey?: string, model?: string, profile?: string, apiRoot: string, prNumber: string|number, githubToken: string, fetchImpl?: typeof fetch }} options
 */
export async function reviewPullRequest({ apiKey, model, profile = 'dependency', apiRoot, prNumber, githubToken, fetchImpl = fetch }) {
    const resolvedKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!resolvedKey) throw new Error('ANTHROPIC_API_KEY is required to review a pull request');
    const resolvedModel = model ?? resolveReviewModel();

    const githubHeaders = {
        authorization: `Bearer ${githubToken}`,
        'user-agent': 'duckduckgo-content-scope-scripts-claude-review',
        'x-github-api-version': '2022-11-28',
    };

    const pullResponse = await fetchImpl(`${apiRoot}/pulls/${prNumber}`, {
        headers: { ...githubHeaders, accept: 'application/vnd.github+json' },
    });
    if (!pullResponse.ok) {
        throw new Error(`Failed to fetch pull request ${prNumber}: ${pullResponse.status}`);
    }
    const pull = await pullResponse.json();

    const diffResponse = await fetchImpl(`${apiRoot}/pulls/${prNumber}`, {
        headers: { ...githubHeaders, accept: 'application/vnd.github.v3.diff' },
    });
    if (!diffResponse.ok) {
        throw new Error(`Failed to fetch diff for pull request ${prNumber}: ${diffResponse.status}`);
    }
    const diff = await diffResponse.text();

    const filesResponse = await fetchImpl(`${apiRoot}/pulls/${prNumber}/files?per_page=100`, {
        headers: { ...githubHeaders, accept: 'application/vnd.github+json' },
    });
    if (!filesResponse.ok) {
        throw new Error(`Failed to fetch changed files for pull request ${prNumber}: ${filesResponse.status}`);
    }
    const files = await filesResponse.json();

    // The dependency prompt is told to name an existing fix PR rather than
    // propose a duplicate, so it needs to know what is already open.
    const openPullRequests =
        profile === 'dependency' ? await listOpenPullRequests({ apiRoot, headers: githubHeaders, fetchImpl, exclude: pull.number }) : [];

    const review = await requestReview({
        apiKey: resolvedKey,
        model: resolvedModel,
        profile,
        pullRequest: {
            number: pull.number,
            title: pull.title,
            author: pull.user?.login,
            headSha: pull.head?.sha,
            baseRef: pull.base?.ref,
        },
        diffDigest: buildDiffDigest({ diff }),
        fileSummary: { ...summariseFiles(files), openPullRequests },
        fetchImpl,
    });

    return { review, pull, model: resolvedModel };
}

/* -------------------------------------------------------------------------
 * GitHub comment plumbing
 *
 * The reviewer owns posting its own review, so exactly one module knows the
 * comment marker and the replace-in-place behaviour.
 * ---------------------------------------------------------------------- */

/** @param {string | null} header */
export function parseLinkHeader(header) {
    if (!header) return null;
    for (const part of header.split(',')) {
        const match = part.match(/<([^>]+)>;\s*rel="next"/);
        if (match) return match[1];
    }
    return null;
}

/**
 * @param {{ url: string, token: string, method?: string, body?: string, accept?: string, fetchImpl?: typeof fetch }} options
 */
async function githubRequest({ url, token, method = 'GET', body, accept = 'application/vnd.github+json', fetchImpl = fetch }) {
    /** @type {Record<string, string>} */
    const headers = {
        accept,
        authorization: `Bearer ${token}`,
        'user-agent': 'duckduckgo-content-scope-scripts-claude-review',
        'x-github-api-version': '2022-11-28',
    };
    if (body) headers['content-type'] = 'application/json';

    const response = await fetchImpl(url, { method, headers, body });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`GitHub request failed (${response.status}) for ${url}: ${text.slice(0, 500)}`);
    }
    return {
        data: text ? JSON.parse(text) : null,
        next: parseLinkHeader(response.headers?.get?.('link') ?? null),
    };
}

/**
 * @param {{ apiRoot: string, prNumber: string|number, token: string, fetchImpl?: typeof fetch }} options
 */
export async function listIssueComments({ apiRoot, prNumber, token, fetchImpl = fetch }) {
    const comments = [];
    /** @type {string | null} */
    let url = `${apiRoot}/issues/${prNumber}/comments?per_page=100`;
    while (url) {
        const { data, next } = await githubRequest({ url, token, fetchImpl });
        comments.push(...(data ?? []));
        url = next;
    }
    return comments;
}

/**
 * Posts the review to the PR, replacing the previous one rather than
 * appending a new comment on every push.
 *
 * @param {{ apiRoot: string, prNumber: string|number, token: string, body: string, fetchImpl?: typeof fetch }} options
 */
export async function upsertReviewComment({ apiRoot, prNumber, token, body, fetchImpl = fetch }) {
    const comments = await listIssueComments({ apiRoot, prNumber, token, fetchImpl });
    const existing = comments.find((comment) => (comment.body ?? '').includes(REVIEW_COMMENT_MARKER));
    if (existing) {
        await githubRequest({
            url: `${apiRoot}/issues/comments/${existing.id}`,
            token,
            method: 'PATCH',
            body: JSON.stringify({ body }),
            fetchImpl,
        });
        return { updated: true, id: existing.id };
    }
    const { data } = await githubRequest({
        url: `${apiRoot}/issues/${prNumber}/comments`,
        token,
        method: 'POST',
        body: JSON.stringify({ body }),
        fetchImpl,
    });
    return { updated: false, id: data?.id ?? null };
}

/* -------------------------------------------------------------------------
 * CLI entry point
 *
 * Used by `.github/workflows/claude-review.yml`. The Dependabot gate imports
 * the functions above directly instead of shelling out.
 * ---------------------------------------------------------------------- */

function requiredEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
}

function setOutput(name, value) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (!outputPath) return;
    const delimiter = `gh-output-${name}-${Date.now()}`;
    appendFileSync(outputPath, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

export async function main(argv = process.argv.slice(2)) {
    const profileFlag = argv.indexOf('--profile');
    const profile = profileFlag === -1 ? 'general' : argv[profileFlag + 1];

    const githubToken = requiredEnv('GITHUB_TOKEN');
    const apiKey = requiredEnv('ANTHROPIC_API_KEY');
    const [owner, repo] = requiredEnv('GITHUB_REPOSITORY').split('/');
    const prNumber = requiredEnv('PR_NUMBER');
    const apiRoot = `https://api.github.com/repos/${owner}/${repo}`;

    const { review, pull, model } = await reviewPullRequest({
        apiKey,
        profile,
        apiRoot,
        prNumber,
        githubToken,
    });

    const headSha = pull.head?.sha ?? '';
    await upsertReviewComment({
        apiRoot,
        prNumber,
        token: githubToken,
        body: formatReviewComment(review, { model, headSha }),
    });

    console.log(
        `Claude review (${profile}): risk_level=${review.risk_level}; blocking=${review.blocking}; confidence=${review.confidence}; findings=${review.findings.length}`,
    );
    setOutput('risk_level', review.risk_level);
    setOutput('blocking', String(review.blocking));
    setOutput('is_low_risk', String(isLowRisk(review)));
    setOutput('reviewed_head_sha', headSha);
    setOutput('review_complete', 'true');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await main();
}
