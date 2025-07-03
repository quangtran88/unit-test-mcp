#!/bin/bash

# Unit Test MCP Server Setup Script

echo "🚀 Setting up Unit Test MCP Server..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript files..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Get the absolute path of the project
PROJECT_PATH=$(pwd)
DIST_PATH="$PROJECT_PATH/dist/index.js"

echo ""
echo "📝 Configuration Instructions:"
echo "=============================="
echo ""
echo "1. Open Cursor IDE"
echo "2. Go to Settings (Cmd/Ctrl + ,)"
echo "3. Search for 'MCP' in settings"
echo "4. Look for 'MCP Servers' or 'Model Context Protocol'"
echo "5. Add the following JSON configuration:"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"unit-test-generator\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$DIST_PATH\"],"
echo "      \"env\": {}"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "OR copy this exact path for the args field:"
echo "  \"args\": [\"$DIST_PATH\"]"
echo ""
echo "6. Restart Cursor IDE"
echo "7. The unit test generator tools should now be available!"
echo ""
echo "🛠️  Available Tools:"
echo "- generate_unit_test: Generate unit tests for TypeScript/JavaScript files"
echo "- analyze_file_structure: Analyze file structure and dependencies"
echo "- validate_test_patterns: Validate existing test files against patterns"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "🎉 Setup complete! Happy testing!" 