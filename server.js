#!/usr/bin/env node

/**
 * Beehiiv MCP Server - Proper Implementation
 * Implements the Beehiiv API tools as declared in manifest.json
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

// HTTP request helper
function makeRequest(method, url, headers = {}) {
  return new Promise((resolve, reject) => {
    console.error(`Making ${method} request to:`, url);
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Beehiiv-MCP-Server/1.0.0',
        ...headers
      },
      timeout: 30000
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      console.error(`Response status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.error(`Response data length: ${data.length} bytes`);
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request error:`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error(`Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Beehiiv API client
class BeehiivAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.beehiiv.com/v2';
    this.headers = {
      'Authorization': `Bearer ${apiKey}`
    };
    console.error("✓ BeehiivAPI initialized");
  }

  async getPublications() {
    return await makeRequest('GET', `${this.baseUrl}/publications`, this.headers);
  }

  async getPublicationDetails(publicationId) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}`, this.headers);
  }

  async getPosts(publicationId, limit = 10) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}/posts?limit=${limit}`, this.headers);
  }

  async getPostDetails(publicationId, postId) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}/posts/${postId}`, this.headers);
  }

  async getSubscribers(publicationId, limit = 10) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}/subscribers?limit=${limit}`, this.headers);
  }

  async getSubscriberDetails(publicationId, subscriberId) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}/subscribers/${subscriberId}`, this.headers);
  }

  async getSegments(publicationId) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}/segments`, this.headers);
  }

  async getSegmentDetails(publicationId, segmentId) {
    return await makeRequest('GET', `${this.baseUrl}/publications/${publicationId}/segments/${segmentId}`, this.headers);
  }
}

// Get API key from environment
const apiKey = process.env.BEEHIIV_API_KEY;
if (!apiKey) {
  console.error("❌ BEEHIIV_API_KEY environment variable is required");
  process.exit(1);
}

const client = new BeehiivAPI(apiKey);

// MCP Server implementation
let requestId = 0;
let isInitialized = false;

function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: id,
    ...(error ? { error } : { result })
  };
  console.log(JSON.stringify(response));
  console.error(`Sent response ID ${id}:`, error ? 'ERROR' : 'SUCCESS');
}

function sendNotification(method, params = {}) {
  const notification = {
    jsonrpc: "2.0",
    method: method,
    params: params
  };
  console.log(JSON.stringify(notification));
  console.error(`Sent notification: ${method}`);
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
            if (isInitialized) {
              sendResponse(request.id, null, {
                code: -32002,
                message: "Server already initialized"
              });
              return;
            }
            
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
            
            // Handle tool execution asynchronously
            (async () => {
              try {
                let result;
                switch (name) {
                  case 'get_publications':
                    result = await client.getPublications();
                    break;
                  case 'get_publication_details':
                    result = await client.getPublicationDetails(args.publication_id);
                    break;
                  case 'get_posts':
                    result = await client.getPosts(args.publication_id, args.limit || 10);
                    break;
                  case 'get_post_details':
                    result = await client.getPostDetails(args.publication_id, args.post_id);
                    break;
                  case 'get_subscribers':
                    result = await client.getSubscribers(args.publication_id, args.limit || 10);
                    break;
                  case 'get_subscriber_details':
                    result = await client.getSubscriberDetails(args.publication_id, args.subscriber_id);
                    break;
                  case 'get_segments':
                    result = await client.getSegments(args.publication_id);
                    break;
                  case 'get_segment_details':
                    result = await client.getSegmentDetails(args.publication_id, args.segment_id);
                    break;
                  default:
                    throw new Error(`Unknown tool: ${name}`);
                }
                
                sendResponse(request.id, {
                  content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                  }]
                });
              } catch (error) {
                console.error(`Tool execution error:`, error.message);
                sendResponse(request.id, null, {
                  code: -32603,
                  message: `Tool execution failed: ${error.message}`
                });
              }
            })();
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
  console.error("Promise:", promise);
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