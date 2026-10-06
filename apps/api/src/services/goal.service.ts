export type Metric = { target: number; value: number; weight?: number | null };
export function goalProgress(metrics: Metric[]): number {
  if (!metrics.length) return 0;
  const hasWeights = metrics.some((metric) => metric.weight != null);
  if (hasWeights && (metrics.some((metric) => metric.weight == null) || Math.abs(metrics.reduce((sum, metric) => sum + (metric.weight ?? 0), 0) - 100) > 0.0001)) throw new Error("All metric weights must be provided and total 100.");
  return metrics.reduce((sum, metric) => sum + Math.min(1, Math.max(0, metric.value / metric.target)) * (hasWeights ? (metric.weight ?? 0) / 100 : 1 / metrics.length), 0) * 100;
}
export function goalPace(start: Date, target: Date, today: Date, progress: number, metrics: Metric[]) {
  const duration = Math.max(1, target.getTime() - start.getTime());
  const elapsed = Math.min(1, Math.max(0, (today.getTime() - start.getTime()) / duration));
  const expected = elapsed * 100;
  const gap = progress - expected;
  const daysLeft = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
  return { expectedPercent: expected, gapPercent: gap, status: progress >= 100 ? "completed" : gap >= 8 ? "ahead" : gap >= -5 ? "on-track" : gap >= -15 ? "slightly-behind" : "behind", daysLeft, requiredPerDay: metrics.map((metric) => ({ remaining: Math.max(0, metric.target - metric.value), perDay: daysLeft ? Math.max(0, metric.target - metric.value) / daysLeft : Math.max(0, metric.target - metric.value) })) };
}
