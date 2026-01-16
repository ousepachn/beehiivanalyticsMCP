#!/usr/bin/env python3
"""
Beehiiv MCP Server for Analytics
Provides read-only access to Beehiiv API for publications, posts, and segments analytics.
"""

import asyncio
import json
import os
import signal
import sys
from typing import Any, Dict, List, Optional

import requests
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolResult,
    ListToolsResult,
    ListPromptsResult,
    ListResourcesResult,
    Tool,
    TextContent,
)
from mcp.server.lowlevel import NotificationOptions

# Initialize the MCP server
server = Server("beehiiv-analytics")


class BeehiivAPI:
    """Beehiiv API client for analytics operations."""

    def __init__(self, api_key: str):
        """Initialize with API key."""
        self.api_key = api_key
        self.base_url = "https://api.beehiiv.com/v2"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def _make_request(
        self, method: str, endpoint: str, params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make a request to the Beehiiv API with improved error handling."""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.request(
                method, url, headers=self.headers, params=params, timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            raise Exception("API request timed out. Please try again.")
        except requests.exceptions.ConnectionError:
            raise Exception(
                "Unable to connect to Beehiiv API. Please check your internet connection."
            )
        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                raise Exception("Invalid API key. Please check your BEEHIIV_API_KEY.")
            elif response.status_code == 403:
                raise Exception(
                    "API access forbidden. Please check your API key permissions."
                )
            elif response.status_code == 404:
                raise Exception("Resource not found.")
            elif response.status_code >= 500:
                raise Exception("Beehiiv API server error. Please try again later.")
            else:
                raise Exception(
                    f"API request failed with status {response.status_code}: {str(e)}"
                )
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")

    def get_publications(self) -> List[Dict[str, Any]]:
        """Get list of all publications."""
        data = self._make_request("GET", "/publications")
        return data.get("data", [])

    def get_publication_details(self, publication_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific publication."""
        data = self._make_request("GET", f"/publications/{publication_id}")
        return data.get("data", {})

    def list_posts(
        self,
        publication_id: str,
        limit: int = 10,
        page: int = 1,
        status: str = "all",
        audience: str = "all",
        platform: str = "all",
        order_by: str = "publish_date",
        direction: str = "desc",
        expand: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """List posts from a publication with various filters."""
        params = {
            "limit": min(limit, 100),  # API max is 100
            "page": page,
            "status": status,
            "audience": audience,
            "platform": platform,
            "order_by": order_by,
            "direction": direction,
        }

        # Handle expand parameter - Beehiiv API expects it as a list
        if expand:
            params["expand"] = expand

        data = self._make_request(
            "GET", f"/publications/{publication_id}/posts", params
        )

        # Client-side sorting as fallback to ensure proper date ordering
        posts = data.get("data", [])
        if posts and order_by in ["publish_date", "displayed_date", "created"]:
            # Sort posts to ensure proper ordering (newest first for desc, oldest first for asc)
            reverse_order = direction == "desc"

            # Use the appropriate date field
            date_field = order_by

            # Separate posts with and without dates
            posts_with_dates = [
                post for post in posts if post.get(date_field) is not None
            ]
            posts_without_dates = [
                post for post in posts if post.get(date_field) is None
            ]

            # Sort posts with dates
            if posts_with_dates:
                posts_with_dates.sort(
                    key=lambda x: x.get(date_field, 0), reverse=reverse_order
                )

            # Combine: posts with dates (sorted) first, then posts without dates
            if reverse_order:
                # For desc: newest first, so posts with dates come first
                sorted_posts = posts_with_dates + posts_without_dates
            else:
                # For asc: oldest first, so posts without dates come first
                sorted_posts = posts_without_dates + posts_with_dates

            # Update the data with sorted posts
            data["data"] = sorted_posts

        return data

    def get_post_details(
        self, publication_id: str, post_id: str, expand: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get detailed information about a specific post."""
        params = {}
        if expand:
            params["expand"] = expand

        data = self._make_request(
            "GET", f"/publications/{publication_id}/posts/{post_id}", params
        )
        return data.get("data", {})

    def get_posts_aggregate_stats(
        self,
        publication_id: str,
        status: str = "confirmed",
        audience: str = "all",
        platform: str = "all",
    ) -> Dict[str, Any]:
        """Get aggregate statistics for all posts in a publication."""
        params = {
            "status": status,
            "audience": audience,
            "platform": platform,
        }

        data = self._make_request(
            "GET", f"/publications/{publication_id}/posts/aggregate_stats", params
        )
        return data.get("data", {})

    def list_segments(self, publication_id: str) -> List[Dict[str, Any]]:
        """Get list of segments for a publication."""
        data = self._make_request("GET", f"/publications/{publication_id}/segments")
        return data.get("data", [])

    def get_segment_details(
        self, publication_id: str, segment_id: str
    ) -> Dict[str, Any]:
        """Get detailed information about a specific segment."""
        data = self._make_request(
            "GET", f"/publications/{publication_id}/segments/{segment_id}"
        )
        return data.get("data", {})


# Global API client instance
api_client: Optional[BeehiivAPI] = None


def get_api_client() -> BeehiivAPI:
    """Get or initialize the API client."""
    global api_client
    if api_client is None:
        api_key = os.getenv("BEEHIIV_API_KEY")
        if not api_key:
            raise Exception("BEEHIIV_API_KEY environment variable is required")
        api_client = BeehiivAPI(api_key)
    return api_client


@server.list_tools()
async def list_tools() -> ListToolsResult:
    """List available tools."""
    return ListToolsResult(
        tools=[
            Tool(
                name="list_publications",
                description="List all publications accessible with the API key",
                inputSchema={"type": "object", "properties": {}, "required": []},
            ),
            Tool(
                name="get_publication_details",
                description="Get detailed information about a specific publication",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "publication_id": {
                            "type": "string",
                            "description": "The publication ID (e.g., pub_00000000-0000-0000-0000-000000000000)",
                        }
                    },
                    "required": ["publication_id"],
                },
            ),
            Tool(
                name="list_posts",
                description="List posts from a publication with various filters",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "publication_id": {
                            "type": "string",
                            "description": "The publication ID",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Number of posts to return (1-100, default: 10)",
                            "minimum": 1,
                            "maximum": 100,
                            "default": 10,
                        },
                        "page": {
                            "type": "integer",
                            "description": "Page number for pagination (default: 1)",
                            "minimum": 1,
                            "default": 1,
                        },
                        "status": {
                            "type": "string",
                            "description": "Filter by post status",
                            "enum": ["draft", "confirmed", "archived", "all"],
                            "default": "all",
                        },
                        "audience": {
                            "type": "string",
                            "description": "Filter by audience type",
                            "enum": ["free", "premium", "all"],
                            "default": "all",
                        },
                        "platform": {
                            "type": "string",
                            "description": "Filter by platform",
                            "enum": ["web", "email", "both", "all"],
                            "default": "all",
                        },
                        "order_by": {
                            "type": "string",
                            "description": "Field to sort by. Use 'publish_date' or 'displayed_date' for most recent posts, 'created' for creation date",
                            "enum": ["created", "publish_date", "displayed_date"],
                            "default": "publish_date",
                        },
                        "direction": {
                            "type": "string",
                            "description": "Sort direction",
                            "enum": ["asc", "desc"],
                            "default": "desc",
                        },
                        "expand": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": [
                                    "stats",
                                    "free_web_content",
                                    "free_email_content",
                                    "free_rss_content",
                                    "premium_web_content",
                                    "premium_email_content",
                                ],
                            },
                            "description": "Additional data to include in response",
                        },
                    },
                    "required": ["publication_id"],
                },
            ),
            Tool(
                name="get_post_details",
                description="Get detailed information about a specific post",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "publication_id": {
                            "type": "string",
                            "description": "The publication ID",
                        },
                        "post_id": {
                            "type": "string",
                            "description": "The post ID (e.g., post_00000000-0000-0000-0000-000000000000)",
                        },
                        "expand": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": [
                                    "stats",
                                    "free_web_content",
                                    "free_email_content",
                                    "free_rss_content",
                                    "premium_web_content",
                                    "premium_email_content",
                                ],
                            },
                            "description": "Additional data to include in response",
                        },
                    },
                    "required": ["publication_id", "post_id"],
                },
            ),
            Tool(
                name="get_posts_summary_stats",
                description="Get aggregate statistics for all posts in a publication",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "publication_id": {
                            "type": "string",
                            "description": "The publication ID",
                        },
                        "status": {
                            "type": "string",
                            "description": "Filter by post status for stats",
                            "enum": ["draft", "confirmed", "archived", "all"],
                            "default": "confirmed",
                        },
                        "audience": {
                            "type": "string",
                            "description": "Filter by audience type for stats",
                            "enum": ["free", "premium", "all"],
                            "default": "all",
                        },
                        "platform": {
                            "type": "string",
                            "description": "Filter by platform for stats",
                            "enum": ["web", "email", "both", "all"],
                            "default": "all",
                        },
                    },
                    "required": ["publication_id"],
                },
            ),
            Tool(
                name="list_segments",
                description="List all segments for a publication",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "publication_id": {
                            "type": "string",
                            "description": "The publication ID",
                        }
                    },
                    "required": ["publication_id"],
                },
            ),
            Tool(
                name="get_segment_details",
                description="Get detailed information about a specific segment",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "publication_id": {
                            "type": "string",
                            "description": "The publication ID",
                        },
                        "segment_id": {
                            "type": "string",
                            "description": "The segment ID",
                        },
                    },
                    "required": ["publication_id", "segment_id"],
                },
            ),
        ]
    )


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
    """Handle tool calls."""
    try:
        client = get_api_client()

        if name == "list_publications":
            publications = client.get_publications()
            return CallToolResult(
                content=[
                    TextContent(type="text", text=json.dumps(publications, indent=2))
                ]
            )

        elif name == "get_publication_details":
            publication_id = arguments["publication_id"]
            details = client.get_publication_details(publication_id)
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(details, indent=2))]
            )

        elif name == "list_posts":
            publication_id = arguments["publication_id"]
            limit = arguments.get("limit", 10)
            page = arguments.get("page", 1)
            status = arguments.get("status", "all")
            audience = arguments.get("audience", "all")
            platform = arguments.get("platform", "all")
            order_by = arguments.get("order_by", "publish_date")
            direction = arguments.get("direction", "desc")
            expand = arguments.get("expand")

            result = client.list_posts(
                publication_id=publication_id,
                limit=limit,
                page=page,
                status=status,
                audience=audience,
                platform=platform,
                order_by=order_by,
                direction=direction,
                expand=expand,
            )
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2))]
            )

        elif name == "get_post_details":
            publication_id = arguments["publication_id"]
            post_id = arguments["post_id"]
            expand = arguments.get("expand")

            details = client.get_post_details(publication_id, post_id, expand)
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(details, indent=2))]
            )

        elif name == "get_posts_summary_stats":
            publication_id = arguments["publication_id"]
            status = arguments.get("status", "confirmed")
            audience = arguments.get("audience", "all")
            platform = arguments.get("platform", "all")

            stats = client.get_posts_aggregate_stats(
                publication_id=publication_id,
                status=status,
                audience=audience,
                platform=platform,
            )
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(stats, indent=2))]
            )

        elif name == "list_segments":
            publication_id = arguments["publication_id"]
            segments = client.list_segments(publication_id)
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(segments, indent=2))]
            )

        elif name == "get_segment_details":
            publication_id = arguments["publication_id"]
            segment_id = arguments["segment_id"]
            details = client.get_segment_details(publication_id, segment_id)
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(details, indent=2))]
            )

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"Error: {str(e)}")]
        )


@server.list_prompts()
async def handle_list_prompts() -> ListPromptsResult:
    """Handle list prompts request."""
    # This server doesn't provide prompts, return empty list
    return ListPromptsResult(prompts=[])


@server.list_resources()
async def handle_list_resources() -> ListResourcesResult:
    """Handle list resources request."""
    # This server doesn't provide resources, return empty list
    return ListResourcesResult(resources=[])


async def main():
    """Main server function with improved error handling."""
    try:
        # Set up signal handlers for graceful shutdown
        def signal_handler(signum, frame):
            print(
                f"Received signal {signum}, shutting down gracefully...",
                file=sys.stderr,
            )
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="beehiiv-analytics",
                    server_version="1.0.0",
                    capabilities=server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )
    except BrokenPipeError:
        # Handle broken pipe gracefully - this happens when client disconnects
        print("Client disconnected, shutting down gracefully", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"Server error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server interrupted by user", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)
