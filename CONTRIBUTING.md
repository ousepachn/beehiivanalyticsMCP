# Contributing to Beehiiv MCP Server

Thank you for your interest in contributing to the Beehiiv MCP Server! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (OS, Python version, etc.)
- Any relevant error messages or logs

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:

- A clear description of the feature
- Use cases and examples
- Any potential implementation ideas (optional)

### Submitting Code Changes

1. **Fork the repository**

2. **Create a branch for your changes**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Add tests if applicable

4. **Test your changes**
   ```bash
   # Run all tests
   python test_all.py
   
   # Test specific functionality
   python test_beehiiv_api.py
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Description of your changes"
   ```
   Use clear, descriptive commit messages.

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Wait for review and feedback

## Code Style Guidelines

### Python Code

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Keep functions focused and small
- Add docstrings to functions and classes
- Use meaningful variable names

### Documentation

- Update README.md if adding new features
- Add examples for new functionality
- Keep comments clear and concise

### Testing

- Add tests for new features
- Ensure all existing tests pass
- Test error cases as well as success cases

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/ousepachn/beehiivanalyticsMCP.git
   cd beehiivanalyticsMCP
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up your `.env` file (see SETUP.md)

5. Run tests to verify everything works:
   ```bash
   python test_all.py
   ```

## Areas for Contribution

- Additional API endpoints
- Improved error handling
- Better documentation
- Performance optimizations
- Additional test coverage
- UI/UX improvements for example scripts

## Questions?

If you have questions about contributing, feel free to:

- Open an issue with the "question" label
- Check existing issues and discussions

Thank you for contributing! 🎉
