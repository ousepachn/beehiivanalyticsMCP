# Testing the Beehiiv MCP Server

This guide covers multiple ways to test your MCP server.

## Prerequisites

1. **Set your API key:**
   ```bash
   export BEEHIIV_API_KEY="your_api_key_here"
   ```

2. **Activate virtual environment:**
   ```bash
    source venv/bin/activate
   ```

## Testing Methods

### 1. Quick Server Startup Test

Tests that the server can initialize and list all available tools:

```bash
python test_server_startup.py
```

**Expected output:**
- ✅ Server capabilities retrieved successfully
- ✅ Tools listed successfully: 7 tools available
- List of all 7 tools

### 2. Full Functionality Test

Tests all API endpoints and functionality:

```bash
python test_mcp_server.py
```

**Tests:**
- List publications
- Get publication details
- List posts
- Get post details
- Get aggregate statistics
- List segments
- Get segment details

### 3. Date Sorting Test

Specifically tests that posts are sorted correctly by date:

```bash
python test_date_sorting.py
```

**Tests:**
- Sort by `publish_date` (descending - newest first)
- Sort by `displayed_date` (descending - newest first)
- Sort by `created` (ascending - oldest first)

### 4. Original API Test

Tests the original API connectivity (from test_beehiiv_api.py):

```bash
python test_beehiiv_api.py
```

### 5. Example Usage

See example usage patterns:

```bash
python example_usage.py
```

## Testing with Claude Desktop

1. **Make sure your API key is set in the config:**
   - **macOS**: Check `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: Check `%APPDATA%\Claude\claude_desktop_config.json`
   - Ensure `BEEHIIV_API_KEY` is set in the `env` section

2. **Restart Claude Desktop** to load the MCP server

3. **Check the logs:**
   - **macOS**: 
     - MCP Server logs: `~/Library/Logs/Claude/mcp-server-beehiiv-analytics.log`
     - Main logs: `~/Library/Logs/Claude/main.log`
   - **Windows**: Check `%APPDATA%\Claude\Logs\`

4. **Test in Claude:**
   - Ask Claude to list your publications
   - Ask Claude to get recent posts
   - Ask Claude to get post statistics

## Manual Testing with Python

You can also test the API client directly:

```python
import os
from beehiiv_mcp_server import BeehiivAPI

# Set API key
api_key = os.getenv("BEEHIIV_API_KEY")
client = BeehiivAPI(api_key)

# Test getting publications
publications = client.get_publications()
print(f"Found {len(publications)} publications")

# Test listing posts (with date sorting)
if publications:
    pub_id = publications[0]["id"]
    posts = client.list_posts(
        publication_id=pub_id,
        limit=10,
        order_by="publish_date",  # Sort by publish date
        direction="desc"  # Newest first
    )
    print(f"Found {len(posts.get('data', []))} posts")
```

## Testing MCP Protocol Directly

If you want to test the MCP protocol directly, you can use the MCP Inspector or test with stdio:

```bash
# The server communicates via stdio, so you can test it manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python beehiiv_mcp_server.py
```

## Troubleshooting

### Server won't start
- Check that Python path is correct in `claude_desktop_config.json`
- Verify virtual environment has all dependencies: `pip install -r requirements.txt`
- Check logs for specific error messages

### API errors
- Verify your API key is correct
- Check that you have the necessary permissions
- Test API connectivity with `test_beehiiv_api.py`

### Date sorting issues
- Run `test_date_sorting.py` to verify sorting works
- Check that posts have `publish_date` or `displayed_date` fields
- Verify the `order_by` parameter is being passed correctly

## Quick Test Command

Run all tests at once:

```bash
echo "Running all tests..." && \
python test_server_startup.py && \
python test_mcp_server.py && \
python test_date_sorting.py && \
echo "✅ All tests passed!"
```
