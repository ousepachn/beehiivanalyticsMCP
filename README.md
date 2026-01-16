# Beehiiv MCP Server

A Model Context Protocol (MCP) server for Beehiiv analytics, providing read-only access to publications, posts, and segments data.

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

## Prerequisites

- Python 3.8 or higher
- A Beehiiv API key ([Get one here](https://developers.beehiiv.com/welcome/getting-started))
- An MCP-compatible client (e.g., Claude Desktop, Cursor)

## Installation

### 1. Clone or Download this Repository

```bash
git clone https://github.com/ousepachn/beehiivanalyticsMCP.git
cd beehiivanalyticsMCP
```

Or download and extract the ZIP file from GitHub.

### 2. Create a Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Your API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and add your Beehiiv API key:

```
BEEHIIV_API_KEY=your_api_key_here
```

**Important:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Configuration

### For Claude Desktop

1. Locate your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the following configuration (adjust paths as needed):

```json
{
  "mcpServers": {
    "beehiiv-analytics": {
      "command": "/absolute/path/to/venv/bin/python3",
      "args": ["/absolute/path/to/beehiiv_mcp_server.py"],
      "env": {
        "BEEHIIV_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Example for macOS:**
```json
{
  "mcpServers": {
    "beehiiv-analytics": {
      "command": "/Users/yourusername/beehiivMCP/venv/bin/python3",
      "args": ["/Users/yourusername/beehiivMCP/beehiiv_mcp_server.py"],
      "env": {
        "BEEHIIV_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

3. Restart Claude Desktop

### For Cursor IDE

1. Open Cursor settings
2. Navigate to MCP settings
3. Add the server configuration similar to Claude Desktop above

### Alternative: Using mcp_config.json

You can also use the included `mcp_config.json.example` file:

1. Copy the example file:
```bash
cp mcp_config.json.example mcp_config.json
```

2. Edit `mcp_config.json` and update the paths and API key

**Note:** The `mcp_config.json` file is gitignored by default to protect your API key.

## Testing

### Test API Connectivity

Run the test script to verify your API key works:

```bash
python test_beehiiv_api.py
```

### Test the MCP Server

Run the example usage script:

```bash
python example_usage.py
```

### Run All Tests

```bash
python test_all.py
```

## Available Tools

The server provides the following MCP tools:

- **`list_publications`** - List all publications accessible with your API key
- **`get_publication_details`** - Get detailed information about a specific publication
- **`list_posts`** - List posts with various filters (status, audience, platform, date sorting)
- **`get_post_details`** - Get detailed post information with optional content expansion
- **`get_posts_summary_stats`** - Get aggregate statistics for all posts in a publication
- **`list_segments`** - List all segments for a publication
- **`get_segment_details`** - Get detailed information about a specific segment

## Usage Examples

### Using with Claude Desktop

Once configured, you can ask Claude:

- "List all my publications"
- "Show me the 10 most recent posts from publication X"
- "What are the stats for my latest post?"
- "List all segments for publication Y"

### Programmatic Usage

See `example_usage.py` for a complete example of using the API client directly.

## Troubleshooting

### API Key Issues

- Make sure your API key is set correctly in the environment variable or config file
- Verify your API key is valid at the [Beehiiv Developer Portal](https://developers.beehiiv.com/welcome/getting-started)
- Check that your API key has the necessary permissions

### Path Issues

- Use absolute paths in your MCP configuration
- Ensure the Python path points to your virtual environment's Python
- Verify the server script path is correct

### Connection Issues

- Check your internet connection
- Verify the Beehiiv API is accessible
- Check firewall settings if applicable

## API Documentation

For detailed API information, refer to the official Beehiiv API documentation:

- [Getting Started](https://developers.beehiiv.com/welcome/getting-started)
- [Publications API](https://developers.beehiiv.com/api-reference/publications/index)
- [Posts API](https://developers.beehiiv.com/api-reference/posts/index)
- [Segments API](https://developers.beehiiv.com/api-reference/segments/index)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Beehiiv API Documentation](https://developers.beehiiv.com/)
3. Open an issue on GitHub

## Acknowledgments

- Built for the [Model Context Protocol](https://modelcontextprotocol.io/)
- Uses the [Beehiiv API](https://developers.beehiiv.com/)
