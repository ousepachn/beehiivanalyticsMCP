#!/usr/bin/env node

/**
 * Beehiiv MCP Server for Analytics
 * Provides read-only access to Beehiiv API for publications, posts, and segments analytics.
 * Self-contained version using only Node.js built-in modules.
 */

import { createServer } from "http";
import { spawn } from "child_process";

// Simple HTTP client using Node.js built-in fetch (Node 18+)
async function makeRequest(method, url, headers = {}, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error("Invalid API key. Please check your BEEHIIV_API_KEY.");
      } else if (status === 403) {
        throw new Error("API access forbidden. Please check your API key permissions.");
      } else if (status === 404) {
        throw new Error("Resource not found.");
      } else if (status >= 500) {
        throw new Error("Beehiiv API server error. Please try again later.");
      } else {
        throw new Error(`API request failed with status ${status}: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to Beehiiv API. Please check your internet connection.");
    }
    throw error;
  }
}

class BeehiivAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.beehiiv.com/v2";
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
    };
  }

  async getPublications() {
    const data = await makeRequest("GET", `${this.baseUrl}/publications`, this.headers);
    return data.data || [];
  }

  async getPublicationDetails(publicationId) {
    return await makeRequest("GET", `${this.baseUrl}/publications/${publicationId}`, this.headers);
  }

  async listPosts(publicationId, options = {}) {
    const params = new URLSearchParams({
      limit: (options.limit || 10).toString(),
      page: (options.page || 1).toString(),
      status: options.status || "all",
      audience: options.audience || "all",
      platform: options.platform || "all",
      order_by: options.order_by || "created",
      direction: options.direction || "desc",
    });

    if (options.expand) {
      params.append("expand", options.expand.join(","));
    }

    const url = `${this.baseUrl}/publications/${publicationId}/posts?${params}`;
    return await makeRequest("GET", url, this.headers);
  }

  async getPostDetails(publicationId, postId, expand = null) {
    let url = `${this.baseUrl}/publications/${publicationId}/posts/${postId}`;
    if (expand) {
      const params = new URLSearchParams({ expand: expand.join(",") });
      url += `?${params}`;
    }
    return await makeRequest("GET", url, this.headers);
  }

  async getPostsAggregateStats(publicationId, options = {}) {
    const params = new URLSearchParams({
      status: options.status || "confirmed",
      audience: options.audience || "all",
      platform: options.platform || "all",
    });
    const url = `${this.baseUrl}/publications/${publicationId}/posts/stats?${params}`;
    return await makeRequest("GET", url, this.headers);
  }

  async listSegments(publicationId) {
    const data = await makeRequest("GET", `${this.baseUrl}/publications/${publicationId}/segments`, this.headers);
    return data.data || [];
  }

  async getSegmentDetails(publicationId, segmentId) {
    return await makeRequest("GET", `${this.baseUrl}/publications/${publicationId}/segments/${segmentId}`, this.headers);
  }
}

// Get API key from environment
const apiKey = process.env.BEEHIIV_API_KEY;
if (!apiKey) {
  console.error("Error: BEEHIIV_API_KEY environment variable is required");
  process.exit(1);
}

const client = new BeehiivAPI(apiKey);

// Simple MCP protocol implementation
class SimpleMCPServer {
  constructor() {
    this.tools = [
      {
        name: "list_publications",
        description: "List all publications accessible with the API key",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_publication_details",
        description: "Get detailed information about a specific publication",
        inputSchema: {
          type: "object",
          properties: {
            publication_id: {
              type: "string",
              description: "The publication ID (e.g., pub_00000000-0000-0000-0000-000000000000)",
            },
          },
          required: ["publication_id"],
        },
      },
      {
        name: "list_posts",
        description: "List posts from a publication with various filters",
        inputSchema: {
          type: "object",
          properties: {
            publication_id: {
              type: "string",
              description: "The publication ID",
            },
            limit: {
              type: "integer",
              description: "Number of posts to return (1-100, default: 10)",
              minimum: 1,
              maximum: 100,
              default: 10,
            },
            page: {
              type: "integer",
              description: "Page number for pagination (default: 1)",
              minimum: 1,
              default: 1,
            },
            status: {
              type: "string",
              description: "Filter by post status",
              enum: ["draft", "confirmed", "archived", "all"],
              default: "all",
            },
            audience: {
              type: "string",
              description: "Filter by audience type",
              enum: ["free", "premium", "all"],
              default: "all",
            },
            platform: {
              type: "string",
              description: "Filter by platform",
              enum: ["web", "email", "both", "all"],
              default: "all",
            },
            order_by: {
              type: "string",
              description: "Field to sort by",
              enum: ["created", "publish_date", "displayed_date"],
              default: "created",
            },
            direction: {
              type: "string",
              description: "Sort direction",
              enum: ["asc", "desc"],
              default: "desc",
            },
            expand: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "stats",
                  "free_web_content",
                  "free_email_content",
                  "free_rss_content",
                  "premium_web_content",
                  "premium_email_content",
                ],
              },
              description: "Additional data to include in response",
            },
          },
          required: ["publication_id"],
        },
      },
      {
        name: "get_post_details",
        description: "Get detailed information about a specific post",
        inputSchema: {
          type: "object",
          properties: {
            publication_id: {
              type: "string",
              description: "The publication ID",
            },
            post_id: {
              type: "string",
              description: "The post ID (e.g., post_00000000-0000-0000-0000-000000000000)",
            },
            expand: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "stats",
                  "free_web_content",
                  "free_email_content",
                  "free_rss_content",
                  "premium_web_content",
                  "premium_email_content",
                ],
              },
              description: "Additional data to include in response",
            },
          },
          required: ["publication_id", "post_id"],
        },
      },
      {
        name: "get_posts_summary_stats",
        description: "Get aggregate statistics for all posts in a publication",
        inputSchema: {
          type: "object",
          properties: {
            publication_id: {
              type: "string",
              description: "The publication ID",
            },
            status: {
              type: "string",
              description: "Filter by post status for stats",
              enum: ["draft", "confirmed", "archived", "all"],
              default: "confirmed",
            },
            audience: {
              type: "string",
              description: "Filter by audience type for stats",
              enum: ["free", "premium", "all"],
              default: "all",
            },
            platform: {
              type: "string",
              description: "Filter by platform for stats",
              enum: ["web", "email", "both", "all"],
              default: "all",
            },
          },
          required: ["publication_id"],
        },
      },
      {
        name: "list_segments",
        description: "List all segments for a publication",
        inputSchema: {
          type: "object",
          properties: {
            publication_id: {
              type: "string",
              description: "The publication ID",
            },
          },
          required: ["publication_id"],
        },
      },
      {
        name: "get_segment_details",
        description: "Get detailed information about a specific segment",
        inputSchema: {
          type: "object",
          properties: {
            publication_id: {
              type: "string",
              description: "The publication ID",
            },
            segment_id: {
              type: "string",
              description: "The segment ID",
            },
          },
          required: ["publication_id", "segment_id"],
        },
      },
    ];
  }

  async handleRequest(request) {
    const { method, params, id } = request;

    try {
      switch (method) {
        case "initialize":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2025-06-18",
              capabilities: {
                tools: {},
                prompts: {},
                resources: {},
              },
              serverInfo: {
                name: "beehiiv-analytics",
                version: "1.0.0",
              },
            },
          };

        case "tools/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              tools: this.tools,
            },
          };

        case "prompts/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              prompts: [],
            },
          };

        case "resources/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              resources: [],
            },
          };

        case "tools/call":
          return await this.handleToolCall(params, id);

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: "Method not found",
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  async handleToolCall(params, id) {
    const { name, arguments: args } = params;

    try {
      let result;
      switch (name) {
        case "list_publications":
          result = await client.getPublications();
          break;

        case "get_publication_details":
          result = await client.getPublicationDetails(args.publication_id);
          break;

        case "list_posts":
          result = await client.listPosts(args.publication_id, {
            limit: args.limit,
            page: args.page,
            status: args.status,
            audience: args.audience,
            platform: args.platform,
            order_by: args.order_by,
            direction: args.direction,
            expand: args.expand,
          });
          break;

        case "get_post_details":
          result = await client.getPostDetails(args.publication_id, args.post_id, args.expand);
          break;

        case "get_posts_summary_stats":
          result = await client.getPostsAggregateStats(args.publication_id, {
            status: args.status,
            audience: args.audience,
            platform: args.platform,
          });
          break;

        case "list_segments":
          result = await client.listSegments(args.publication_id);
          break;

        case "get_segment_details":
          result = await client.getSegmentDetails(args.publication_id, args.segment_id);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        },
      };
    }
  }
}

// Start the server
async function main() {
  const server = new SimpleMCPServer();
  
  console.error("Beehiiv MCP server running on stdio");

  // Handle stdin/stdout for MCP protocol
  let buffer = "";
  
  process.stdin.on("data", async (chunk) => {
    buffer += chunk.toString();
    
    // Process complete JSON-RPC messages
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const request = JSON.parse(line);
          const response = await server.handleRequest(request);
          console.log(JSON.stringify(response));
        } catch (error) {
          console.error("Error processing request:", error);
        }
      }
    }
  });

  process.stdin.on("end", () => {
    process.exit(0);
  });
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});