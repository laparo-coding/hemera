import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_INPUT = 'coverage/coverage-summary.json';

function printHelp() {
  console.log(`Usage: node scripts/coverage/assert-gates.mjs [options]

Options:
  --input <path>       Path to coverage-summary.json (default: coverage/coverage-summary.json)
  --lines <number>     Minimum line coverage percentage
  --statements <number> Minimum statement coverage percentage
  --functions <number> Minimum function coverage percentage
  --branches <number>  Minimum branch coverage percentage
  --help               Show this help message`);
}

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, gates: {} };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') {
      args.help = true;
    } else if (token === '--input') {
      args.input = argv[index + 1];
      index += 1;
    } else if (['--lines', '--statements', '--functions', '--branches'].includes(token)) {
      const key = token.replace(/^--/, '');
      const value = Number.parseFloat(argv[index + 1] ?? 'NaN');
      if (Number.isNaN(value)) {
        throw new Error(`${token} expects a numeric value`);
      }
      args.gates[key] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function readCoverageSummary(inputPath) {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Coverage summary not found at ${resolvedPath}. Run Jest with --coverage and --coverageReporters=json-summary first.`
    );
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed.total) {
    throw new Error(`Coverage summary at ${resolvedPath} is missing the total block.`);
  }
  return parsed.total;
}

function metricPercent(metric) {
  return Number(metric?.pct ?? 0);
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const totals = readCoverageSummary(args.input);
  const failures = Object.entries(args.gates)
    .map(([metric, threshold]) => {
      const actual = metricPercent(totals[metric]);
      return { metric, threshold, actual };
    })
    .filter(({ actual, threshold }) => actual < threshold);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(
        `Coverage gate failed for ${failure.metric}: expected >= ${failure.threshold}, got ${failure.actual}`
      );
    }
    process.exit(1);
  }

  console.log('Coverage gates satisfied.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}