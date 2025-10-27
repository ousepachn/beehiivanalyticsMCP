#!/usr/bin/env python3
"""
Simple test script for beehiiv API connectivity.
Tests listing posts and getting post statistics.
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class BeehiivAPITester:
    """Simple tester for beehiiv API connectivity."""

    def __init__(self, api_key: str):
        """Initialize with API key."""
        self.api_key = api_key
        self.base_url = "https://api.beehiiv.com/v2"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def test_connection(self) -> bool:
        """Test basic API connection by getting publications."""
        try:
            response = requests.get(
                f"{self.base_url}/publications", headers=self.headers, timeout=10
            )
            response.raise_for_status()
            print("✅ API connection successful!")
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ API connection failed: {e}")
            return False

    def list_posts(
        self, publication_id: Optional[str] = None, limit: int = 10
    ) -> List[Dict]:
        """
        List posts from a publication, sorted by creation date (newest first).
        If publication_id is None, will use the first publication found.
        """
        try:
            # If no publication_id provided, get the first publication
            if not publication_id:
                publications = self.get_publications()
                if not publications:
                    print("❌ No publications found")
                    return []
                publication_id = publications[0]["id"]
                print(
                    f"📰 Using publication: {publications[0]['name']} (ID: {publication_id})"
                )

            # Get posts for the publication
            response = requests.get(
                f"{self.base_url}/publications/{publication_id}/posts",
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()

            posts_data = response.json()
            posts = posts_data.get("data", [])

            # Sort posts by publish date (newest first)
            # Use publish_date field specifically
            date_field = "publish_date"

            if posts and date_field in posts[0]:
                # Filter out posts without publish_date and sort by publish_date
                posts_with_dates = [post for post in posts if post.get(date_field)]
                posts_without_dates = [
                    post for post in posts if not post.get(date_field)
                ]

                # Sort posts with dates by publish_date (newest first)
                posts_with_dates.sort(key=lambda x: x.get(date_field, ""), reverse=True)

                # Combine: posts with dates first (sorted), then posts without dates
                posts = posts_with_dates + posts_without_dates

                print(
                    f"📅 Sorting by {date_field} - {len(posts_with_dates)} posts with dates, {len(posts_without_dates)} without"
                )
            else:
                print("⚠️  publish_date field not found, keeping original order")

            # Limit the number of posts shown
            limited_posts = posts[:limit]

            print(
                f"📝 Found {len(posts)} total posts, showing latest {len(limited_posts)}:"
            )
            for i, post in enumerate(limited_posts, 1):
                # Use publish_date field
                date_value = post.get("publish_date")

                # Format the date for better readability
                if date_value:
                    try:
                        # Check if it's a Unix timestamp (integer)
                        if isinstance(date_value, (int, float)):
                            dt = datetime.fromtimestamp(date_value)
                            formatted_date = dt.strftime("%Y-%m-%d %H:%M")
                        else:
                            # Try ISO format
                            dt = datetime.fromisoformat(
                                date_value.replace("Z", "+00:00")
                            )
                            formatted_date = dt.strftime("%Y-%m-%d %H:%M")
                    except:
                        formatted_date = str(date_value)
                else:
                    formatted_date = "Not published"

                print(
                    f"  {i}. {post.get('title', 'No title')} (ID: {post.get('id')}) - {formatted_date}"
                )

            return limited_posts

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to list posts: {e}")
            return []

    def get_aggregate_stats(
        self, publication_id: str, status: str = "confirmed"
    ) -> Optional[Dict]:
        """Get aggregate statistics for all posts in a publication."""
        try:
            endpoint = (
                f"{self.base_url}/publications/{publication_id}/posts/aggregate_stats"
            )
            params = {"status": status}

            print(f"🔍 Getting aggregate stats from: {endpoint}")
            print(f"📊 Filtering by status: {status}")

            response = requests.get(
                endpoint, headers=self.headers, params=params, timeout=10
            )
            response.raise_for_status()

            stats_data = response.json()
            stats = stats_data.get("data", {}).get("stats", {})

            print(f"📊 Aggregate Post Statistics (Status: {status}):")
            print("=" * 50)

            # Email stats
            email_stats = stats.get("email", {})
            if email_stats:
                print("📧 Email Performance:")
                print(f"  - Recipients: {email_stats.get('recipients', 0):,}")
                print(f"  - Delivered: {email_stats.get('delivered', 0):,}")
                print(f"  - Opens: {email_stats.get('opens', 0):,}")
                print(f"  - Unique Opens: {email_stats.get('unique_opens', 0):,}")
                print(f"  - Open Rate: {email_stats.get('open_rate', 0):.1f}%")
                print(f"  - Clicks: {email_stats.get('clicks', 0):,}")
                print(f"  - Unique Clicks: {email_stats.get('unique_clicks', 0):,}")
                print(f"  - Click Rate: {email_stats.get('click_rate', 0):.1f}%")
                print(f"  - Unsubscribes: {email_stats.get('unsubscribes', 0):,}")
                print(f"  - Spam Reports: {email_stats.get('spam_reports', 0):,}")

            # Web stats
            web_stats = stats.get("web", {})
            if web_stats:
                print("\n🌐 Web Performance:")
                print(f"  - Views: {web_stats.get('views', 0):,}")
                print(f"  - Clicks: {web_stats.get('clicks', 0):,}")

            # Click details
            clicks = stats.get("clicks", [])
            if clicks:
                print(f"\n🔗 Top Clicked Links ({len(clicks)} total):")
                for i, click in enumerate(clicks[:5], 1):  # Show top 5
                    url = click.get("url", "Unknown URL")
                    total_clicks = click.get("total_clicks", 0)
                    ctr = click.get("total_click_through_rate", 0)
                    print(f"  {i}. {url}")
                    print(f"     Total Clicks: {total_clicks:,} | CTR: {ctr:.1f}%")

            return stats

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to get aggregate stats: {e}")
            return None

    def get_individual_post_stats(
        self, post_id: str, publication_id: str
    ) -> Optional[Dict]:
        """Get detailed statistics for a specific individual post."""
        try:
            endpoint = f"{self.base_url}/publications/{publication_id}/posts/{post_id}"
            params = {"expand": ["stats"]}  # Request stats expansion

            print(f"🔍 Getting individual post stats from: {endpoint}")

            response = requests.get(
                endpoint, headers=self.headers, params=params, timeout=10
            )
            response.raise_for_status()

            post_data = response.json()
            post = post_data.get("data", {})
            stats = post.get("stats", {})

            print(f"📊 Individual Post Statistics:")
            print(f"📝 Post: '{post.get('title', 'Unknown')}'")
            print(f"🆔 ID: {post.get('id')}")
            print(f"📅 Status: {post.get('status')}")
            print(f"👥 Audience: {post.get('audience', 'N/A')}")
            print(f"🌐 Platform: {post.get('platform', 'N/A')}")
            print("=" * 50)

            # Email stats
            email_stats = stats.get("email", {})
            if email_stats:
                print("📧 Email Performance:")
                print(f"  - Recipients: {email_stats.get('recipients', 0):,}")
                print(f"  - Delivered: {email_stats.get('delivered', 0):,}")
                print(f"  - Opens: {email_stats.get('opens', 0):,}")
                print(f"  - Unique Opens: {email_stats.get('unique_opens', 0):,}")
                print(f"  - Clicks: {email_stats.get('clicks', 0):,}")
                print(f"  - Unique Clicks: {email_stats.get('unique_clicks', 0):,}")
                print(f"  - Unsubscribes: {email_stats.get('unsubscribes', 0):,}")
                print(f"  - Spam Reports: {email_stats.get('spam_reports', 0):,}")

            # Web stats
            web_stats = stats.get("web", {})
            if web_stats:
                print("\n🌐 Web Performance:")
                print(f"  - Views: {web_stats.get('views', 0):,}")
                print(f"  - Clicks: {web_stats.get('clicks', 0):,}")

            # Click details
            clicks = stats.get("clicks", [])
            if clicks:
                print(f"\n🔗 Clicked Links ({len(clicks)} total):")
                for i, click in enumerate(clicks[:3], 1):  # Show top 3
                    total_clicks = click.get("total_clicks", 0)
                    unique_clicks = click.get("total_unique_clicks", 0)
                    ctr = click.get("total_click_through_rate", 0)
                    print(
                        f"  {i}. Total Clicks: {total_clicks:,} | Unique: {unique_clicks:,} | CTR: {ctr:.1f}%"
                    )

            return post

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to get individual post stats: {e}")
            return None

    def get_publications(self) -> List[Dict]:
        """Get list of publications."""
        try:
            response = requests.get(
                f"{self.base_url}/publications", headers=self.headers, timeout=10
            )
            response.raise_for_status()

            publications_data = response.json()
            publications = publications_data.get("data", [])

            print(f"📚 Found {len(publications)} publications:")
            for pub in publications:
                print(f"  - {pub.get('name')} (ID: {pub.get('id')})")

            return publications

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to get publications: {e}")
            return []


def main():
    """Main test function."""
    print("🐝 Beehiiv API Connectivity Test")
    print("=" * 40)

    # Get API key from environment variable or user input
    api_key = os.getenv("BEEHIIV_API_KEY")
    if not api_key:
        api_key = input("Enter your beehiiv API key: ").strip()
        if not api_key:
            print("❌ No API key provided. Exiting.")
            return

    # Initialize tester
    tester = BeehiivAPITester(api_key)

    # Test 1: Basic connection
    print("\n1. Testing API connection...")
    if not tester.test_connection():
        return

    # Test 2: List publications
    print("\n2. Getting publications...")
    publications = tester.get_publications()
    if not publications:
        return

    # Test 3: List posts
    print("\n3. Listing posts...")
    posts = tester.list_posts()
    if not posts:
        print("No posts found to test statistics.")
        return

    # Test 4: Get aggregate post statistics
    print("\n4. Getting aggregate post statistics...")

    # Get publication ID for the API call
    publication_id = publications[0]["id"] if publications else None

    if publication_id:
        # Get stats for confirmed (published) posts
        tester.get_aggregate_stats(publication_id, status="confirmed")

        # Also get stats for all posts to compare
        print("\n" + "=" * 60)
        tester.get_aggregate_stats(publication_id, status="all")

        # Test 5: Get individual post statistics
        print("\n5. Getting individual post statistics...")
        print("=" * 60)

        # Find the first published post for individual stats
        published_post = None
        for post in posts:
            if post.get("publish_date") and post.get("status") == "confirmed":
                published_post = post
                break

        if published_post:
            post_id = published_post.get("id")
            print(f"📊 Getting stats for: '{published_post.get('title')}'")
            tester.get_individual_post_stats(post_id, publication_id)
        else:
            print("❌ No published posts found for individual statistics")
    else:
        print("❌ No publication ID found")

    print("\n✅ Test completed!")


if __name__ == "__main__":
    main()
