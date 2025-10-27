#!/usr/bin/env node

/**
 * Beehiiv MCP Server - Minimal Working Version
 * Focus on getting the basic MCP protocol working first
 */

console.error("=== BEEHIIV MCP SERVER STARTING ===");
console.error("Node.js version:", process.version);
console.error("Platform:", process.platform);
console.error("Architecture:", process.arch);
console.error("API Key present:", !!process.env.BEEHIIV_API_KEY);

// Check API key
if (!process.env.BEEHIIV_API_KEY) {
  console.error("❌ BEEHIIV_API_KEY environment variable is required");
  process.exit(1);
}

console.error("✓ API key found, length:", process.env.BEEHIIV_API_KEY.length);

// Simple response function
function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  const jsonStr = JSON.stringify(response);
  console.error("Sending response:", jsonStr.substring(0, 100) + "...");
  console.log(jsonStr);
  
  // Force flush
  if (process.stdout.write) {
    process.stdout.write('\n');
  }
}

function sendNotification(method, params = {}) {
  const notification = {
    jsonrpc: "2.0",
    method: method,
    params: params
  };
  
  const jsonStr = JSON.stringify(notification);
  console.error("Sending notification:", jsonStr);
  console.log(jsonStr);
  
  // Force flush
  if (process.stdout.write) {
    process.stdout.write('\n');
  }
}

console.error("=== STARTING MCP PROTOCOL HANDLER ===");

let isInitialized = false;
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
            sendResponse(request.id, {
              protocolVersion: "2025-06-18",
              capabilities: {
                tools: {},
                prompts: {},
                resources: {}
              },
              serverInfo: {
                name: "beehiiv-mcp-server",
                version: "1.0.0"
              }
            });
            
            // Send initialized notification after a short delay
            setTimeout(() => {
              sendNotification("initialized");
              isInitialized = true;
              console.error("✓ Server initialized successfully");
            }, 50);
            break;
            
          case 'tools/list':
            console.error("Handling tools/list request");
            if (!isInitialized) {
              sendResponse(request.id, null, {
                code: -32002,
                message: "Server not initialized"
              });
              return;
            }
            
            sendResponse(request.id, {
              tools: [
                {
                  name: "get_publications",
                  description: "Get list of publications",
                  inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                  }
                },
                {
                  name: "get_publication_details",
                  description: "Get detailed information about a specific publication",
                  inputSchema: {
                    type: "object",
                    properties: {
                      publication_id: {
                        type: "string",
                        description: "The ID of the publication"
                      }
                    },
                    required: ["publication_id"]
                  }
                }
              ]
            });
            break;
            
          case 'prompts/list':
            console.error("Handling prompts/list request");
            if (!isInitialized) {
              sendResponse(request.id, null, {
                code: -32002,
                message: "Server not initialized"
              });
              return;
            }
            
            sendResponse(request.id, { prompts: [] });
            break;
            
          case 'resources/list':
            console.error("Handling resources/list request");
            if (!isInitialized) {
              sendResponse(request.id, null, {
                code: -32002,
                message: "Server not initialized"
              });
              return;
            }
            
            sendResponse(request.id, { resources: [] });
            break;
            
          case 'tools/call':
            console.error("Handling tools/call request");
            if (!isInitialized) {
              sendResponse(request.id, null, {
                code: -32002,
                message: "Server not initialized"
              });
              return;
            }
            
            const { name, arguments: args } = request.params;
            console.error(`Executing tool: ${name} with args:`, args);
            
            // Simple test response for now
            sendResponse(request.id, {
              content: [{
                type: "text",
                text: `Tool ${name} executed successfully! Args: ${JSON.stringify(args)}`
              }]
            });
            break;
            
          default:
            console.error("Unknown method:", request.method);
            sendResponse(request.id, null, {
              code: -32601,
              message: "Method not found"
            });
        }
      } catch (error) {
        console.error("Error parsing request:", error.message);
        console.error("Raw line:", line);
        console.error("Stack:", error.stack);
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