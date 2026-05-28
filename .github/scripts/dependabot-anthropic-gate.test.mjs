import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    EXPECTED_CHECKS,
    cursorAgentId,
    detailsHost,
    matchExpectedCheck,
    latestCheckRunsByName,
    latestOtherCheckRunsByName,
    checkRunState,
    commitStatusState,
    missingExpectedCheckNames,
    pendingExpectedCheckRuns,
    isTrustedAutomationActor,
    sourceFromReview,
    sourceFromComment,
    sourceFromInlineReviewComment,
    sourceMatchesCheckRun,
    matchedCursorSources,
    evidenceForRun,
    candidateJsonObjects,
    parseAnthropicDecision,
    truncate,
    parseLinkHeader,
} from './dependabot-anthropic-gate.mjs';

const HEAD_SHA = '7e81412129d2f622b42725e95b026b4feca54761';

function cursorBugbotRun(extras = {}) {
    return {
        id: 100,
        name: 'Cursor Bugbot',
        status: 'completed',
        conclusion: 'success',
        head_sha: HEAD_SHA,
        details_url: 'https://cursor.com/docs/bugbot',
        html_url: 'https://github.com/x/y/runs/100',
        app: { slug: 'cursor' },
        output: { title: 'Bugbot', summary: '', text: '' },
        ...extras,
    };
}

function cursorAutomationRun(name, agentId, extras = {}) {
    return {
        id: 200,
        name,
        status: 'completed',
        conclusion: 'success',
        head_sha: HEAD_SHA,
        details_url: `https://cursor.com/agents/${agentId}`,
        html_url: 'https://github.com/x/y/runs/200',
        app: { slug: 'cursor' },
        output: { title: name, summary: '', text: '' },
        ...extras,
    };
}

function trustedComment(body, extras = {}) {
    return {
        user: { login: 'cursor[bot]', type: 'Bot' },
        body,
        created_at: '2026-05-28T00:00:00Z',
        ...extras,
    };
}

describe('cursorAgentId', () => {
    it('extracts the id from a Cursor agent URL', () => {
        assert.equal(cursorAgentId('https://cursor.com/agents/bc-abc-123'), 'bc-abc-123');
    });

    it('returns null for Bugbot-style URLs without an id segment', () => {
        assert.equal(cursorAgentId('https://cursor.com/docs/bugbot'), null);
    });

    it('returns null for missing input', () => {
        assert.equal(cursorAgentId(undefined), null);
        assert.equal(cursorAgentId(null), null);
        assert.equal(cursorAgentId(''), null);
    });
});

describe('detailsHost', () => {
    it('extracts the host from a valid URL', () => {
        assert.equal(detailsHost('https://cursor.com/agents/bc-1'), 'cursor.com');
    });

    it('returns null for missing or invalid URLs', () => {
        assert.equal(detailsHost(null), null);
        assert.equal(detailsHost(''), null);
        assert.equal(detailsHost('not a url'), null);
    });
});

describe('matchExpectedCheck', () => {
    it('matches when name, app slug, and details host all line up', () => {
        const run = cursorBugbotRun();
        const matched = matchExpectedCheck(run);
        assert.ok(matched);
        assert.equal(matched.name, 'Cursor Bugbot');
    });

    it('rejects spoofed check runs from a different app slug', () => {
        const run = cursorBugbotRun({ app: { slug: 'evil-app' } });
        assert.equal(matchExpectedCheck(run), null);
    });

    it('rejects check runs whose details_url host is not cursor.com', () => {
        const run = cursorBugbotRun({ details_url: 'https://evil.example.com/bugbot' });
        assert.equal(matchExpectedCheck(run), null);
    });

    it('rejects check runs whose display name is not in EXPECTED_CHECKS', () => {
        const run = cursorBugbotRun({ name: 'Some Other Check' });
        assert.equal(matchExpectedCheck(run), null);
    });

    it('only ever returns entries that are present in EXPECTED_CHECKS', () => {
        const run = cursorBugbotRun();
        const matched = matchExpectedCheck(run);
        assert.ok(EXPECTED_CHECKS.includes(matched));
    });
});

