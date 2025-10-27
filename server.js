#!/usr/bin/env node

/**
 * Minimal Beehiiv MCP Server Test
 * This is a simplified version to test basic functionality
 */

console.error("=== BEEHIIV MCP SERVER STARTING ===");
console.error("Node.js version:", process.version);
console.error("Platform:", process.platform);
console.error("Architecture:", process.arch);
console.error("Environment variables:", Object.keys(process.env).filter(k => k.includes('BEEHIIV')));
console.error("API Key present:", !!process.env.BEEHIIV_API_KEY);
console.error("API Key length:", process.env.BEEHIIV_API_KEY ? process.env.BEEHIIV_API_KEY.length : 0);

// Test basic functionality
try {
  console.error("Testing basic imports...");
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');
  console.error("✓ Basic imports successful");
  
  // Test JSON parsing
  const testObj = { test: "value" };
  const jsonStr = JSON.stringify(testObj);
  const parsed = JSON.parse(jsonStr);
  console.error("✓ JSON operations successful");
  
  console.error("=== BASIC TESTS PASSED ===");
  
} catch (error) {
  console.error("❌ Basic test failed:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}

// Simple MCP server implementation
let requestId = 0;

function sendResponse(method, result, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: requestId++,
    ...(error ? { error } : { result })
  };
  console.log(JSON.stringify(response));
  console.error(`Sent response for ${method}:`, error ? 'ERROR' : 'SUCCESS');
}

console.error("=== STARTING MCP PROTOCOL HANDLER ===");

// Handle stdin
let buffer = "";
process.stdin.on('data', (chunk) => {
  const data = chunk.toString();
  console.error("Received data:", data.length, "bytes");
  buffer += data;
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        console.error("Parsing line:", line.substring(0, 100) + (line.length > 100 ? '...' : ''));
        const request = JSON.parse(line);
        console.error("Parsed request:", request.method, "ID:", request.id);
        
        switch (request.method) {
          case 'initialize':
            console.error("Handling initialize request");
            sendResponse('initialize', {
              protocolVersion: "2025-06-18",
              capabilities: {
                tools: {},
                prompts: {},
                resources: {}
              },
              serverInfo: {
                name: "beehiiv-test",
                version: "1.0.0"
              }
            });
            break;
            
          case 'tools/list':
            console.error("Handling tools/list request");
            sendResponse('tools/list', {
              tools: [{
                name: "test_tool",
                description: "A simple test tool",
                inputSchema: {
                  type: "object",
                  properties: {},
                  required: []
                }
              }]
            });
            break;
            
          case 'prompts/list':
            console.error("Handling prompts/list request");
            sendResponse('prompts/list', { prompts: [] });
            break;
            
          case 'resources/list':
            console.error("Handling resources/list request");
            sendResponse('resources/list', { resources: [] });
            break;
            
          case 'tools/call':
            console.error("Handling tools/call request");
            sendResponse('tools/call', {
              content: [{
                type: "text",
                text: "Test tool executed successfully!"
              }]
            });
            break;
            
          default:
            console.error("Unknown method:", request.method);
            sendResponse('unknown', null, {
              code: -32601,
              message: "Method not found"
            });
        }
      } catch (error) {
        console.error("Error parsing request:", error.message);
        console.error("Raw line:", line);
      }
    }
  }
});

process.stdin.on('end', () => {
  console.error("=== STDIN ENDED ===");
  process.exit(0);
});

process.stdin.on('error', (error) => {
  console.error("=== STDIN ERROR ===", error.message);
});

process.stdout.on('error', (error) => {
  console.error("=== STDOUT ERROR ===", error.message);
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error("=== UNCAUGHT EXCEPTION ===", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("=== UNHANDLED REJECTION ===", reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.error("=== SIGINT RECEIVED ===");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error("=== SIGTERM RECEIVED ===");
  process.exit(0);
});

console.error("=== SERVER READY, WAITING FOR REQUESTS ===");