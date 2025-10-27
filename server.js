#!/usr/bin/env node

/**
 * Beehiiv MCP Server for Analytics
 * Provides read-only access to Beehiiv API for publications, posts, and segments analytics.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Initialize the MCP server
const server = new Server(
  {
    name: "beehiiv-analytics",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
);

class BeehiivAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.beehiiv.com/v2";
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async makeRequest(method, endpoint, params = null) {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await axios({
        method,
        url,
        headers: this.headers,
        params,
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        throw new Error("API request timed out. Please try again.");
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new Error("Unable to connect to Beehiiv API. Please check your internet connection.");
      } else if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error("Invalid API key. Please check your BEEHIIV_API_KEY.");
        } else if (status === 403) {
          throw new Error("API access forbidden. Please check your API key permissions.");
        } else if (status === 404) {
          throw new Error("Resource not found.");
        } else if (status >= 500) {
          throw new Error("Beehiiv API server error. Please try again later.");
        } else {
          throw new Error(`API request failed with status ${status}: ${error.message}`);
        }
      } else {
        throw new Error(`API request failed: ${error.message}`);
      }
    }
  }

  async getPublications() {
    const data = await this.makeRequest("GET", "/publications");
    return data.data || [];
  }

  async getPublicationDetails(publicationId) {
    return await this.makeRequest("GET", `/publications/${publicationId}`);
  }

  async listPosts(publicationId, options = {}) {
    const params = {
      limit: options.limit || 10,
      page: options.page || 1,
      status: options.status || "all",
      audience: options.audience || "all",
      platform: options.platform || "all",
      order_by: options.order_by || "created",
      direction: options.direction || "desc",
    };

    if (options.expand) {
      params.expand = options.expand.join(",");
    }

    return await this.makeRequest("GET", `/publications/${publicationId}/posts`, params);
  }

  async getPostDetails(publicationId, postId, expand = null) {
    const params = {};
    if (expand) {
      params.expand = expand.join(",");
    }
    return await this.makeRequest("GET", `/publications/${publicationId}/posts/${postId}`, params);
  }

  async getPostsAggregateStats(publicationId, options = {}) {
    const params = {
      status: options.status || "confirmed",
      audience: options.audience || "all",
      platform: options.platform || "all",
    };
    return await this.makeRequest("GET", `/publications/${publicationId}/posts/stats`, params);
  }

  async listSegments(publicationId) {
    const data = await this.makeRequest("GET", `/publications/${publicationId}/segments`);
    return data.data || [];
  }

  async getSegmentDetails(publicationId, segmentId) {
    return await this.makeRequest("GET", `/publications/${publicationId}/segments/${segmentId}`);
  }
}

// Get API key from environment
const apiKey = process.env.BEEHIIV_API_KEY;
if (!apiKey) {
  console.error("Error: BEEHIIV_API_KEY environment variable is required");
  process.exit(1);
}

const client = new BeehiivAPI(apiKey);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
    ],
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_publications": {
        const publications = await client.getPublications();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(publications, null, 2),
            },
          ],
        };
      }

      case "get_publication_details": {
        const { publication_id } = args;
        const details = await client.getPublicationDetails(publication_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(details, null, 2),
            },
          ],
        };
      }

      case "list_posts": {
        const {
          publication_id,
          limit,
          page,
          status,
          audience,
          platform,
          order_by,
          direction,
          expand,
        } = args;
        const posts = await client.listPosts(publication_id, {
          limit,
          page,
          status,
          audience,
          platform,
          order_by,
          direction,
          expand,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(posts, null, 2),
            },
          ],
        };
      }

      case "get_post_details": {
        const { publication_id, post_id, expand } = args;
        const details = await client.getPostDetails(publication_id, post_id, expand);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(details, null, 2),
            },
          ],
        };
      }

      case "get_posts_summary_stats": {
        const { publication_id, status, audience, platform } = args;
        const stats = await client.getPostsAggregateStats(publication_id, {
          status,
          audience,
          platform,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "list_segments": {
        const { publication_id } = args;
        const segments = await client.listSegments(publication_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(segments, null, 2),
            },
          ],
        };
      }

      case "get_segment_details": {
        const { publication_id, segment_id } = args;
        const details = await client.getSegmentDetails(publication_id, segment_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(details, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// List prompts handler
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [],
  };
});

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Beehiiv MCP server running on stdio");
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

// Handle uncaught exceptions
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