describe('latestCheckRunsByName', () => {
    it('returns only trusted Cursor check runs and picks the most recent per name', () => {
        const older = cursorBugbotRun({ id: 1, created_at: '2026-05-01T00:00:00Z' });
        const newer = cursorBugbotRun({ id: 2, created_at: '2026-05-02T00:00:00Z' });
        const spoofed = cursorBugbotRun({ id: 3, app: { slug: 'spoof' } });
        const automation = cursorAutomationRun('Cursor Automation: Review dependabot', 'bc-xyz');
        const result = latestCheckRunsByName([older, newer, spoofed, automation]);
        const bugbot = result.find((r) => r.name === 'Cursor Bugbot');
        assert.equal(bugbot.id, 2);
        assert.ok(result.find((r) => r.name === 'Cursor Automation: Review dependabot'));
        assert.ok(!result.some((r) => r.id === 3));
    });
});

describe('latestOtherCheckRunsByName / checkRunState', () => {
    function externalRun(name, status, conclusion = null) {
        return {
            id: 900 + Math.floor(Math.random() * 100),
            name,
            status,
            conclusion,
            head_sha: HEAD_SHA,
        };
    }

    it('excludes check runs whose id is in currentRunCheckIds', () => {
        const own = externalRun('dependabot', 'in_progress');
        own.id = 42;
        const other = externalRun('lint', 'completed', 'success');
        const result = latestOtherCheckRunsByName([own, other], new Set([42]));
        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'lint');
    });

    it('classifies pending vs failed correctly', () => {
        const ok = externalRun('lint', 'completed', 'success');
        const skipped = externalRun('typecheck', 'completed', 'skipped');
        const failed = externalRun('test', 'completed', 'failure');
        const queued = externalRun('build', 'queued');
        const { pending, failed: f } = checkRunState([ok, skipped, failed, queued], new Set());
        assert.equal(pending.length, 1);
        assert.equal(pending[0].name, 'build');
        assert.equal(f.length, 1);
        assert.equal(f[0].name, 'test');
    });
});

describe('commitStatusState', () => {
    it('separates pending statuses from failures and successes', () => {
        const statuses = [
            { context: 'ci/a', state: 'success' },
            { context: 'ci/b', state: 'pending' },
            { context: 'ci/c', state: 'failure' },
            { context: 'ci/d', state: 'error' },
        ];
        const { pending, failed } = commitStatusState(statuses);
        assert.deepEqual(
            pending.map((s) => s.context),
            ['ci/b'],
        );
        assert.deepEqual(failed.map((s) => s.context).sort(), ['ci/c', 'ci/d']);
    });
});

describe('missingExpectedCheckNames / pendingExpectedCheckRuns', () => {
    it('reports expected checks that have not yet appeared and those still in flight', () => {
        const present = cursorBugbotRun();
        const inFlight = cursorAutomationRun('Cursor Automation: Review dependabot', 'bc-1', {
            status: 'in_progress',
            conclusion: null,
        });
        const missing = missingExpectedCheckNames([present, inFlight]);
        assert.deepEqual(missing, ['Cursor Automation: Web compat and sec']);
        const pending = pendingExpectedCheckRuns([present, inFlight]);
        assert.deepEqual(
            pending.map((r) => r.name),
            ['Cursor Automation: Review dependabot'],
        );
    });
});

describe('isTrustedAutomationActor', () => {
    it('accepts cursor[bot] Bot accounts only', () => {
        assert.equal(isTrustedAutomationActor({ login: 'cursor[bot]', type: 'Bot' }), true);
    });

    it('rejects humans and other bots', () => {
        assert.equal(isTrustedAutomationActor({ login: 'someone', type: 'User' }), false);
        assert.equal(isTrustedAutomationActor({ login: 'cursor[bot]', type: 'User' }), false);
        assert.equal(isTrustedAutomationActor({ login: 'evil[bot]', type: 'Bot' }), false);
        assert.equal(isTrustedAutomationActor(null), false);
        assert.equal(isTrustedAutomationActor(undefined), false);
    });
});

