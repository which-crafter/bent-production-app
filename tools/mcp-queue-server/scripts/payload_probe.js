#!/usr/bin/env node
/**
 * MCP Payload Size Probe
 *
 * Tests the maximum safe payload size for MCP endpoint through ngrok.
 * Sends JSON-RPC requests with increasing payload sizes until failure.
 */
import process from "node:process";
const ENDPOINT_URL = process.env.MCP_ENDPOINT_URL || process.argv[2] || "http://127.0.0.1:8000/probe";
// Payload sizes to test (in bytes)
const PAYLOAD_SIZES = [
    25 * 1024, // 25KB
    50 * 1024, // 50KB
    100 * 1024, // 100KB
    200 * 1024, // 200KB
    400 * 1024, // 400KB
    800 * 1024, // 800KB
    1.2 * 1024 * 1024, // 1.2MB
];
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
function generatePayload(sizeBytes) {
    // Create a JSON-RPC 2.0 request with a large payload
    // We'll pad the params field to reach the desired size
    const baseRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "test_tool",
            arguments: {
                data: "",
            },
        },
    };
    // Calculate how much padding we need
    const baseSize = JSON.stringify(baseRequest).length;
    const paddingNeeded = sizeBytes - baseSize - 50; // 50 bytes buffer for JSON structure
    if (paddingNeeded > 0) {
        // Fill the data field with padding
        baseRequest.params.arguments.data = "x".repeat(paddingNeeded);
    }
    return baseRequest;
}
async function testPayload(sizeBytes) {
    const payload = generatePayload(sizeBytes);
    const body = JSON.stringify(payload);
    try {
        const response = await fetch(ENDPOINT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: body,
        });
        const status = response.status;
        const success = status === 200;
        let bytesReceived;
        let error;
        if (success) {
            try {
                const result = await response.json();
                bytesReceived = result.bytes_received;
            }
            catch {
                error = "Could not parse response JSON";
            }
        }
        else {
            try {
                const errorText = await response.text();
                error = errorText.substring(0, 200); // Limit error message length
            }
            catch {
                error = "Could not read error response";
            }
        }
        return { success, status, bytesReceived, error };
    }
    catch (err) {
        return {
            success: false,
            status: 0,
            error: err.message || String(err),
        };
    }
}
async function main() {
    console.log(`Testing MCP endpoint: ${ENDPOINT_URL}\n`);
    let largestSuccessfulSize = 0;
    let largestSuccessfulSizeFormatted = "0B";
    for (const sizeBytes of PAYLOAD_SIZES) {
        const sizeFormatted = formatSize(sizeBytes);
        process.stdout.write(`Testing ${sizeFormatted}... `);
        const result = await testPayload(sizeBytes);
        if (result.success) {
            const bytesReceived = result.bytesReceived !== undefined ? ` (received: ${formatSize(result.bytesReceived)})` : '';
            console.log(`✓ SUCCESS (HTTP ${result.status})${bytesReceived}`);
            largestSuccessfulSize = sizeBytes;
            largestSuccessfulSizeFormatted = sizeFormatted;
        }
        else {
            console.log(`✗ FAILED (HTTP ${result.status})`);
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            }
            console.log(`\nStopping after first failure.`);
            break;
        }
    }
    console.log(`\n--- Results ---`);
    console.log(`Largest successful payload size: ${largestSuccessfulSizeFormatted} (${largestSuccessfulSize} bytes)`);
    console.log(`Endpoint: ${ENDPOINT_URL}`);
    process.exit(largestSuccessfulSize > 0 ? 0 : 1);
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
