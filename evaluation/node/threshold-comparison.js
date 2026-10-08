import { calculateMetrics } from './metrics.js';

export function compareThresholds(report) {
  if (report?.kind !== 'development-evaluation' || report.partition !== 'development' || !Array.isArray(report.results)) throw new Error('A development evaluation report is required.');
  const rows = report.results.filter(row => row.skipped === null);
  if (report.summary?.evaluatedInputs !== rows.length || report.summary?.totalInputs !== report.results.length) throw new Error('Report coverage does not reconcile.');
  const distribution = new Map();
  const signals = {};
  for (const row of rows) {
    if (!['phishing', 'legitimate'].includes(row.label) || !row.analysis?.valid || !row.analysis.supported || !Number.isInteger(row.analysis.score) || row.analysis.score < 0 || row.analysis.score > 100 || !Array.isArray(row.analysis.findings)) throw new Error('Invalid scored record.');
    const score = row.analysis.score;
    if (!distribution.has(score)) distribution.set(score, { score, phishing: 0, legitimate: 0 });
    distribution.get(score)[row.label]++;
    for (const finding of row.analysis.findings) {
      if (typeof finding.id !== 'string') throw new Error('Invalid finding ID.');
      if (!signals[finding.id]) signals[finding.id] = { phishing: 0, legitimate: 0 };
      signals[finding.id][row.label]++;
    }
  }
  const thresholds = [10, 20, 30, 40, 50, 60].map(threshold => {
    const counts = { tp: 0, fp: 0, fn: 0, tn: 0 };
    for (const row of rows) counts[row.label === 'phishing' ? (row.analysis.score >= threshold ? 'tp' : 'fn') : (row.analysis.score >= threshold ? 'fp' : 'tn')]++;
    return { threshold, ...calculateMetrics(counts) };
  });
  return { thresholds, scoreDistribution: [...distribution.values()].sort((a, b) => a.score - b.score), signalCounts: signals, coverage: report.summary };
}
