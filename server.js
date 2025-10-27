#!/usr/bin/env node

console.error("=== BEEHIIV MCP SERVER STARTING ===");

let isInitialized = false;

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
  
  console.error("Sending response:", JSON.stringify(response).substring(0, 100) + "...");
  console.log(JSON.stringify(response));
}

function sendNotification(method, params = {}) {
  const notification = {
    jsonrpc: "2.0",
    method: method,
    params: params
  };
  
  console.error("Sending notification:", method);
  console.log(JSON.stringify(notification));
}

process.stdin.on('data', (chunk) => {
  const data = chunk.toString();
  console.error("Received:", data.substring(0, 100) + "...");
  
  try {
    const request = JSON.parse(data);
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
        
        // Send initialized notification
        setTimeout(() => {
          sendNotification("initialized");
          isInitialized = true;
          console.error("✓ Server initialized successfully");
        }, 100);
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
    console.error("Error:", error.message);
  }
});

process.stdin.on('end', () => {
  console.error("=== STDIN ENDED ===");
  process.exit(0);
});

console.error("=== SERVER READY ===");