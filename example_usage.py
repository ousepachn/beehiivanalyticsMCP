#!/usr/bin/env python3
"""
Example usage of the Beehiiv MCP Server
This shows how to use the server programmatically.
"""

import asyncio
import json
import os
from beehiiv_mcp_server import BeehiivAPI


async def example_usage():
    """Example of how to use the Beehiiv MCP Server."""

    # Initialize the API client
    api_key = os.getenv("BEEHIIV_API_KEY", "your_api_key_here")
    client = BeehiivAPI(api_key)

    print("🐝 Beehiiv MCP Server Example Usage")
    print("=" * 50)

    try:
        # 1. List all publications
        print("\n📚 Getting all publications...")
        publications = client.get_publications()
        print(f"Found {len(publications)} publications")

        if not publications:
            print("No publications found. Make sure your API key is valid.")
            return

        # Use the first publication for examples
        pub = publications[0]
        pub_id = pub["id"]
        print(f"Using publication: {pub['name']} (ID: {pub_id})")

        # 2. Get publication details
        print(f"\n📖 Getting details for publication {pub['name']}...")
        pub_details = client.get_publication_details(pub_id)
        print(f"Description: {pub_details.get('description', 'No description')}")
        print(f"Website: {pub_details.get('website_url', 'No website')}")

        # 3. List recent posts
        print(f"\n📝 Getting recent posts...")
        posts_result = client.list_posts(
            publication_id=pub_id,
            limit=5,
            status="confirmed",  # Only published posts
            order_by="publish_date",
            direction="desc",
        )
        posts = posts_result.get("data", [])
        print(f"Found {len(posts)} published posts")

        for i, post in enumerate(posts, 1):
            print(f"  {i}. {post.get('title', 'No title')}")
            print(
                f"     Status: {post.get('status')} | Audience: {post.get('audience')}"
            )
            print(f"     Published: {post.get('publish_date', 'Not published')}")

        # 4. Get detailed post information
        if posts:
            print(f"\n📊 Getting detailed information for first post...")
            first_post = posts[0]
            post_details = client.get_post_details(
                publication_id=pub_id,
                post_id=first_post["id"],
                expand=["stats"],  # Include statistics
            )
            print(f"Title: {post_details.get('title')}")
            print(f"Authors: {', '.join(post_details.get('authors', []))}")

            # Show statistics if available
            stats = post_details.get("stats", {})
            if stats:
                email_stats = stats.get("email", {})
                if email_stats:
                    print(f"Email Stats:")
                    print(f"  - Recipients: {email_stats.get('recipients', 0)}")
                    print(f"  - Opens: {email_stats.get('opens', 0)}")
                    print(f"  - Clicks: {email_stats.get('clicks', 0)}")

        # 5. Get aggregate statistics
        print(f"\n📈 Getting aggregate statistics...")
        aggregate_stats = client.get_posts_aggregate_stats(
            publication_id=pub_id, status="confirmed"
        )

        stats_data = aggregate_stats.get("stats", {})
        if stats_data:
            email_stats = stats_data.get("email", {})
            if email_stats:
                print(f"Overall Email Performance:")
                print(f"  - Total Recipients: {email_stats.get('recipients', 0)}")
                print(f"  - Total Opens: {email_stats.get('opens', 0)}")
                print(f"  - Open Rate: {email_stats.get('open_rate', 0):.1f}%")
                print(f"  - Total Clicks: {email_stats.get('clicks', 0)}")
                print(f"  - Click Rate: {email_stats.get('click_rate', 0):.1f}%")

        # 6. List segments
        print(f"\n👥 Getting segments...")
        segments = client.list_segments(pub_id)
        print(f"Found {len(segments)} segments")

        for segment in segments:
            print(f"  - {segment.get('name', 'Unnamed')} (ID: {segment.get('id')})")
            print(f"    Subscribers: {segment.get('subscriber_count', 'Unknown')}")

        # 7. Get segment details
        if segments:
            print(f"\n🔍 Getting details for first segment...")
            first_segment = segments[0]
            segment_details = client.get_segment_details(
                publication_id=pub_id, segment_id=first_segment["id"]
            )
            print(f"Name: {segment_details.get('name')}")
            print(
                f"Description: {segment_details.get('description', 'No description')}"
            )
            print(
                f"Subscriber Count: {segment_details.get('subscriber_count', 'Unknown')}"
            )

        print(f"\n✅ Example completed successfully!")
        print(f"\nTo use this as an MCP server, configure your MCP client with:")
        print(f"  Command: python")
        print(f'  Args: ["{os.path.abspath("beehiiv_mcp_server.py")}"]')
        print(f"  Environment: BEEHIIV_API_KEY=your_api_key_here")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("Make sure your API key is valid and you have access to the Beehiiv API.")


if __name__ == "__main__":
    asyncio.run(example_usage())
