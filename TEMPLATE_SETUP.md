# GitHub Template Repository Setup

This document explains how to set up this repository as a GitHub template that others can use.

## Making This a GitHub Template

1. **Push to GitHub**
   - Create a new repository on GitHub
   - Push this code to the repository

2. **Enable Template Repository**
   - Go to your repository settings on GitHub
   - Scroll to "Template repository" section
   - Check the box to enable it
   - Save changes

3. **Update Repository Information**
   - Update the README.md with your repository URL
   - Update manifest.json with your repository URL

## What's Included in This Template

### Core Files
- `beehiiv_mcp_server.py` - Main MCP server implementation
- `requirements.txt` - Python dependencies
- `README.md` - Comprehensive documentation
- `SETUP.md` - Detailed setup instructions
- `LICENSE` - MIT License

### Configuration Files
- `.env.example` - Environment variable template
- `mcp_config.json.example` - MCP configuration template
- `manifest.json` - MCP manifest (for package distribution)

### Documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `TESTING.md` - Testing guide
- `example_usage.py` - Usage examples

### Test Files
- `test_all.py` - Run all tests
- `test_beehiiv_api.py` - API connectivity test
- `test_mcp_server.py` - Full MCP server test
- `test_server_startup.py` - Server startup test
- `test_date_sorting.py` - Date sorting test

## Files Users Should Customize

When users create a repository from this template, they should:

1. **Update personal information:**
   - `manifest.json` - Author and repository URLs

2. **Set up their environment:**
   - Copy `.env.example` to `.env` and add their API key
   - Update `mcp_config.json` with their paths (or use the example)

3. **Update documentation:**
   - Replace `YOUR_USERNAME` in README.md with their GitHub username
   - Update repository URLs in README.md and manifest.json

## Template Variables

The following placeholders are used throughout the template:

- `YOUR_USERNAME` - GitHub username
- `your_api_key_here` - API key placeholder
- `/absolute/path/to/` - Path placeholder
- `Your Name` - Author name placeholder
- `your.email@example.com` - Email placeholder

## Best Practices for Template Users

1. **Never commit sensitive data:**
   - `.env` files are gitignored
   - `mcp_config.json` is gitignored (contains API keys)
   - Always use `.env.example` as a template

2. **Keep dependencies updated:**
   - Regularly update `requirements.txt`
   - Test with new MCP versions

3. **Document changes:**
   - Update README.md when adding features
   - Keep SETUP.md current with setup steps

## Repository Structure

```
beehiivMCP/
├── beehiiv_mcp_server.py      # Main server
├── requirements.txt            # Dependencies
├── README.md                   # Main documentation
├── SETUP.md                    # Setup guide
├── CONTRIBUTING.md             # Contribution guide
├── TESTING.md                  # Testing guide
├── LICENSE                     # MIT License
├── .env.example                # Environment template
├── mcp_config.json.example     # Config template
├── manifest.json               # MCP manifest
├── example_usage.py            # Usage examples
├── test_*.py                   # Test files
└── .gitignore                  # Git ignore rules
```

## Next Steps After Creating from Template

1. Clone the repository
2. Follow SETUP.md instructions
3. Configure your API key
4. Test the installation
5. Start using the MCP server!
