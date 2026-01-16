#!/usr/bin/env python3
"""
Test script to verify date sorting works correctly for posts.
"""

import os
import json
from beehiiv_mcp_server import BeehiivAPI


def test_date_sorting():
    """Test that posts are sorted correctly by date."""
    api_key = os.getenv("BEEHIIV_API_KEY")
    if not api_key:
        print("❌ BEEHIIV_API_KEY environment variable not set")
        return

    client = BeehiivAPI(api_key)

    # Get publications
    publications = client.get_publications()
    if not publications:
        print("❌ No publications found")
        return

    pub_id = publications[0]["id"]
    print(f"📰 Testing with publication: {publications[0]['name']}")

    # Test 1: Sort by publish_date (default, should be newest first)
    print("\n1. Testing sort by publish_date (desc - newest first):")
    result = client.list_posts(
        publication_id=pub_id, limit=5, order_by="publish_date", direction="desc"
    )
    posts = result.get("data", [])

    if posts:
        print(f"   Found {len(posts)} posts")
        print("   Dates (should be descending - newest first):")
        for i, post in enumerate(posts, 1):
            pub_date = post.get("publish_date", "No date")
            title = post.get("title", "No title")[:50]
            print(f"   {i}. {pub_date} - {title}")

        # Verify sorting
        dates = [p.get("publish_date") for p in posts if p.get("publish_date")]
        if dates:
            is_sorted = dates == sorted(dates, reverse=True)
            print(f"   ✅ Sorting correct: {is_sorted}")
            if not is_sorted:
                print(f"   ⚠️  Dates: {dates}")
    else:
        print("   ⚠️  No posts found")

    # Test 2: Sort by displayed_date
    print("\n2. Testing sort by displayed_date (desc - newest first):")
    result = client.list_posts(
        publication_id=pub_id, limit=5, order_by="displayed_date", direction="desc"
    )
    posts = result.get("data", [])

    if posts:
        print(f"   Found {len(posts)} posts")
        print("   Dates (should be descending - newest first):")
        for i, post in enumerate(posts, 1):
            disp_date = post.get("displayed_date", post.get("publish_date", "No date"))
            title = post.get("title", "No title")[:50]
            print(f"   {i}. {disp_date} - {title}")
    else:
        print("   ⚠️  No posts found")

    # Test 3: Sort by created (asc - oldest first)
    print("\n3. Testing sort by created (asc - oldest first):")
    result = client.list_posts(
        publication_id=pub_id, limit=5, order_by="created", direction="asc"
    )
    posts = result.get("data", [])

    if posts:
        print(f"   Found {len(posts)} posts")
        print("   Dates (should be ascending - oldest first):")
        for i, post in enumerate(posts, 1):
            created = post.get("created", "No date")
            title = post.get("title", "No title")[:50]
            print(f"   {i}. {created} - {title}")

        # Verify sorting
        dates = [p.get("created") for p in posts if p.get("created")]
        if dates:
            is_sorted = dates == sorted(dates, reverse=False)
            print(f"   ✅ Sorting correct: {is_sorted}")
    else:
        print("   ⚠️  No posts found")

    print("\n✅ Date sorting tests completed!")


if __name__ == "__main__":
    test_date_sorting()
