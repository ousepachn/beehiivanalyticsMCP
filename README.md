# Beehiiv MCP Server

A Model Context Protocol (MCP) server for Beehiiv analytics, providing read-only access to publications, posts, and segments data.

<a href="https://glama.ai/mcp/servers/@ousepachn/beehiivanalyticsMCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ousepachn/beehiivanalyticsMCP/badge" alt="Beehiiv Analytics Server MCP server" />
</a>

## Features

### Publications
- List all publications
- Get detailed publication information

### Posts
- List posts with filtering options (status, audience, platform, etc.)
- Get detailed post information with optional content expansion
- Get aggregate statistics for all posts in a publication

### Segments
- List all segments for a publication
- Get detailed segment information

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set your API key as an environment variable:
```bash
export BEEHIIV_API_KEY="your_api_key_here"
```

3. Update the MCP configuration file (`mcp_config.json`) with your API key and correct path to the server script.

## Usage

### As MCP Server

The server can be used with any MCP-compatible client. Update your MCP client configuration to include:

```json
{
  "mcpServers": {
    "beehiiv-analytics": {
      "command": "/path/to/venv/bin/python3",
      "args": ["/path/to/beehiiv_mcp_server.py"],
      "env": {
        "BEEHIIV_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Testing

Run the test script to verify API connectivity:
```bash
python test_beehiiv_api.py
```

## Available Tools

- `list_publications` - List all accessible publications
- `get_publication_details` - Get detailed publication information
- `list_posts` - List posts with various filters
- `get_post_details` - Get detailed post information
- `get_posts_summary_stats` - Get aggregate post statistics
- `list_segments` - List publication segments
- `get_segment_details` - Get detailed segment information

## API Key

Get your API key from the [beehiiv developer portal](https://developers.beehiiv.com/welcome/getting-started).

## API Documentation

- [Publications API](https://developers.beehiiv.com/api-reference/publications/index)
- [Posts API](https://developers.beehiiv.com/api-reference/posts/index)
- [Segments API](https://developers.beehiiv.com/api-reference/segments/index)