describe('source builders gate on isTrustedAutomationActor', () => {
    it('returns null for untrusted authors', () => {
        const untrusted = { user: { login: 'attacker', type: 'User' }, body: 'whatever', created_at: 't' };
        assert.equal(sourceFromReview(untrusted), null);
        assert.equal(sourceFromComment(untrusted), null);
        assert.equal(sourceFromInlineReviewComment(untrusted), null);
    });

    it('emits the expected shape for trusted reviews and comments', () => {
        const review = { user: { login: 'cursor[bot]', type: 'Bot' }, body: 'rev', submitted_at: 's' };
        assert.deepEqual(sourceFromReview(review), {
            type: 'review',
            author: 'cursor[bot]',
            submittedAt: 's',
            body: 'rev',
        });
        const comment = trustedComment('com');
        assert.deepEqual(sourceFromComment(comment), {
            type: 'comment',
            author: 'cursor[bot]',
            submittedAt: '2026-05-28T00:00:00Z',
            body: 'com',
        });
    });

    it('captures path/line/in_reply_to_id on inline review comments', () => {
        const inline = trustedComment('inline', { path: 'a/b.js', line: 42, in_reply_to_id: 7 });
        const src = sourceFromInlineReviewComment(inline);
        assert.equal(src.type, 'inline_review_comment');
        assert.equal(src.path, 'a/b.js');
        assert.equal(src.line, 42);
        assert.equal(src.inReplyToId, 7);
    });
});

describe('sourceMatchesCheckRun', () => {
    it('matches Cursor Automation runs by the agent id in details_url', () => {
        const run = cursorAutomationRun('Cursor Automation: Review dependabot', 'bc-abc-123');
        assert.equal(sourceMatchesCheckRun({ body: 'see https://cursor.com/agents/bc-abc-123 ...' }, run), true);
    });

    it('does not match Cursor Automation runs when the body does not mention the agent id', () => {
        const run = cursorAutomationRun('Cursor Automation: Review dependabot', 'bc-abc-123');
        assert.equal(sourceMatchesCheckRun({ body: 'unrelated text mentioning ' + HEAD_SHA }, run), false);
    });

    it('matches Cursor Bugbot inline findings by head_sha when details_url has no agent id', () => {
        const run = cursorBugbotRun();
        const body = `<!-- BUGBOT_BUG_ID: abc --> Reviewed by Cursor Bugbot for commit ${HEAD_SHA}.`;
        assert.equal(sourceMatchesCheckRun({ body }, run), true);
    });

    it('does not match Cursor Bugbot comments referencing a different head_sha', () => {
        const run = cursorBugbotRun();
        const body = 'Reviewed by Cursor Bugbot for commit deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
        assert.equal(sourceMatchesCheckRun({ body }, run), false);
    });

    it('does not fall back to head_sha matching for non-Bugbot Cursor runs', () => {
        const run = cursorAutomationRun('Cursor Automation: Web compat and sec', 'bc-only-by-id');
        const body = `mentions ${HEAD_SHA} but no agent id`;
        assert.equal(sourceMatchesCheckRun({ body }, run), false);
    });
});

describe('matchedCursorSources', () => {
    it('only surfaces sources matching the specific check run', () => {
        const bugbotRun = cursorBugbotRun();
        const sources = [
            {
                type: 'inline_review_comment',
                author: 'cursor[bot]',
                submittedAt: 't',
                body: `Reviewed by Cursor Bugbot for commit ${HEAD_SHA}`,
            },
            { type: 'comment', author: 'cursor[bot]', submittedAt: 't', body: 'unrelated' },
        ];
        const matched = matchedCursorSources(bugbotRun, sources);
        assert.equal(matched.length, 1);
        assert.equal(matched[0].type, 'inline_review_comment');
    });

    it('returns [] for a non-Bugbot run whose agent id is missing from every body', () => {
        const run = cursorAutomationRun('Cursor Automation: Web compat and sec', 'bc-zzz');
        const sources = [{ type: 'comment', author: 'cursor[bot]', submittedAt: 't', body: 'nothing useful here' }];
        assert.deepEqual(matchedCursorSources(run, sources), []);
    });
});

