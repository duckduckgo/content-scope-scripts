/**
 * Formatting. The two axes get different tables, because they are answering different
 * questions and a single shared table served neither well.
 *
 * An algorithm comparison asks "which implementation is faster, and did any of them
 * change behaviour". Behaviour change is pass/fail there, so the table carries a result
 * column and nothing more.
 *
 * A config comparison asks "what does this configuration cost, and what does it trade
 * away". Behaviour change is the finding rather than a failure, so the table carries a
 * delta against the reference config - the shape of the trade-off, not a verdict on it.
 */

/**
 * @param {number[]} values
 * @param {number} quantile
 * @returns {number}
 */
function percentile(values, quantile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(quantile * sorted.length) - 1));
    return sorted[index] ?? 0;
}

/**
 * Median rather than mean, because GC pauses drag a mean around. p95 is reported
 * alongside so the size of that tail is visible instead of hidden.
 *
 * @param {number[]} samples
 * @returns {{ median: number, p95: number }}
 */
export function summarise(samples) {
    return { median: percentile(samples, 0.5), p95: percentile(samples, 0.95) };
}

/**
 * Milliseconds at a precision that stays readable across the five orders of magnitude
 * these benchmarks span.
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatMs(ms) {
    if (ms >= 100) return `${ms.toFixed(1)} ms`;
    if (ms >= 1) return `${ms.toFixed(2)} ms`;
    if (ms >= 0.01) return `${ms.toFixed(3)} ms`;
    return `${ms.toFixed(5)} ms`;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    const sign = bytes < 0 ? '-' : '';
    const abs = Math.abs(bytes);
    if (abs >= 1024 * 1024) return `${sign}${(abs / (1024 * 1024)).toFixed(1)} MB`;
    if (abs >= 1024) return `${sign}${(abs / 1024).toFixed(0)} KB`;
    return `${sign}${abs} B`;
}

/**
 * @param {number} count
 * @returns {string}
 */
function formatChars(count) {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
    return String(count);
}

/**
 * @param {string[][]} rows - First row is the header
 * @param {string} indent
 * @returns {string}
 */
function table(rows, indent = '  ') {
    const widths = (rows[0] ?? []).map((_, column) => Math.max(...rows.map((row) => (row[column] ?? '').length)));
    const render = (row) => indent + row.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join('  ');
    const [header, ...body] = rows;
    if (!header) return '';
    return [render(header), indent + widths.map((w) => '-'.repeat(w)).join('  '), ...body.map(render)].join('\n');
}

/**
 * @typedef {object} ReferenceDelta
 * @property {string[]} introducedFP
 * @property {string[]} introducedFN
 * @property {string[]} fixedFP
 * @property {string[]} fixedFN
 */

/**
 * @typedef {object} VariantReport
 * @property {string} name
 * @property {boolean} baseline
 * @property {boolean} [reference]
 * @property {boolean} [expectDivergence]
 * @property {number} median
 * @property {number} p95
 * @property {number | null} [peakChars]
 * @property {number | null} [heapBytes]
 * @property {Record<string, boolean>} expected
 * @property {Record<string, boolean | 'error'>} actual
 * @property {string[]} falsePositives
 * @property {string[]} falseNegatives
 * @property {boolean} correct
 * @property {boolean} unexpected
 * @property {ReferenceDelta | null} [vsReference]
 */

/**
 * @typedef {object} FixtureReport
 * @property {string} fixture
 * @property {string} [engine]
 * @property {{ group: string, param: string, value: number } | null} [scale]
 * @property {{ elements: number, textNodes: number, chars: number }} facts
 * @property {VariantReport[]} variants
 */

/**
 * @param {VariantReport} variant
 * @param {VariantReport | undefined} baseline
 * @returns {string}
 */
function relativeSpeed(variant, baseline) {
    if (!baseline || variant === baseline || baseline.median <= 0 || variant.median <= 0) return '-';
    const ratio = baseline.median / variant.median;
    return ratio >= 1 ? `${ratio.toFixed(1)}x faster` : `${(1 / ratio).toFixed(1)}x slower`;
}

/**
 * Render the behaviour delta against the reference config.
 *
 * @param {VariantReport} variant
 * @returns {string}
 */
function referenceDelta(variant) {
    if (variant.reference) return '-';
    const delta = variant.vsReference;
    if (!delta) return '-';
    const parts = [];
    if (delta.introducedFP.length) parts.push(`+${delta.introducedFP.length} FP`);
    if (delta.introducedFN.length) parts.push(`+${delta.introducedFN.length} FN`);
    if (delta.fixedFP.length) parts.push(`-${delta.fixedFP.length} FP`);
    if (delta.fixedFN.length) parts.push(`-${delta.fixedFN.length} FN`);
    return parts.length === 0 ? 'same behaviour' : parts.join(', ');
}

