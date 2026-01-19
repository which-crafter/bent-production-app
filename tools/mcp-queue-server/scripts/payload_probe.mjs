#!/usr/bin/env node
/**
 * Payload Size Probe (HTTP /probe)
 *
 * Tests the maximum safe payload size for a simple HTTP endpoint.
 * Useful for determining ngrok / action limits without MCP protocol complexity.
 */

const ENDPOINT_URL =
  process.env.PROBE_URL ||
  process.argv[2] ||
  "http://127.0.0.1:8000/probe";

// Payload sizes to test (in bytes)
const PAYLOAD_SIZES = [
  25 * 1024,         // 25KB
  50 * 1024,         // 50KB
  100 * 1024,        // 100KB
  200 * 1024,        // 200KB
  400 * 1024,        // 400KB
  800 * 1024,        // 800KB
  Math.floor(1.2 * 1024 * 1024), // 1.2MB
  2 * 1024 * 1024,   // 2MB
  3 * 1024 * 1024,   // 3MB
  4 * 1024 * 1024,   // 4MB
  5 * 1024 * 1024,   // 5MB (server route limit)
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function generateBody(sizeBytes) {
  // Create a buffer of sizeBytes filled with 'x'
  return Buffer.alloc(sizeBytes, "x");
}

async function testPayload(sizeBytes) {
  const body = generateBody(sizeBytes);

  try {
    const res = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body,
    });

    const status = res.status;
    const text = await res.text();

    if (status >= 200 && status < 300) {
      // Expect JSON { ok: true, bytes_received: N }
      return { success: true, status, response: text.slice(0, 200) };
    }

    return { success: false, status, response: text.slice(0, 200) };
  } catch (err) {
    return { success: false, status: 0, response: err?.message || String(err) };
  }
}

async function main() {
  console.log(`Testing probe endpoint: ${ENDPOINT_URL}\n`);

  let largestOk = 0;

  for (const sizeBytes of PAYLOAD_SIZES) {
    const label = formatSize(sizeBytes);
    process.stdout.write(`Testing ${label}... `);

    const result = await testPayload(sizeBytes);

    if (result.success) {
      console.log(`✓ OK (HTTP ${result.status}) resp=${result.response}`);
      largestOk = sizeBytes;
    } else {
      console.log(`✗ FAIL (HTTP ${result.status}) resp=${result.response}`);
      console.log(`\nStopping after first failure.`);
      break;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Largest successful payload size: ${formatSize(largestOk)} (${largestOk} bytes)`);
  console.log(`Endpoint: ${ENDPOINT_URL}`);
  process.exit(largestOk > 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
