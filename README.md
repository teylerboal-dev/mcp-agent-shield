# mcp-agent-shield

**Zero-dependency MCP Server & x402 (Base USDC) Pay-Per-Call Security API for AI Coding Agents.**

Protect Claude Code, Cursor, Codex, Windsurf, and autonomous agents from indirect prompt-injection attacks and fake GitHub bounties — installable in 10 seconds as an **MCP server** or deployable as an **x402 pay-per-call Base USDC micro-API**.

## 1. Install as an MCP Server (Claude Desktop / Cursor / Antigravity)
```json
{
  "mcpServers": {
    "agent-shield": {
      "command": "node",
      "args": ["/path/to/mcp-agent-shield/bin/mcp-server.mjs"]
    }
  }
}
```
Exposes:
- `scan_prompt_injection` — blocks system-prompt exfiltration, secret-stealing curl commands, hidden HTML comments, and Unicode tag smuggling.
- `get_clean_bounties` — fetches the live 24/7 anti-honeypot bounty feed from [BountyRadar](https://teylerboal-dev.github.io/bounty-radar/).

## 2. Run as an x402 Pay-Per-Call Micro-API (Base USDC)
```bash
PORT=4020 npm run start:x402
```
- Discovery manifest: `GET /.well-known/x402.json`
- `POST /v1/scan` — `$0.005 USDC` on Base (`HTTP 402` challenge → `0x1Dc13865aAD54C5ae7faD363595bC7ed087c69B9`)
- `GET /v1/bounties` — `$0.01 USDC` on Base

## 3. Pro Ruleset & Live Web Sandboxes (Direct Base / ETH USDC)

- **Live Prompt-Injection Sandbox & GitHub Action**: [PromptShield](https://teylerboal-dev.github.io/prompt-shield/) — upgrade to the **Pro Enterprise Ruleset (`$29 USDC` lifetime)** for 50+ zero-day agent-hijacking signatures.
- **24/7 Live Anti-Honeypot Bounty Feed**: [BountyRadar](https://teylerboal-dev.github.io/bounty-radar/) — **Pro Feed (`$19/mo` or `$49 USDC` lifetime)** with real-time alerts and pre-flight repo safety audits.
- **Direct Base / Ethereum / Arbitrum / Optimism USDC Checkout**:
  `0x1Dc13865aAD54C5ae7faD363595bC7ed087c69B9` (include your GitHub handle or tx hash in an Issue/Discussion to receive your Pro license key automatically).

## Tests
```bash
npm test
```

## License
MIT