/**
 * @param {FixtureReport} report
 * @param {'algorithm' | 'config'} axis
 * @param {{ timed?: boolean }} [options]
 * @returns {string}
 */
export function formatFixture(report, axis, { timed = true } = {}) {
    const { facts } = report;
    const lines = [
        '',
        `### ${report.fixture}`,
        `  ${facts.elements.toLocaleString()} elements, ${facts.textNodes.toLocaleString()} text nodes, ${facts.chars.toLocaleString()} chars`,
        '',
    ];

    const baseline = report.variants.find((v) => v.baseline);
    const showPeak = report.variants.some((v) => v.peakChars != null);
    const showHeap = report.variants.some((v) => v.heapBytes != null);

    // Under --check-only there are no timings, and columns of zeroes would read as a
    // result rather than an absence of one.
    const header = ['variant'];
    if (timed) header.push('median', 'p95');
    if (showPeak) header.push('peak buffer');
    if (showHeap) header.push('heap');
    if (timed) header.push('vs baseline');
    header.push(axis === 'config' ? 'vs reference' : 'result');

    const rows = [header];

    for (const variant of report.variants) {
        let label = variant.name;
        if (variant.baseline) label += ' (baseline)';
        if (variant.reference) label += variant.baseline ? ' (ref)' : ' (reference)';

        const row = [label];
        if (timed) row.push(formatMs(variant.median), formatMs(variant.p95));
        if (showPeak) row.push(variant.peakChars == null ? '-' : `${formatChars(variant.peakChars)} chars`);
        if (showHeap) row.push(variant.heapBytes == null ? '-' : formatBytes(variant.heapBytes));
        if (timed) row.push(relativeSpeed(variant, baseline));

        if (axis === 'config') {
            row.push(referenceDelta(variant));
        } else {
            row.push(variant.correct ? 'ok' : 'CORRECTNESS FAIL');
        }
        rows.push(row);
    }

    lines.push(table(rows));

    // Spell out every divergence from ground truth, whichever axis. The table says a
    // config trades one false negative; this says which case, which is what decides
    // whether the trade is acceptable.
    for (const variant of report.variants) {
        for (const key of variant.falsePositives) {
            lines.push(`  ! ${variant.name}: ${key} matched, but this fixture has no match (false positive)`);
        }
        for (const key of variant.falseNegatives) {
            lines.push(`  ! ${variant.name}: ${key} did not match, but this fixture does (false negative)`);
        }
        for (const key of Object.keys(variant.actual)) {
            if (variant.actual[key] === 'error') lines.push(`  ! ${variant.name}: ${key} threw`);
        }
    }

    return lines.join('\n');
}

/**
 * Scaling section: the same measurement at several sizes, normalised so the growth is
 * readable rather than inferred.
 *
 * Cost per character is the useful normalisation for text scanning. A flat column means
 * linear growth; a rising one means worse than linear. No interpretation beyond that is
 * offered here on purpose - the numbers are the output, and reasoning about why belongs
 * with whoever is reading them.
 *
 * @param {FixtureReport[]} reports
 * @returns {string}
 */
export function formatScaling(reports) {
    const scaled = reports.filter((r) => r.scale);
    if (scaled.length === 0) return '';

    /** @type {Map<string, FixtureReport[]>} */
    const groups = new Map();
    for (const report of scaled) {
        const key = `${report.engine ?? ''}::${report.scale?.group}::${report.scale?.param}`;
        const existing = groups.get(key);
        if (existing) existing.push(report);
        else groups.set(key, [report]);
    }

    const lines = ['', '='.repeat(60), '== scaling', '='.repeat(60)];

    for (const [key, groupReports] of groups) {
        const [engine, group, param] = key.split('::');
        const sorted = [...groupReports].sort((a, b) => (a.scale?.value ?? 0) - (b.scale?.value ?? 0));
        lines.push('', `### ${group} by ${param}${engine ? ` (${engine})` : ''}`, '');
        lines.push(`  sizes: ${sorted.map((r) => `${param}=${r.scale?.value} (${formatChars(r.facts.chars)} chars)`).join(', ')}`, '');

        // Variants as rows rather than columns: the variant list is the dimension that
        // grows, and a table six variants wide is unreadable at three columns each.
        const variantNames = sorted[0]?.variants.map((v) => v.name) ?? [];
        const rows = [['variant', ...sorted.flatMap((r) => [`${param}=${r.scale?.value}`, 'ns/char'])]];

        for (const name of variantNames) {
            const row = [name];
            for (const report of sorted) {
                const variant = report.variants.find((v) => v.name === name);
                if (!variant) {
                    row.push('-', '-');
                    continue;
                }
                const nsPerChar = report.facts.chars > 0 ? (variant.median * 1e6) / report.facts.chars : 0;
                row.push(formatMs(variant.median), nsPerChar.toFixed(1));
            }
            rows.push(row);
        }

        lines.push(table(rows));
    }

    lines.push('', '  A flat ns/char column means cost grows linearly with text; a rising one means worse.');

    return lines.join('\n');
}

