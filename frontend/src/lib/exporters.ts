import type { ContractAnalysis } from '@/types';

// ============================================================================
// Report exporters: JSON, Markdown, and a compact Discord/GitHub summary.
// ============================================================================

export function toJSON(a: ContractAnalysis): string {
  return JSON.stringify(a, null, 2);
}

export function toMarkdown(a: ContractAnalysis): string {
  const lines: string[] = [];
  lines.push(`# Ritual Black Box — Forensic Report`);
  lines.push('');
  lines.push(`**Contract:** \`${a.identity.address}\``);
  lines.push(`**Chain:** Ritual L1 (chainId ${a.chainId})`);
  lines.push(`**Mode:** ${a.mode.toUpperCase()}`);
  lines.push(`**Generated:** ${new Date(a.createdAt).toISOString()}`);
  lines.push('');

  lines.push(`## Contract Identity`);
  lines.push(`- Is contract: ${a.identity.isContract}`);
  lines.push(`- Balance: ${a.identity.balanceFormatted}`);
  lines.push(`- Events observed: ${a.identity.eventCount}`);
  lines.push(`- Classification: ${a.identity.classification}`);
  lines.push(`- BlackBoxLogger detected: ${a.identity.usesBlackBoxLogger}`);
  lines.push('');

  lines.push(`## Risk Score: ${a.risk.value}/100 — ${a.risk.label}`);
  lines.push(`Basis: **${a.risk.basis}** evidence`);
  a.risk.factors.forEach((f) => lines.push(`- ${f}`));
  lines.push('');

  lines.push(`## Narrative`);
  lines.push(a.narrative);
  lines.push('');

  lines.push(`## Activity Timeline (${a.timeline.length})`);
  a.timeline.forEach((t) => {
    lines.push(`- **[${t.status.toUpperCase()}]** block ${t.blockNumber} — ${t.title}: ${t.summary} _(${t.confidence})_`);
  });
  lines.push('');

  if (a.failures.length) {
    lines.push(`## Failure Analysis (${a.failures.length})`);
    a.failures.forEach((f) => {
      lines.push(`### ${f.title} — ${f.severity.toUpperCase()} (${f.confidence})`);
      lines.push(f.explanation);
      lines.push(`**Possible cause:** ${f.possibleCause}`);
      lines.push(`**Evidence:**`);
      f.evidence.forEach((e) => lines.push(`  - ${e}`));
      lines.push('');
    });
  }

  if (a.recommendations.length) {
    lines.push(`## Recommendations (${a.recommendations.length})`);
    a.recommendations.forEach((r) => {
      lines.push(`### ${r.title}`);
      lines.push(`- Why: ${r.why}`);
      lines.push(`- Risk if ignored: ${r.risk}`);
      lines.push(`- Difficulty: ${r.difficulty} | Impact: ${r.impact}`);
      if (r.codeExample) {
        lines.push('```solidity');
        lines.push(r.codeExample);
        lines.push('```');
      }
      lines.push('');
    });
  }

  if (a.missingEvidence.length) {
    lines.push(`## Missing Evidence`);
    a.missingEvidence.forEach((m) => {
      lines.push(`- **${m.what}** — ${m.whyItMatters}${m.howToFix ? ` _Fix:_ ${m.howToFix}` : ''}`);
    });
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`_Ritual Black Box reconstructs only public on-chain evidence. It does not infer private internal logic. Findings marked "inferred" or "uncertain" are not proven._`);
  return lines.join('\n');
}

export function toSummary(a: ContractAnalysis): string {
  const top = a.failures[0];
  return [
    `🛰️ Ritual Black Box report for ${a.identity.address}`,
    `Risk: ${a.risk.value}/100 (${a.risk.label}, ${a.risk.basis} evidence)`,
    `Events: ${a.identity.eventCount} | Failures: ${a.failures.length} | Mode: ${a.mode}`,
    top ? `Top finding: ${top.title} [${top.severity}/${top.confidence}]` : 'No failures detected.',
    a.identity.usesBlackBoxLogger ? 'BlackBoxLogger: ✅ detected' : 'BlackBoxLogger: ❌ not detected',
  ].join('\n');
}

export function download(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
