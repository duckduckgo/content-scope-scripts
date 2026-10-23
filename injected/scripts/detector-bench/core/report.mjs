/**
 * Formatting. The two axes get different tables, because they are answering different
 * questions and a single shared table served neither well.
 *
 * An algorithm comparison asks "which implementation is faster, and did any of them
 * change behaviour". Behaviour change is pass/fail there, so the table carries a result
 * column - plus a delta against the baseline implementation, because "wrong" and "wrong
 * in a way this variant introduced" are different findings and only the second is a
 * regression.
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
export function formatBytes(bytes) {
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
export function formatChars(count) {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
    return String(count);
}

/**
 * @param {string[][]} rows - First row is the header
 * @param {string} indent
 * @returns {string}
 */
export function table(rows, indent = '  ') {
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
 * @property {'warm' | 'dirty'} [layout]
 * @property {number | null} [peakChars]
 * @property {number | null} [heapBytes]
 * @property {Record<string, boolean>} expected
 * @property {Record<string, boolean | 'error'>} actual
 * @property {string[]} falsePositives
 * @property {string[]} falseNegatives
 * @property {boolean} correct
 * @property {boolean} unexpected
 * @property {boolean} [preExisting] - Incorrect, but the comparison point is incorrect the same way
 * @property {ReferenceDelta | null} [vsReference]
 * @property {import('./expand.mjs').CostRole} [cost] - Cost axis only: what this variant stands for
 */

/**
 * @typedef {object} FixtureReport
 * @property {string} fixture
 * @property {string} [engine]
 * @property {'timing' | 'correctness' | 'both'} [purpose]
 * @property {{ group: string, param: string, value: number } | null} [scale]
 * @property {string} [category] - Site fixtures: the capture list's category. Generated fixtures have none
 * @property {{ elements: number, textNodes: number, chars: number, renderedChars?: number, scriptChars?: number }} facts
 * @property {{ clean: number, dirty: number, ratio: number } | null} [layoutCheck]
 * @property {VariantReport[]} variants
 */

/**
 * @param {VariantReport} variant
 * @param {VariantReport | undefined} baseline
 * @returns {string}
 */
export function relativeSpeed(variant, baseline) {
    if (!baseline || variant === baseline || baseline.median <= 0 || variant.median <= 0) return '-';
    const ratio = baseline.median / variant.median;
    return ratio >= 1 ? `${ratio.toFixed(1)}x faster` : `${(1 / ratio).toFixed(1)}x slower`;
}

/**
 * Render the behaviour delta against the comparison point - the reference config on the
 * config axis, the baseline implementation on the algorithm axis.
 *
 * @param {VariantReport} variant
 * @param {'algorithm' | 'config'} axis
 * @returns {string}
 */
function referenceDelta(variant, axis) {
    if (axis === 'config' ? variant.reference : variant.baseline) return '-';
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
 * The result column on the algorithm axis.
 *
 * `PRE-EXISTING` rather than `CORRECTNESS FAIL` when the baseline gets the same fixture
 * wrong: the variant found a gap, it did not create one, and conflating the two is how a
 * spec that discovers a shipped bug reads as though the experiment caused it.
 *
 * @param {VariantReport} variant
 * @returns {string}
 */
function algorithmResult(variant) {
    if (variant.correct) return 'ok';
    return variant.preExisting ? 'PRE-EXISTING' : 'CORRECTNESS FAIL';
}

/**
 * @param {FixtureReport} report
 * @param {'algorithm' | 'config'} axis
 * @param {{ timed?: boolean }} [options]
 * @returns {string}
 */
export function formatFixture(report, axis, { timed = true } = {}) {
    const { facts } = report;
    // `rendered` is the materialised size of the page's text: what a strategy that reads
    // the whole rendered text must hold at once, and therefore what a bounded buffer is
    // bounded against. It belongs in the shape line because the memory columns cannot
    // supply it - see the caveat on `readMemory` in run.mjs.
    const shape =
        `  ${facts.elements.toLocaleString()} elements, ${facts.textNodes.toLocaleString()} text nodes, ` +
        `${facts.chars.toLocaleString()} chars` +
        (facts.renderedChars == null ? '' : `, ${formatChars(facts.renderedChars)} rendered`);

    const lines = ['', `### ${report.fixture}`, shape];
    if (report.layoutCheck) {
        // A cached read costs microseconds and a full reflow costs seconds, so the ratio runs
        // to six figures on a large fixture. Past a point the exact value says nothing the two
        // timings do not; what matters is that it is comfortably clear of the threshold.
        const { ratio, clean, dirty } = report.layoutCheck;
        const shown = !Number.isFinite(ratio) ? 'unbounded' : ratio >= 1000 ? '>1000x' : `${ratio.toFixed(1)}x`;
        lines.push(`  layout invalidation: ${shown} (forced read ${formatMs(clean)} clean, ${formatMs(dirty)} dirty)`);
    }
    lines.push('');

    const baseline = report.variants.find((v) => v.baseline);
    const showPeak = report.variants.some((v) => v.peakChars != null);
    const showHeap = report.variants.some((v) => v.heapBytes != null);

    // Under --check-only there are no timings, and columns of zeroes would read as a
    // result rather than an absence of one.
    const header = ['variant'];
    if (timed) header.push('median', 'p95');
    if (showPeak) header.push('peak buffer');
    if (showHeap) header.push('retained');
    if (timed) header.push('vs baseline');
    // `behaviour` rather than `vs baseline`: the timing column already carries that name, and
    // a table with `vs baseline` twice meaning two different things is worse than a short header.
    header.push(axis === 'config' ? 'vs reference' : 'behaviour', ...(axis === 'config' ? [] : ['result']));

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

        row.push(referenceDelta(variant, axis));
        if (axis === 'algorithm') row.push(algorithmResult(variant));
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
 * Score every variant against the fixture labels, as one number per variant.
 *
 * The per-fixture tables say what each variant did on each case; nothing said how a
 * variant did *overall*. That is the missing half of "compare these approaches": a
 * comparison needs cost and accuracy side by side, and reading accuracy off twenty
 * fixture tables by hand is exactly the step that gets skipped.
 *
 * Fixtures marked `purpose: 'timing'` are excluded. Their only label is "no match
 * anywhere" on a large generated page, which every variant satisfies trivially, so
 * counting them would pad the denominator with free marks and drag every variant's score
 * towards 100%. Excluding them also makes the figure identical under `--check-only`,
 * which skips those fixtures entirely.
 *
 * Accuracy is against the fixture labels alone. It deliberately says nothing about
 * whether a divergence was introduced or inherited - `formatSummary` owns that
 * distinction, and it is the one that drives the exit code.
 *
 * @param {FixtureReport[]} reports
 * @returns {string}
 */
export function formatAccuracy(reports) {
    const scored = reports.filter((report) => report.purpose !== 'timing');
    if (scored.length === 0) return '';

    /** @type {Map<string, { engine?: string, name: string, cases: number, correct: number, fp: number, fn: number }>} */
    const totals = new Map();

    for (const report of scored) {
        for (const variant of report.variants) {
            // Engines are separate processes measuring separate pages, so a variant's score
            // is per engine. Merging them would average over two different answers.
            const key = `${report.engine ?? ''}\u0000${variant.name}`;
            let row = totals.get(key);
            if (!row) {
                row = { engine: report.engine, name: variant.name, cases: 0, correct: 0, fp: 0, fn: 0 };
                totals.set(key, row);
            }
            const cases = Object.keys(variant.expected).length;
            row.cases += cases;
            row.fp += variant.falsePositives.length;
            row.fn += variant.falseNegatives.length;
            row.correct += cases - variant.falsePositives.length - variant.falseNegatives.length;
        }
    }

    const rows = [...totals.values()];
    if (rows.length === 0) return '';

    const anyEngine = rows.some((row) => row.engine);
    const header = [...(anyEngine ? ['engine'] : []), 'variant', 'accuracy', 'correct', 'false pos', 'false neg'];
    const body = rows.map((row) => [
        ...(anyEngine ? [row.engine ?? ''] : []),
        row.name,
        row.cases > 0 ? `${((row.correct / row.cases) * 100).toFixed(0)}%` : '-',
        `${row.correct}/${row.cases}`,
        String(row.fp),
        String(row.fn),
    ]);

    return [
        '',
        '='.repeat(60),
        '== Detection accuracy',
        '='.repeat(60),
        '',
        table([header, ...body]),
        '',
        `  Scored over ${scored.length} labelled fixture(s); \`purpose: 'timing'\` fixtures are excluded.`,
        '  A faster variant with a lower score is not a win. See the behaviour summary below for',
        '  whether a divergence was introduced or inherited.',
    ].join('\n');
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
    /** @type {string[]} */
    const preExisting = [];
    /** @type {string[]} */
    const fixes = [];

    for (const report of reports) {
        const where = `${report.engine ? `${report.engine} / ` : ''}${report.fixture}`;

        for (const variant of report.variants) {
            const delta = variant.vsReference;
            const fixed = delta ? [...delta.fixedFP.map((k) => `-FP ${k}`), ...delta.fixedFN.map((k) => `-FN ${k}`)] : [];
            if (fixed.length > 0) fixes.push(`${where} / ${variant.name}: ${fixed.join(', ')}`);

            if (variant.correct) continue;
            const detail = [...variant.falsePositives.map((k) => `+FP ${k}`), ...variant.falseNegatives.map((k) => `+FN ${k}`)].join(', ');
            const line = `${where} / ${variant.name}: ${detail}`;
            if (variant.unexpected) unexpected.push(line);
            else if (variant.preExisting) preExisting.push(line);
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

    // Reported before the failures, because if the baseline is wrong about a case then
    // "which variant is fastest" is the less interesting thing on the page.
    if (preExisting.length > 0) {
        lines.push(
            `${preExisting.length} pre-existing failure(s) - the ${axis === 'algorithm' ? 'baseline implementation' : 'reference config'} is wrong here too:`,
            ...preExisting.map((f) => `  - ${f}`),
            '',
            'Not attributable to any variant in this run. These are gaps in the code under study,',
            'which is worth knowing separately from whether an experiment regressed anything.',
            '',
        );
    }

    if (fixes.length > 0) {
        lines.push(
            `${fixes.length} case(s) a variant gets right where the ${axis === 'algorithm' ? 'baseline' : 'reference'} does not:`,
            ...fixes.map((f) => `  - ${f}`),
            '',
        );
    }

    if (unexpected.length === 0) {
        const clean = accepted.length > 0 || preExisting.length > 0 || fixes.length > 0;
        lines.push(clean ? 'No behaviour changes introduced by any variant.' : 'All variants produced the expected detection results.');
        return lines.join('\n');
    }

    lines.push(`${unexpected.length} UNEXPECTED behaviour change(s):`, ...unexpected.map((f) => `  - ${f}`), '');

    if (axis === 'algorithm') {
        lines.push(
            'Each of these is a case the baseline implementation gets right and this variant does not,',
            'so it is a regression the variant introduced rather than a gap it inherited. A faster',
            'implementation that changes results is not a win: fix the divergence, then compare timings.',
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

/**
 * Cost-axis budgets. Reported, never enforced: they say where to look, not what to ship.
 *
 * - `tickP95Ms`: one frame at 60Hz. A tick over it can drop a frame on its own.
 * - `throttledTickP95Ms`: the long-task threshold, read against a CPU-throttled run, which
 *   stands in for a low-end phone.
 * - `detectorMedianMs`: one detector's share. The detectors due at a tick run in one task,
 *   so a set of about twenty at this cost fills a frame between them.
 */
export const COST_BUDGETS = { tickP95Ms: 16, throttledTickP95Ms: 50, detectorMedianMs: 1 };

/**
 * The page-size bands `measured-rates.md` reads rates against, on rendered text length, so
 * a cost can be set beside a false-positive rate for the same kind of page.
 *
 * @param {FixtureReport['facts']} facts
 * @returns {'content-rich' | 'sparse' | 'near-empty'}
 */
export function pageBand(facts) {
    const rendered = facts.renderedChars ?? facts.chars;
    if (rendered > 3000) return 'content-rich';
    if (rendered > 500) return 'sparse';
    return 'near-empty';
}

/**
 * @param {FixtureReport} report
 * @returns {string}
 */
function fixtureCategory(report) {
    return report.category ?? 'generated';
}

/**
 * Split a report's variants by layout mode. The cost axis reads warm and dirty as two
 * separate runs of the same variants, never as rows to compare within one table.
 *
 * @param {VariantReport[]} variants
 * @returns {Map<string, VariantReport[]>}
 */
function byLayout(variants) {
    /** @type {Map<string, VariantReport[]>} */
    const out = new Map();
    for (const variant of variants) {
        const layout = variant.layout ?? 'warm';
        out.set(layout, [...(out.get(layout) ?? []), variant]);
    }
    return out;
}

/**
 * How many of a variant's detectors matched on this fixture. A matched detector costs less
 * than one that scans to the end, so a cheap row that matched is not evidence it is cheap.
 *
 * @param {VariantReport} variant
 * @returns {string}
 */
function matchedCount(variant) {
    const values = Object.values(variant.actual ?? {});
    const matched = values.filter((v) => v === true).length;
    const errors = values.filter((v) => v === 'error').length;
    return `${matched}/${values.length}${errors ? ` (${errors} threw)` : ''}`;
}

/**
 * One fixture on the cost axis: its shape, the aggregate rows, and the costliest
 * individual detectors. The full per-detector list is in the matrix at the end, which
 * reads across fixtures rather than down one.
 *
 * @param {FixtureReport} report
 * @param {{ timed?: boolean, top?: number }} [options]
 * @returns {string}
 */
export function formatCostFixture(report, { timed = true, top = 5 } = {}) {
    const { facts } = report;
    const lines = [
        '',
        `### ${report.fixture} [${fixtureCategory(report)}, ${pageBand(facts)}]`,
        `  ${facts.elements.toLocaleString()} elements, ${facts.textNodes.toLocaleString()} text nodes, ` +
            `${formatChars(facts.chars)} chars, ${formatChars(facts.renderedChars ?? 0)} rendered, ` +
            `${formatChars(facts.scriptChars ?? 0)} inline script`,
    ];

    for (const [layout, variants] of byLayout(report.variants)) {
        const aggregates = variants.filter((v) => v.cost && v.cost.role !== 'each');
        const each = variants.filter((v) => v.cost?.role === 'each');
        const rows = [['variant', 'detectors', ...(timed ? ['median', 'p95'] : []), 'matched']];
        for (const variant of aggregates) {
            rows.push([
                variant.name,
                String(variant.cost?.keys.length ?? 0),
                ...(timed ? [formatMs(variant.median), formatMs(variant.p95)] : []),
                matchedCount(variant),
            ]);
        }
        const costliest = timed ? [...each].sort((a, b) => b.median - a.median).slice(0, top) : [];
        for (const variant of costliest) {
            rows.push([`  ${variant.name}`, '1', formatMs(variant.median), formatMs(variant.p95), matchedCount(variant)]);
        }
        lines.push(
            '',
            `  ${layout}${costliest.length ? ` (aggregates, then the ${costliest.length} costliest detectors)` : ''}`,
            table(rows, '  '),
        );
        for (const variant of each) {
            for (const key of Object.keys(variant.actual ?? {})) {
                if (variant.actual[key] === 'error') lines.push(`  ! ${key} threw`);
            }
        }
    }

    return lines.join('\n');
}

/**
 * Group reports into one section per engine and layout mode, preserving fixture order.
 *
 * @param {FixtureReport[]} reports
 * @returns {Array<{ engine: string, layout: string, fixtures: Array<{ report: FixtureReport, variants: VariantReport[] }> }>}
 */
function costSections(reports) {
    /** @type {Map<string, { engine: string, layout: string, fixtures: Array<{ report: FixtureReport, variants: VariantReport[] }> }>} */
    const sections = new Map();
    for (const report of reports) {
        for (const [layout, variants] of byLayout(report.variants)) {
            const engine = report.engine ?? '';
            const key = `${engine}::${layout}`;
            let section = sections.get(key);
            if (!section) {
                section = { engine, layout, fixtures: [] };
                sections.set(key, section);
            }
            section.fixtures.push({ report, variants });
        }
    }
    return [...sections.values()];
}

/**
 * @param {string} engine
 * @param {string} layout
 * @returns {string}
 */
function sectionTitle(engine, layout) {
    return [engine, layout].filter(Boolean).join(', ');
}

/**
 * Per-detector cost by site category: each detector's worst median over the fixtures in a
 * category, then its worst anywhere. Worst rather than typical because the question is
 * whether shipping it can hurt a page, and the page it hurts is the worst one.
 *
 * Sorted by worst-case cost, so the detectors to look at come first. Detectors over
 * `COST_BUDGETS.detectorMedianMs` are marked.
 *
 * @param {FixtureReport[]} reports
 * @returns {string}
 */
export function formatCostMatrix(reports) {
    const sections = costSections(reports);
    if (sections.length === 0) return '';
    const lines = ['', '='.repeat(60), '== Per-detector cost (worst median per category)', '='.repeat(60)];

    for (const section of sections) {
        const categories = [...new Set(section.fixtures.map(({ report }) => fixtureCategory(report)))];

        /** @type {Map<string, { byCategory: Map<string, number>, worst: number, worstFixture: string, matchedOn: number }>} */
        const rows = new Map();
        for (const { report, variants } of section.fixtures) {
            const category = fixtureCategory(report);
            for (const variant of variants) {
                if (variant.cost?.role !== 'each') continue;
                const key = variant.cost.key ?? variant.name;
                let row = rows.get(key);
                if (!row) {
                    row = { byCategory: new Map(), worst: -1, worstFixture: '', matchedOn: 0 };
                    rows.set(key, row);
                }
                row.byCategory.set(category, Math.max(row.byCategory.get(category) ?? 0, variant.median));
                if (variant.median > row.worst) {
                    row.worst = variant.median;
                    row.worstFixture = report.fixture;
                }
                if (Object.values(variant.actual ?? {}).some((v) => v === true)) row.matchedOn++;
            }
        }

        const sorted = [...rows.entries()].sort((a, b) => b[1].worst - a[1].worst);
        const header = ['detector', ...categories, 'worst', 'worst on', 'matched on'];
        const body = sorted.map(([key, row]) => [
            row.worst > COST_BUDGETS.detectorMedianMs ? `${key} !` : key,
            ...categories.map((c) => (row.byCategory.has(c) ? formatMs(row.byCategory.get(c) ?? 0) : '-')),
            formatMs(row.worst),
            row.worstFixture,
            `${row.matchedOn}/${section.fixtures.length}`,
        ]);
        lines.push('', `### ${sectionTitle(section.engine, section.layout)}`, '', table([header, ...body]));
    }

    lines.push('', `  ! marks a detector whose worst median is over ${COST_BUDGETS.detectorMedianMs} ms.`);
    return lines.join('\n');
}

/**
 * The shipping question: the costliest task the schedule produces. Each `tick@` row is one
 * `setTimeout` callback running every detector due at that offset, so its p95 on the worst
 * page is the task a user's page can be made to wait for.
 *
 * @param {FixtureReport[]} reports
 * @param {{ throttle?: number }} [options] - CPU throttle the run used; picks the budget
 * @returns {string}
 */
export function formatTickSummary(reports, { throttle = 1 } = {}) {
    const sections = costSections(reports);
    if (sections.length === 0) return '';
    const throttled = throttle > 1;
    const budget = throttled ? COST_BUDGETS.throttledTickP95Ms : COST_BUDGETS.tickP95Ms;
    const lines = ['', '='.repeat(60), `== Worst task per tick${throttled ? ` (CPU throttled ${throttle}x)` : ''}`, '='.repeat(60)];

    /** @type {string[]} */
    const over = [];
    for (const section of sections) {
        /** @type {Map<string, { role: string, detectors: number, median: number, p95: number, fixture: string }>} */
        const rows = new Map();
        for (const { report, variants } of section.fixtures) {
            for (const variant of variants) {
                const role = variant.cost?.role;
                if (role !== 'tick' && role !== 'breakage-report' && role !== 'all') continue;
                const row = rows.get(variant.name);
                if (!row || variant.p95 > row.p95) {
                    rows.set(variant.name, {
                        role,
                        detectors: variant.cost?.keys.length ?? 0,
                        median: variant.median,
                        p95: variant.p95,
                        fixture: report.fixture,
                    });
                }
            }
        }
        const header = ['task', 'detectors', 'worst median', 'worst p95', 'on', `p95 vs ${budget} ms`];
        const body = [...rows.entries()].map(([name, row]) => {
            const isTask = row.role !== 'all';
            if (isTask && row.p95 > budget)
                over.push(`${sectionTitle(section.engine, section.layout)} / ${name}: ${formatMs(row.p95)} on ${row.fixture}`);
            return [
                name,
                String(row.detectors),
                formatMs(row.median),
                formatMs(row.p95),
                row.fixture,
                isTask ? (row.p95 > budget ? 'OVER' : 'ok') : '-',
            ];
        });
        lines.push('', `### ${sectionTitle(section.engine, section.layout)}`, '', table([header, ...body]));
    }

    lines.push(
        '',
        over.length === 0
            ? `  Every task stays within ${budget} ms at p95 on every fixture.`
            : `  ${over.length} task(s) over ${budget} ms at p95:\n${over.map((o) => `    - ${o}`).join('\n')}`,
        '  `all` is not a task the scheduler runs; it is shown as the upper bound on any one tick.',
    );
    return lines.join('\n');
}

/**
 * Whether the detectors share work. `matching.js` caches nothing between detectors, so the
 * whole set should cost the sum of its parts; a ratio well below 1 would mean they share
 * something (a warmed cache, a layout one detector pays for and the next reuses), and well
 * above 1 would mean they interfere.
 *
 * @param {FixtureReport[]} reports
 * @returns {string}
 */
export function formatAllVsSum(reports) {
    const sections = costSections(reports);
    if (sections.length === 0) return '';
    const lines = ['', '='.repeat(60), '== All detectors against the sum of each', '='.repeat(60), ''];
    const rows = [['run', 'fixtures', 'min', 'median', 'max', 'widest gap on']];

    for (const section of sections) {
        /** @type {Array<{ ratio: number, fixture: string }>} */
        const ratios = [];
        for (const { report, variants } of section.fixtures) {
            const all = variants.find((v) => v.cost?.role === 'all');
            const empty = variants.find((v) => v.cost?.role === 'empty');
            const floor = empty?.median ?? 0;
            const each = variants.filter((v) => v.cost?.role === 'each');
            // Each `each` row carries the loop overhead once, as does `all`, so the floor is
            // taken off every row before summing.
            const sum = each.reduce((acc, v) => acc + Math.max(0, v.median - floor), 0);
            if (!all || sum <= 0) continue;
            ratios.push({ ratio: Math.max(0, all.median - floor) / sum, fixture: report.fixture });
        }
        if (ratios.length === 0) continue;
        const sorted = [...ratios].sort((a, b) => a.ratio - b.ratio);
        const widest = sorted.reduce((w, r) => (Math.abs(Math.log(r.ratio || 1e-9)) > Math.abs(Math.log(w.ratio || 1e-9)) ? r : w));
        rows.push([
            sectionTitle(section.engine, section.layout),
            String(sorted.length),
            `${sorted[0].ratio.toFixed(2)}x`,
            `${sorted[Math.floor(sorted.length / 2)].ratio.toFixed(2)}x`,
            `${sorted[sorted.length - 1].ratio.toFixed(2)}x`,
            `${widest.fixture} (${widest.ratio.toFixed(2)}x)`,
        ]);
    }

    lines.push(table(rows), '', '  1.00x means the set costs exactly the sum of its detectors run alone.');
    return lines.join('\n');
}
