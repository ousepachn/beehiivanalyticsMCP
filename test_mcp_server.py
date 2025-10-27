#!/usr/bin/env python3
"""
Test script for the Beehiiv MCP Server
Tests the server functionality without requiring a full MCP client.
"""

import asyncio
import json
import os
from beehiiv_mcp_server import BeehiivAPI


async def test_mcp_server():
    """Test the MCP server functionality."""
    print("🐝 Testing Beehiiv MCP Server")
    print("=" * 40)

    # Check for API key
    api_key = os.getenv("BEEHIIV_API_KEY")
    if not api_key:
        print("❌ BEEHIIV_API_KEY environment variable not set")
        print("Please set your API key: export BEEHIIV_API_KEY='your_key_here'")
        return

    try:
        # Initialize API client
        client = BeehiivAPI(api_key)
        print("✅ API client initialized")

        # Test 1: List publications
        print("\n1. Testing list_publications...")
        publications = client.get_publications()
        print(f"✅ Found {len(publications)} publications")
        for pub in publications[:2]:  # Show first 2
            print(f"   - {pub.get('name')} (ID: {pub.get('id')})")

        if not publications:
            print("❌ No publications found. Cannot continue testing.")
            return

        # Test 2: Get publication details
        print("\n2. Testing get_publication_details...")
        pub_id = publications[0]["id"]
        pub_details = client.get_publication_details(pub_id)
        print(f"✅ Retrieved details for: {pub_details.get('name', 'Unknown')}")

        # Test 3: List posts
        print("\n3. Testing list_posts...")
        posts_result = client.list_posts(pub_id, limit=5)
        posts = posts_result.get("data", [])
        print(f"✅ Found {len(posts)} posts")
        for post in posts[:2]:  # Show first 2
            print(
                f"   - {post.get('title', 'No title')} (Status: {post.get('status')})"
            )

        # Test 4: Get post details (if posts exist)
        if posts:
            print("\n4. Testing get_post_details...")
            post_id = posts[0]["id"]
            post_details = client.get_post_details(pub_id, post_id)
            print(f"✅ Retrieved details for: {post_details.get('title', 'Unknown')}")

        # Test 5: Get aggregate stats
        print("\n5. Testing get_posts_aggregate_stats...")
        stats = client.get_posts_aggregate_stats(pub_id, status="confirmed")
        if stats.get("stats"):
            print("✅ Retrieved aggregate statistics")
            email_stats = stats["stats"].get("email", {})
            if email_stats:
                print(f"   - Email recipients: {email_stats.get('recipients', 0)}")
                print(f"   - Email opens: {email_stats.get('opens', 0)}")
        else:
            print("⚠️  No statistics available (may be normal for new publications)")

        # Test 6: List segments
        print("\n6. Testing list_segments...")
        segments = client.list_segments(pub_id)
        print(f"✅ Found {len(segments)} segments")
        for segment in segments[:2]:  # Show first 2
            print(f"   - {segment.get('name', 'Unnamed')} (ID: {segment.get('id')})")

        # Test 7: Get segment details (if segments exist)
        if segments:
            print("\n7. Testing get_segment_details...")
            segment_id = segments[0]["id"]
            segment_details = client.get_segment_details(pub_id, segment_id)
            print(f"✅ Retrieved details for: {segment_details.get('name', 'Unknown')}")

        print("\n✅ All tests completed successfully!")
        print("\nThe MCP server is ready to use with any MCP-compatible client.")

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        print(
            "\nMake sure your API key is valid and you have access to the Beehiiv API."
        )


if __name__ == "__main__":
    asyncio.run(test_mcp_server())
