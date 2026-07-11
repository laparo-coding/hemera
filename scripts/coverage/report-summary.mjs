import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_INPUT = 'coverage/coverage-summary.json';

function printHelp() {
  console.log(`Usage: node scripts/coverage/report-summary.mjs [options]

Options:
  --input <path>     Path to coverage-summary.json (default: coverage/coverage-summary.json)
  --json             Print machine-readable JSON instead of Markdown
  --top <number>     Number of lowest-coverage files to show (default: 10)
  --help             Show this help message`);
}

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, json: false, top: 10 };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') { // nosemgrep: javascript_crypto_rule-node-timing-attack CLI arg parsing, not security-sensitive
      args.help = true;
    } else if (token === '--json') { // nosemgrep: javascript_crypto_rule-node-timing-attack CLI arg parsing, not security-sensitive
      args.json = true;
    } else if (token === '--input') { // nosemgrep: javascript_crypto_rule-node-timing-attack CLI arg parsing, not security-sensitive
      args.input = argv[index + 1];
      index += 1;
    } else if (token === '--top') { // nosemgrep: javascript_crypto_rule-node-timing-attack CLI arg parsing, not security-sensitive
      args.top = Number.parseInt(argv[index + 1] ?? '10', 10);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!Number.isInteger(args.top) || args.top <= 0) {
    throw new Error('--top must be a positive integer');
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

  return { resolvedPath, parsed };
}

function toPercent(metric) {
  return Number(metric?.pct ?? 0);
}

function buildSummary(parsed, top) {
  const totals = {
    lines: toPercent(parsed.total.lines),
    statements: toPercent(parsed.total.statements),
    functions: toPercent(parsed.total.functions),
    branches: toPercent(parsed.total.branches),
  };

  const files = Object.entries(parsed)
    .filter(([key]) => key !== 'total')
    .map(([filePath, metrics]) => ({
      filePath,
      lines: toPercent(metrics.lines),
      statements: toPercent(metrics.statements),
      functions: toPercent(metrics.functions),
      branches: toPercent(metrics.branches),
      lowestMetric: Math.min(
        toPercent(metrics.lines),
        toPercent(metrics.statements),
        toPercent(metrics.functions),
        toPercent(metrics.branches)
      ),
    }))
    .sort((left, right) => left.lowestMetric - right.lowestMetric)
    .slice(0, top);

  return {
    totals,
    files,
    criticalAreaCandidates: files.map((entry) => entry.filePath),
  };
}

function printMarkdown(summary, resolvedPath) {
  console.log(`# Coverage Summary\n`);
  console.log(`Source: ${resolvedPath}\n`);
  console.log(`## Totals\n`);
  console.log(`- Lines: ${summary.totals.lines}%`);
  console.log(`- Statements: ${summary.totals.statements}%`);
  console.log(`- Functions: ${summary.totals.functions}%`);
  console.log(`- Branches: ${summary.totals.branches}%\n`);
  console.log(`## Lowest Coverage Files\n`);
  for (const file of summary.files) {
    console.log(
      `- ${file.filePath}: lines ${file.lines}%, statements ${file.statements}%, functions ${file.functions}%, branches ${file.branches}%`
    );
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const { resolvedPath, parsed } = readCoverageSummary(args.input);
  const summary = buildSummary(parsed, args.top);

  if (args.json) {
    console.log(JSON.stringify({ source: resolvedPath, ...summary }, null, 2));
  } else {
    printMarkdown(summary, resolvedPath);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}