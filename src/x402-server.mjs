#!/usr/bin/env node
/**
 * x402 (HTTP 402 Payment Required) Base USDC Pay-Per-Call Micro-API Server
 * Enables autonomous AI agents to pay $0.005-$0.01 USDC per call directly on Base.
 */
import http from 'node:http';
import {
	BASE_USDC_CONTRACT,
	PAYOUT_ADDRESS,
	fetchCleanBounties,
	scanPromptInjection,
} from './core.mjs';

export function buildX402Manifest(baseUrl = 'http://localhost:4020') {
	return {
		x402Version: 1,
		service: 'mcp-agent-shield',
		network: 'base',
		asset: BASE_USDC_CONTRACT,
		payTo: PAYOUT_ADDRESS,
		endpoints: [
			{
				method: 'POST',
				path: '/v1/scan',
				priceUsd: '0.005',
				maxAmountRequired: '5000', // 0.005 USDC (6 decimals)
				description: 'Indirect prompt-injection & secret-exfiltration scan',
				url: `${baseUrl}/v1/scan`,
			},
			{
				method: 'GET',
				path: '/v1/bounties',
				priceUsd: '0.01',
				maxAmountRequired: '10000', // 0.01 USDC (6 decimals)
				description: 'Clean anti-honeypot GitHub bounty feed',
				url: `${baseUrl}/v1/bounties`,
			},
		],
	};
}

function sendJson(res, status, body, extraHeaders = {}) {
	res.writeHead(status, { 'Content-Type': 'application/json', ...extraHeaders });
	res.end(JSON.stringify(body, null, 2));
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
			if (data.length > 512_000) reject(new Error('Payload too large'));
		});
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
}

export function createX402Server() {
	return http.createServer(async (req, res) => {
		const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
		const baseUrl = `${url.protocol}//${url.host}`;

		if (req.method === 'GET' && url.pathname === '/.well-known/x402.json') {
			return sendJson(res, 200, buildX402Manifest(baseUrl));
		}

		if (req.method === 'GET' && url.pathname === '/health') {
			return sendJson(res, 200, { ok: true, service: 'mcp-agent-shield', payTo: PAYOUT_ADDRESS });
		}

		const isPaidRoute = url.pathname === '/v1/scan' || url.pathname === '/v1/bounties';
		if (isPaidRoute) {
			const xPayment = req.headers['x-payment'];
			const priceAtomic = url.pathname === '/v1/scan' ? '5000' : '10000';
			if (!xPayment) {
				return sendJson(res, 402, {
					x402Version: 1,
					error: 'Payment Required',
					accepts: [
						{
							scheme: 'exact',
							network: 'base',
							maxAmountRequired: priceAtomic,
							resource: `${baseUrl}${url.pathname}`,
							description:
								url.pathname === '/v1/scan'
									? 'PromptShield indirect prompt-injection scan ($0.005 USDC)'
									: 'BountyRadar clean bounty feed ($0.01 USDC)',
							mimeType: 'application/json',
							payTo: PAYOUT_ADDRESS,
							asset: BASE_USDC_CONTRACT,
							maxTimeoutSeconds: 60,
						},
					],
				});
			}

			// Note: Production deployments verify the EIP-3009 X-Payment header
			// through a Coinbase / x402 facilitator before serving the response.
			if (url.pathname === '/v1/scan' && req.method === 'POST') {
				try {
					const raw = await readBody(req);
					const parsed = JSON.parse(raw || '{}');
					return sendJson(res, 200, scanPromptInjection(parsed.text || '', parsed.source || 'api'));
				} catch (err) {
					return sendJson(res, 400, { error: err.message });
				}
			}

			if (url.pathname === '/v1/bounties' && req.method === 'GET') {
				try {
					const limit = Number(url.searchParams.get('limit') || 10);
					return sendJson(res, 200, await fetchCleanBounties(limit));
				} catch (err) {
					return sendJson(res, 502, { error: err.message });
				}
			}
		}

		sendJson(res, 404, { error: 'Not found', discovery: '/.well-known/x402.json' });
	});
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
	const port = Number(process.env.PORT || 4020);
	createX402Server().listen(port, () => {
		console.log(`mcp-agent-shield x402 server listening on :${port} (payTo: ${PAYOUT_ADDRESS})`);
	});
}
