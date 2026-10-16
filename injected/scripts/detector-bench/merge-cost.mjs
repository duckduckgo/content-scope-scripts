/**
 * Re-render the cost-axis summaries over several `--json` runs, such as the shards of one
 * spec run with `--shard`.
 *
 *   node scripts/detector-bench/merge-cost.mjs <run.json>...
 *
 * Runs must share a CPU throttle, since the tick budget depends on it.
 */
import { readFileSync } from 'node:fs';
import { formatCostMatrix, formatTickSummary, formatAllVsSum } from './core/report.mjs';

const paths = process.argv.slice(2);
if (paths.length === 0) {
    console.error('Usage: node scripts/detector-bench/merge-cost.mjs <run.json>...');
    process.exit(1);
}

const runs = paths.map((p) => ({ path: p, ...JSON.parse(readFileSync(p, 'utf8')) }));
const notCost = runs.filter((run) => run.axis !== 'cost');
if (notCost.length > 0) {
    console.error(`Not cost-axis runs: ${notCost.map((run) => run.path).join(', ')}`);
    process.exit(1);
}
const throttles = [...new Set(runs.map((run) => run.cpuThrottle ?? 1))];
if (throttles.length > 1) {
    console.error(`Runs use different CPU throttles (${throttles.join(', ')}); merge each separately.`);
    process.exit(1);
}

const reports = runs.flatMap((run) => run.reports);
console.log(formatCostMatrix(reports));
console.log(formatTickSummary(reports, { throttle: throttles[0] }));
console.log(formatAllVsSum(reports));
