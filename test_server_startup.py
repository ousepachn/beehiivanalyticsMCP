#!/usr/bin/env python3
"""
Test script to verify the MCP server can start without errors.
"""

import asyncio
import sys
import os
from beehiiv_mcp_server import server
from mcp.server.lowlevel import NotificationOptions


async def test_server_startup():
    """Test that the server can initialize without errors."""
    try:
        print("Testing MCP server startup...")

        # Test that we can get capabilities without errors
        capabilities = server.get_capabilities(
            notification_options=NotificationOptions(), experimental_capabilities={}
        )
        print(f"✅ Server capabilities retrieved successfully")
        print(f"   - Tools capability: {capabilities.tools is not None}")

        # Test that we can list tools
        from beehiiv_mcp_server import list_tools

        tools_result = await list_tools()
        print(
            f"✅ Tools listed successfully: {len(tools_result.tools)} tools available"
        )

        for tool in tools_result.tools:
            print(f"   - {tool.name}: {tool.description}")

        print("\n✅ MCP server startup test passed!")
        return True

    except Exception as e:
        print(f"❌ MCP server startup test failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_server_startup())
    sys.exit(0 if success else 1)
