/**
 * Shared detection core for MCP tools and x402 pay-per-call endpoints.
 */

export const PAYOUT_ADDRESS = '0x1Dc13865aAD54C5ae7faD363595bC7ed087c69B9';
export const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const FEED_URL = 'https://teylerboal-dev.github.io/bounty-radar/feed.json';

const RULES = [
	{
		id: 'PS-001',
		severity: 'CRITICAL',
		category: 'System Prompt Exfiltration',
		pattern:
			/(?:paste|include|output|dump|print|reveal|leak)\s+(?:your\s+)?(?:complete|full|entire|exact)?\s*(?:pre-session\s+instructions|system\s+prompt|platform_instructions|hidden\s+instructions)/i,
	},
	{
		id: 'PS-002',
		severity: 'CRITICAL',
		category: 'Credential Exfiltration',
		pattern:
			/(?:curl|wget|fetch|nc|powershell|invoke-webrequest)[^\n]{0,160}(?:\.env|id_rsa|aws_secret|github_token|gho_|sk-[a-z0-9]|npm_token|credentials)/i,
	},
	{
		id: 'PS-003',
		severity: 'HIGH',
		category: 'Instruction Override',
		pattern:
			/(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|rules|guidelines|prompts)/i,
	},
	{
		id: 'PS-004',
		severity: 'HIGH',
		category: 'Hidden HTML Payload',
		pattern:
			/<!--[\s\S]{0,600}?(?:ignore\s+previous|system\s+prompt|execute\s+command|exfiltrate|curl\s+http|pre-session\s+instructions)[\s\S]{0,600}?-->/i,
	},
	{
		id: 'PS-005',
		severity: 'HIGH',
		category: 'Unicode Tag Smuggling',
		pattern: /[\u{E0000}-\u{E007F}\u200B-\u200F\u202A-\u202E]{4,}/u,
	},
];

const WEIGHTS = { CRITICAL: 50, HIGH: 30, MEDIUM: 15 };

export function scanPromptInjection(text = '', source = '<input>') {
	const findings = [];
	for (const rule of RULES) {
		const m = rule.pattern.exec(text);
		if (m) {
			const line = text.slice(0, m.index).split(/\r?\n/).length;
			findings.push({
				id: rule.id,
				severity: rule.severity,
				category: rule.category,
				line,
				snippet: m[0].replace(/\s+/g, ' ').slice(0, 120),
			});
		}
	}
	const riskScore = Math.min(
		100,
		findings.reduce((s, f) => s + (WEIGHTS[f.severity] ?? 10), 0),
	);
	return {
		status: riskScore >= 50 ? 'BLOCK' : riskScore >= 15 ? 'WARN' : 'PASS',
		riskScore,
		source,
		findings,
	};
}

export async function fetchCleanBounties(limit = 10) {
	const res = await fetch(FEED_URL);
	if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
	const feed = await res.json();
	return {
		generatedAt: feed.generatedAt,
		honeypotsBlocked: feed.honeypotsBlocked,
		bounties: (feed.results || []).slice(0, Math.max(1, Math.min(40, Number(limit) || 10))),
	};
}