describe('evidenceForRun', () => {
    it('truncates long output text', () => {
        const run = cursorBugbotRun({ output: { title: 't', summary: 's', text: 'x'.repeat(20000) } });
        const evidence = evidenceForRun(run, []);
        assert.ok(evidence.output.text.length < 20000);
        assert.ok(evidence.output.text.includes('[truncated'));
    });
});

describe('candidateJsonObjects', () => {
    it('skips preambles with their own braces', () => {
        const text = 'Based on {evidence}, here is the JSON: {"safe_to_merge":true,"reason":"ok"}';
        const got = [...candidateJsonObjects(text)];
        assert.deepEqual(got, ['{evidence}', '{"safe_to_merge":true,"reason":"ok"}']);
    });

    it('handles braces inside JSON string literals', () => {
        const text = '{"safe_to_merge":false,"reason":"has } and { in string","confidence":"high"}';
        const got = [...candidateJsonObjects(text)];
        assert.equal(got.length, 1);
        assert.equal(got[0], text);
    });

    it('handles escape sequences inside strings', () => {
        const text = 'prefix {"escape":"a\\"b"} done';
        const got = [...candidateJsonObjects(text)];
        assert.equal(got[0], '{"escape":"a\\"b"}');
    });

    it('returns nothing when the text has no balanced object', () => {
        assert.deepEqual([...candidateJsonObjects('no json here')], []);
        assert.deepEqual([...candidateJsonObjects('')], []);
        assert.deepEqual([...candidateJsonObjects(null)], []);
    });
});

describe('parseAnthropicDecision', () => {
    it('picks the first parseable object with the expected shape', () => {
        const text = 'Based on {evidence}, here is the JSON: {"safe_to_merge":true,"reason":"ok","confidence":"high"}';
        const d = parseAnthropicDecision(text);
        assert.equal(d.safe_to_merge, true);
        assert.equal(d.reason, 'ok');
    });

    it('skips objects that parse but lack the required fields', () => {
        const text = '{"foo":1} prefix {"safe_to_merge":false,"reason":"why"}';
        const d = parseAnthropicDecision(text);
        assert.equal(d.safe_to_merge, false);
        assert.equal(d.reason, 'why');
    });

    it('throws when no candidate object exists', () => {
        assert.throws(() => parseAnthropicDecision('no json here'), /did not contain JSON/);
    });

    it('throws when no candidate has the required shape', () => {
        assert.throws(() => parseAnthropicDecision('{"foo":1} {"bar":2}'), /did not contain a usable decision object/);
    });
});

describe('truncate', () => {
    it('returns the input unchanged when shorter than the limit', () => {
        assert.equal(truncate('short'), 'short');
    });

    it('truncates and annotates when longer than the limit', () => {
        const t = truncate('x'.repeat(20), 5);
        assert.ok(t.startsWith('xxxxx'));
        assert.ok(t.includes('[truncated 15 characters]'));
    });

    it('returns the empty string for falsy input', () => {
        assert.equal(truncate(null), '');
        assert.equal(truncate(''), '');
    });
});

describe('parseLinkHeader', () => {
    it('extracts the next-page URL from a GitHub Link header', () => {
        const header = '<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=3>; rel="last"';
        assert.equal(parseLinkHeader(header), 'https://api.github.com/x?page=2');
    });

    it('returns null when there is no next page', () => {
        assert.equal(parseLinkHeader(null), null);
        assert.equal(parseLinkHeader(''), null);
        assert.equal(parseLinkHeader('<https://api.github.com/x?page=1>; rel="prev"'), null);
    });
});
