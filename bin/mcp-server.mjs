#!/usr/bin/env node
/**
 * Zero-dependency STDIO MCP Server (JSON-RPC 2.0)
 * Compatible with Claude Desktop, Cursor, Codex, Antigravity & any MCP client.
 */
import readline from 'node:readline';
import { fetchCleanBounties, scanPromptInjection } from '../src/core.mjs';

const TOOLS = [
	{
		name: 'scan_prompt_injection',
		description:
			'Scan untrusted GitHub issue text, PR diffs, READMEs, or tool output for indirect prompt-injection & secret-exfiltration attacks before an AI agent acts on it.',
		inputSchema: {
			type: 'object',
			properties: {
				text: { type: 'string', description: 'Raw text or markdown to inspect' },
				source: { type: 'string', description: 'Optional label (e.g. issue URL or filename)' },
			},
			required: ['text'],
		},
	},
	{
		name: 'get_clean_bounties',
		description:
			'Fetch the latest 24/7 anti-honeypot, pre-scored GitHub open-source bounty feed from BountyRadar.',
		inputSchema: {
			type: 'object',
			properties: {
				limit: { type: 'number', description: 'Max bounties to return (1-40, default 10)' },
			},
		},
	},
];

function send(msg) {
	process.stdout.write(JSON.stringify(msg) + '\n');
}

async function handleRequest(req) {
	const { id, method, params } = req;
	if (method === 'initialize') {
		return send({
			jsonrpc: '2.0',
			id,
			result: {
				protocolVersion: '2024-11-05',
				capabilities: { tools: {} },
				serverInfo: { name: 'mcp-agent-shield', version: '1.0.0' },
			},
		});
	}
	if (method === 'notifications/initialized') {
		return;
	}
	if (method === 'tools/list') {
		return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
	}
	if (method === 'tools/call') {
		const name = params?.name;
		const args = params?.arguments || {};
		try {
			let data;
			if (name === 'scan_prompt_injection') {
				data = scanPromptInjection(args.text || '', args.source || '<mcp-input>');
			} else if (name === 'get_clean_bounties') {
				data = await fetchCleanBounties(args.limit);
			} else {
				return send({
					jsonrpc: '2.0',
					id,
					error: { code: -32601, message: `Unknown tool: ${name}` },
				});
			}
			return send({
				jsonrpc: '2.0',
				id,
				result: { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] },
			});
		} catch (err) {
			return send({
				jsonrpc: '2.0',
				id,
				result: { isError: true, content: [{ type: 'text', text: err.message }] },
			});
		}
	}
	if (id !== undefined) {
		send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
	}
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
	const trimmed = line.trim();
	if (!trimmed) return;
	try {
		handleRequest(JSON.parse(trimmed));
	} catch {
		send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
	}
});
