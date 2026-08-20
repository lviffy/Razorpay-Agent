import { Router } from "express";
import { sseClients, logEvent } from "../services/audit.ts";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────────────────────
// /demo Dashboard — Tiny judge-facing timeline view
// No React. No build step. Vanilla HTML + SSE.
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

// ── GET /demo — serve the dashboard HTML ─────────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(getDashboardHtml());
});

// ── GET /demo/events — SSE stream ────────────────────────────────────────────

router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Send last 20 audit events as initial history
  db.query(
    "SELECT * FROM audit_ledger ORDER BY id DESC LIMIT 20"
  ).then(({ rows }) => {
    for (const row of rows.reverse()) {
      const data = JSON.stringify({
        type: row.event_type,
        ids: {
          whatsappMessageId: row.whatsapp_message_id,
          conversationId: row.conversation_id,
          x402TransactionId: row.x402_transaction_id,
          razorpayPaymentId: row.razorpay_payment_id,
          orderId: row.order_id,
        },
        payload: row.payload,
        checksum: row.event_checksum,
        timestamp: row.timestamp,
      });
      res.write(`data: ${data}\n\n`);
    }
  }).catch(console.error);

  // Register this client for live updates
  const send = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };
  sseClients.add(send);

  // Keep-alive ping every 30s
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 30_000);

  req.on("close", () => {
    sseClients.delete(send);
    clearInterval(keepAlive);
  });
});

// ── Dashboard HTML ────────────────────────────────────────────────────────────

function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgentBridge — Live Demo Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: #0d1117;
      color: #e6edf3;
      padding: 24px;
      min-height: 100vh;
    }
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #30363d;
    }
    header h1 { font-size: 20px; font-weight: 600; color: #58a6ff; }
    .badge {
      background: #238636;
      color: #fff;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    #status { font-size: 12px; color: #8b949e; margin-left: auto; }
    #timeline { display: flex; flex-direction: column; gap: 8px; }
    .event {
      display: grid;
      grid-template-columns: 80px 180px 1fr;
      gap: 12px;
      padding: 10px 14px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      font-size: 13px;
      align-items: start;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }
    .event.PAYMENT_CAPTURED { border-color: #238636; }
    .event.PAYMENT_FAILED { border-color: #da3633; }
    .event.INVENTORY_LOCKED { border-color: #d29922; }
    .time { color: #8b949e; font-size: 11px; margin-top: 2px; }
    .type {
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 4px;
      background: #21262d;
      text-align: center;
    }
    .PAYMENT_CAPTURED .type { background: #1f4228; color: #3fb950; }
    .PAYMENT_FAILED .type { background: #3d1b1b; color: #f85149; }
    .INVENTORY_LOCKED .type { background: #3d2c00; color: #e3b341; }
    .ids { display: flex; flex-direction: column; gap: 3px; }
    .id-row { font-size: 11px; color: #8b949e; }
    .id-row span { color: #79c0ff; }
    #empty { color: #8b949e; text-align: center; padding: 48px; font-size: 14px; }
    .dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #238636;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  </style>
</head>
<body>
  <header>
    <h1>🔗 AgentBridge</h1>
    <span class="badge">LIVE DEMO</span>
    <span id="status"><span class="dot"></span> Connecting...</span>
  </header>
  <div id="timeline">
    <div id="empty">Waiting for events — send a WhatsApp message to start the demo</div>
  </div>

  <script>
    const timeline = document.getElementById('timeline');
    const empty = document.getElementById('empty');
    const statusEl = document.getElementById('status');

    const es = new EventSource('/demo/events');

    es.onopen = () => {
      statusEl.innerHTML = '<span class="dot"></span> Live';
    };

    es.onmessage = (e) => {
      const ev = JSON.parse(e.data);
      renderEvent(ev);
    };

    es.onerror = () => {
      statusEl.textContent = '⚠ Reconnecting...';
    };

    function renderEvent(ev) {
      if (empty) empty.remove();

      const ids = ev.ids || {};
      const ts = new Date(ev.timestamp).toLocaleTimeString('en-IN');

      const el = document.createElement('div');
      el.className = 'event ' + (ev.type || '');
      el.innerHTML = \`
        <div>
          <div class="time">\${ts}</div>
        </div>
        <div>
          <span class="type">\${ev.type}</span>
        </div>
        <div class="ids">
          \${ids.whatsappMessageId ? \`<div class="id-row">WA: <span>\${ids.whatsappMessageId}</span></div>\` : ''}
          \${ids.conversationId ? \`<div class="id-row">Conv: <span>\${ids.conversationId}</span></div>\` : ''}
          \${ids.x402TransactionId ? \`<div class="id-row">x402: <span>\${ids.x402TransactionId}</span></div>\` : ''}
          \${ids.razorpayPaymentId ? \`<div class="id-row">Pay: <span>\${ids.razorpayPaymentId}</span></div>\` : ''}
          \${ids.orderId ? \`<div class="id-row">Order: <span>\${ids.orderId}</span></div>\` : ''}
        </div>
      \`;

      // Newest events at top
      timeline.insertBefore(el, timeline.firstChild);
    }
  </script>
</body>
</html>`;
}

export default router;
