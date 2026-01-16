#!/usr/bin/env python3
"""
Quick all-in-one test script for the Beehiiv MCP Server.
Runs all tests and provides a summary.
"""

import os
import sys
import subprocess


def run_test(test_name, script_path):
    """Run a test script and return success status."""
    print(f"\n{'=' * 60}")
    print(f"Running: {test_name}")
    print(f"{'=' * 60}")

    try:
        result = subprocess.run(
            [sys.executable, script_path], capture_output=False, text=True, check=True
        )
        print(f"✅ {test_name} passed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {test_name} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"⚠️  {test_name} script not found: {script_path}")
        return False


def main():
    """Run all tests."""
    print("🐝 Beehiiv MCP Server - Comprehensive Test Suite")
    print("=" * 60)

    # Check for API key
    api_key = os.getenv("BEEHIIV_API_KEY")
    if not api_key:
        print("\n❌ BEEHIIV_API_KEY environment variable not set")
        print("Please set your API key:")
        print("  export BEEHIIV_API_KEY='your_api_key_here'")
        sys.exit(1)

    print(f"✅ API key found (length: {len(api_key)})")

    # List of tests to run
    tests = [
        ("Server Startup Test", "test_server_startup.py"),
        ("Full Functionality Test", "test_mcp_server.py"),
        ("Date Sorting Test", "test_date_sorting.py"),
    ]

    results = []

    # Run each test
    for test_name, script_path in tests:
        success = run_test(test_name, script_path)
        results.append((test_name, success))

    # Summary
    print(f"\n{'=' * 60}")
    print("Test Summary")
    print(f"{'=' * 60}")

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Your MCP server is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
