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
        break;
        
      case 'notifications/initialized':
        console.error("Handling notifications/initialized - marking server as initialized");
        // Mark server as initialized immediately
        isInitialized = true;
        // Send our initialized notification immediately
        sendNotification("initialized");
        console.error("✓ Server initialized successfully");
        // Don't send a response - notifications don't get responses
        return;
        
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
            },
            {
              name: "get_posts",
              description: "Get posts for a publication",
              inputSchema: {
                type: "object",
                properties: {
                  publication_id: {
                    type: "string",
                    description: "The ID of the publication"
                  },
                  limit: {
                    type: "number",
                    description: "Number of posts to return (default: 10)",
                    default: 10
                  }
                },
                required: ["publication_id"]
              }
            },
            {
              name: "get_post_details",
              description: "Get detailed information about a specific post",
              inputSchema: {
                type: "object",
                properties: {
                  publication_id: {
                    type: "string",
                    description: "The ID of the publication"
                  },
                  post_id: {
                    type: "string",
                    description: "The ID of the post"
                  }
                },
                required: ["publication_id", "post_id"]
              }
            },
            {
              name: "get_subscribers",
              description: "Get subscribers for a publication",
              inputSchema: {
                type: "object",
                properties: {
                  publication_id: {
                    type: "string",
                    description: "The ID of the publication"
                  },
                  limit: {
                    type: "number",
                    description: "Number of subscribers to return (default: 10)",
                    default: 10
                  }
                },
                required: ["publication_id"]
              }
            },
            {
              name: "get_subscriber_details",
              description: "Get detailed information about a specific subscriber",
              inputSchema: {
                type: "object",
                properties: {
                  publication_id: {
                    type: "string",
                    description: "The ID of the publication"
                  },
                  subscriber_id: {
                    type: "string",
                    description: "The ID of the subscriber"
                  }
                },
                required: ["publication_id", "subscriber_id"]
              }
            },
            {
              name: "get_segments",
              description: "Get segments for a publication",
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
            },
            {
              name: "get_segment_details",
              description: "Get detailed information about a specific segment",
              inputSchema: {
                type: "object",
                properties: {
                  publication_id: {
                    type: "string",
                    description: "The ID of the publication"
                  },
                  segment_id: {
                    type: "string",
                    description: "The ID of the segment"
                  }
                },
                required: ["publication_id", "segment_id"]
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
        
        // Handle all 8 tools with test responses
        let result;
        switch (name) {
          case 'get_publications':
            result = `Publications list: [Test publication data would be returned here]`;
            break;
          case 'get_publication_details':
            result = `Publication details for ID ${args.publication_id}: [Detailed publication info would be returned here]`;
            break;
          case 'get_posts':
            result = `Posts for publication ${args.publication_id} (limit: ${args.limit || 10}): [Posts data would be returned here]`;
            break;
          case 'get_post_details':
            result = `Post details for publication ${args.publication_id}, post ${args.post_id}: [Detailed post info would be returned here]`;
            break;
          case 'get_subscribers':
            result = `Subscribers for publication ${args.publication_id} (limit: ${args.limit || 10}): [Subscribers data would be returned here]`;
            break;
          case 'get_subscriber_details':
            result = `Subscriber details for publication ${args.publication_id}, subscriber ${args.subscriber_id}: [Detailed subscriber info would be returned here]`;
            break;
          case 'get_segments':
            result = `Segments for publication ${args.publication_id}: [Segments data would be returned here]`;
            break;
          case 'get_segment_details':
            result = `Segment details for publication ${args.publication_id}, segment ${args.segment_id}: [Detailed segment info would be returned here]`;
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        sendResponse(request.id, {
          content: [{
            type: "text",
            text: result
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