/**
 * @param {FixtureReport[]} reports
 * @param {'algorithm' | 'config'} axis
 * @returns {string}
 */
export function formatSummary(reports, axis) {
    /** @type {string[]} */
    const unexpected = [];
    /** @type {string[]} */
    const accepted = [];

    for (const report of reports) {
        const where = `${report.engine ? `${report.engine} / ` : ''}${report.fixture}`;
        for (const variant of report.variants) {
            if (variant.correct) continue;
            const detail = [...variant.falsePositives.map((k) => `+FP ${k}`), ...variant.falseNegatives.map((k) => `+FN ${k}`)].join(', ');
            const line = `${where} / ${variant.name}: ${detail}`;
            if (variant.unexpected) unexpected.push(line);
            else accepted.push(line);
        }
    }

    const lines = [''];

    if (accepted.length > 0) {
        lines.push(
            `${accepted.length} expected divergence(s), declared via expectDivergence:`,
            ...accepted.map((f) => `  - ${f}`),
            '',
            'These are the trade-offs the spec is measuring. Weigh each against the speedup above',
            'rather than reading it as a pass.',
            '',
        );
    }

    if (unexpected.length === 0) {
        lines.push(accepted.length > 0 ? 'No undeclared behaviour changes.' : 'All variants produced the expected detection results.');
        return lines.join('\n');
    }

    lines.push(`${unexpected.length} UNEXPECTED behaviour change(s):`, ...unexpected.map((f) => `  - ${f}`), '');

    if (axis === 'algorithm') {
        lines.push(
            'A faster implementation that changes results is a regression, not a win. The timings above',
            'are reported for context only; do not compare them until the results match.',
        );
    } else {
        lines.push(
            'A config that changes behaviour may still be the right answer, but it has to be a decision',
            'rather than a surprise. Declare it with `expectDivergence: true` once weighed, or fix it.',
        );
    }

    return lines.join('\n');
}

/**
 * Compare against a stored run, so a shipped configuration need not be re-measured from
 * scratch to know whether something moved.
 *
 * Only medians are compared, and only beyond a threshold: run-to-run variation of a few
 * percent is expected on a machine doing anything else at the same time, so a tighter
 * threshold would report noise as change.
 *
 * @param {FixtureReport[]} reports
 * @param {{ reports: FixtureReport[] }} stored
 * @param {number} thresholdPercent
 * @returns {string}
 */
export function compareToStored(reports, stored, thresholdPercent) {
    /** @type {Map<string, number>} */
    const previous = new Map();
    for (const report of stored.reports ?? []) {
        for (const variant of report.variants) {
            previous.set(`${report.engine ?? ''}::${report.fixture}::${variant.name}`, variant.median);
        }
    }

    /** @type {string[]} */
    const changes = [];
    let compared = 0;

    for (const report of reports) {
        for (const variant of report.variants) {
            const key = `${report.engine ?? ''}::${report.fixture}::${variant.name}`;
            const before = previous.get(key);
            if (before === undefined || before <= 0) continue;
            compared++;
            const change = ((variant.median - before) / before) * 100;
            if (Math.abs(change) < thresholdPercent) continue;
            const direction = change > 0 ? 'slower' : 'faster';
            changes.push(
                `${report.engine ? `${report.engine} / ` : ''}${report.fixture} / ${variant.name}: ` +
                    `${formatMs(before)} -> ${formatMs(variant.median)} (${Math.abs(change).toFixed(0)}% ${direction})`,
            );
        }
    }

    const lines = ['', '='.repeat(60), `== vs stored baseline (${compared} compared, threshold ${thresholdPercent}%)`, '='.repeat(60), ''];

    if (compared === 0) {
        lines.push('  Nothing in common with the stored run - check it was produced by the same spec.');
    } else if (changes.length === 0) {
        lines.push(`  No median moved by more than ${thresholdPercent}%.`);
    } else {
        lines.push(...changes.map((c) => `  - ${c}`));
    }

    return lines.join('\n');
}
