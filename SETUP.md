# Setup Guide

This guide will walk you through setting up the Beehiiv MCP Server step by step.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ousepachn/beehiivanalyticsMCP.git
   cd beehiivanalyticsMCP
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up your API key**
   ```bash
   cp .env.example .env
   # Then edit .env and add your API key
   ```

5. **Test the setup**
   ```bash
   python test_beehiiv_api.py
   ```

## Detailed Setup Instructions

### Step 1: Get Your Beehiiv API Key

1. Go to the [Beehiiv Developer Portal](https://developers.beehiiv.com/welcome/getting-started)
2. Sign in or create an account
3. Navigate to API settings
4. Generate a new API key
5. Copy the API key (you'll need it in the next step)

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` in a text editor and replace `your_api_key_here` with your actual API key:

```
BEEHIIV_API_KEY=your_actual_api_key_here
```

**Security Note:** The `.env` file is already in `.gitignore` and will not be committed to version control.

### Step 3: Configure Your MCP Client

#### For Claude Desktop

1. **Find your configuration file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Open the file** (create it if it doesn't exist)

3. **Add the server configuration:**

   Replace the paths with your actual paths:

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

   **macOS Example:**
   ```json
   {
     "mcpServers": {
       "beehiiv-analytics": {
         "command": "/Users/john/beehiivMCP/venv/bin/python3",
         "args": ["/Users/john/beehiivMCP/beehiiv_mcp_server.py"],
         "env": {
           "BEEHIIV_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

   **Windows Example:**
   ```json
   {
     "mcpServers": {
       "beehiiv-analytics": {
         "command": "C:\\Users\\John\\beehiivMCP\\venv\\Scripts\\python.exe",
         "args": ["C:\\Users\\John\\beehiivMCP\\beehiiv_mcp_server.py"],
         "env": {
           "BEEHIIV_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

#### For Cursor IDE

1. Open Cursor settings
2. Navigate to MCP or Extensions settings
3. Add the server configuration similar to Claude Desktop
4. Use absolute paths for both the command and args

### Step 4: Verify Installation

#### Test 1: API Connectivity

```bash
python test_beehiiv_api.py
```

This should output your publications if everything is configured correctly.

#### Test 2: Example Usage

```bash
python example_usage.py
```

This will run through various API operations and display the results.

#### Test 3: MCP Server

1. Start your MCP client (Claude Desktop, Cursor, etc.)
2. Try asking: "List all my publications"
3. If configured correctly, you should get a response with your publications

## Troubleshooting

### "BEEHIIV_API_KEY environment variable is required"

- Make sure you've created a `.env` file
- Verify the API key is set correctly in `.env`
- Check that you're loading the `.env` file (the example scripts do this automatically)

### "Invalid API key"

- Verify your API key is correct
- Check that you copied the entire key (no extra spaces)
- Ensure the key hasn't expired or been revoked

### "Module not found" errors

- Make sure you've activated your virtual environment
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check that you're using the correct Python interpreter

### MCP Server not connecting

- Verify the paths in your MCP configuration are absolute and correct
- Check that the Python path points to your virtual environment
- Ensure the server script path is correct
- Try running the server directly: `python beehiiv_mcp_server.py` (it should wait for input)

### Path issues on Windows

- Use forward slashes or escaped backslashes in JSON: `"C:\\Users\\..."` or `"C:/Users/..."`
- Make sure to use `python.exe` not just `python` in the command path

## Next Steps

Once everything is set up:

- Read the [README.md](README.md) for usage examples
- Check out [example_usage.py](example_usage.py) for programmatic usage
- Explore the available tools in the README

## Getting Help

If you're still having issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [Beehiiv API Documentation](https://developers.beehiiv.com/)
3. Open an issue on GitHub with:
   - Your operating system
   - Python version (`python --version`)
   - Error messages
   - Steps you've already tried
