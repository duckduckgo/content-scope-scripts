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
 * @param {number[]} samples
 * @returns {{ median: number, p95: number }}
 */
export function summarise(samples) {
    return { median: percentile(samples, 0.5), p95: percentile(samples, 0.95) };
}

/**
 * Milliseconds at a precision that stays readable across the five orders of
 * magnitude these benchmarks span.
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
 * @typedef {object} FixtureReport
 * @property {string} fixture
 * @property {string} [engine] - Browser the fixture was measured in
 * @property {{ elements: number, textNodes: number, chars: number }} facts
 * @property {Array<{
 *   name: string,
 *   baseline: boolean,
 *   median: number,
 *   p95: number,
 *   correct: boolean,
 *   expected: Record<string, boolean>,
 *   actual: Record<string, boolean | 'error'>
 * }>} variants
 */

/**
 * @param {FixtureReport} report
 * @returns {string}
 */
export function formatFixture(report) {
    const { facts } = report;
    const lines = [
        '',
        `### ${report.fixture}`,
        `  ${facts.elements.toLocaleString()} elements, ${facts.textNodes.toLocaleString()} text nodes, ${facts.chars.toLocaleString()} chars`,
        '',
    ];

    const baseline = report.variants.find((v) => v.baseline);
    const rows = [['variant', 'median', 'p95', 'vs baseline', 'result']];

    for (const variant of report.variants) {
        let relative = '-';
        if (baseline && variant !== baseline && baseline.median > 0) {
            const ratio = baseline.median / variant.median;
            relative = ratio >= 1 ? `${ratio.toFixed(1)}x faster` : `${(1 / ratio).toFixed(1)}x slower`;
        }
        rows.push([
            variant.name + (variant.baseline ? ' (baseline)' : ''),
            formatMs(variant.median),
            formatMs(variant.p95),
            relative,
            variant.correct ? 'ok' : 'CORRECTNESS FAIL',
        ]);
    }

    lines.push(table(rows));

    for (const variant of report.variants) {
        if (variant.correct) continue;
        for (const key of Object.keys(variant.expected)) {
            const expected = variant.expected[key];
            const actual = variant.actual[key];
            if (expected === actual) continue;
            lines.push(`  ! ${variant.name}: detector ${key} expected ${expected}, got ${actual}`);
        }
    }

    return lines.join('\n');
}

/**
 * @param {FixtureReport[]} reports
 * @returns {string}
 */
export function formatSummary(reports) {
    /** @type {string[]} */
    const failures = [];
    for (const report of reports) {
        for (const variant of report.variants) {
            if (!variant.correct) failures.push(`${report.engine ? `${report.engine} / ` : ''}${report.fixture} / ${variant.name}`);
        }
    }

    if (failures.length === 0) {
        return '\nAll variants produced the expected detection results.';
    }

    return [
        '',
        `${failures.length} correctness failure(s) - these variants changed detection behaviour:`,
        ...failures.map((f) => `  - ${f}`),
        '',
        'A faster variant that changes results is a regression, not a win. Timings above are reported for',
        'context only; do not compare them until the results match.',
    ].join('\n');
}
