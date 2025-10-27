#!/usr/bin/env node

console.error("=== SIMPLE TEST SERVER STARTING ===");

// Just send a simple response to any input
process.stdin.on('data', (chunk) => {
  const data = chunk.toString();
  console.error("Received:", data);
  
  try {
    const request = JSON.parse(data);
    console.error("Parsed request:", request.method);
    
    if (request.method === 'initialize') {
      const response = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: {
            tools: {},
            prompts: {},
            resources: {}
          },
          serverInfo: {
            name: "test-server",
            version: "1.0.0"
          }
        }
      };
      
      console.error("Sending initialize response");
      console.log(JSON.stringify(response));
      
      // Send initialized notification
      setTimeout(() => {
        const notification = {
          jsonrpc: "2.0",
          method: "initialized",
          params: {}
        };
        console.error("Sending initialized notification");
        console.log(JSON.stringify(notification));
      }, 100);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
});

process.stdin.on('end', () => {
  console.error("=== STDIN ENDED ===");
  process.exit(0);
});

console.error("=== SERVER READY ===");