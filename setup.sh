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

# Create MCP configuration file
echo "⚙️  Creating MCP configuration file..."
if [ -f "mcp-config.example.json" ]; then
    cp mcp-config.example.json mcp-config.json
    # Update the path in the config file (works on both macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|/path/to/unit-test-mcp/dist/index.js|$DIST_PATH|g" mcp-config.json
    else
        # Linux
        sed -i "s|/path/to/unit-test-mcp/dist/index.js|$DIST_PATH|g" mcp-config.json
    fi
    echo "✅ Created mcp-config.json with correct path!"
else
    echo "⚠️  mcp-config.example.json not found, skipping config file creation"
fi

echo ""
echo "📝 Configuration Instructions:"
echo "=============================="
echo ""
echo "✨ A ready-to-use configuration file has been created: mcp-config.json"
echo ""
echo "Option 1 - Use the generated config file:"
echo "1. Open Cursor IDE"
echo "2. Go to Settings (Cmd/Ctrl + ,)"
echo "3. Search for 'MCP' in settings"
echo "4. Look for 'MCP Servers' or 'Model Context Protocol'"
echo "5. Copy the contents from mcp-config.json and paste into your MCP configuration"
echo ""
echo "Option 2 - Manual configuration:"
echo "Add the following JSON configuration:"
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
echo "6. Restart Cursor IDE"
echo "7. The unit test generator tools should now be available!"
echo ""
echo "🛠️  Available Tools:"
echo "- generate_unit_test: Generate unit tests for TypeScript/JavaScript files"
echo "- analyze_file_structure: Analyze file structure and dependencies"
echo "- validate_test_patterns: Validate existing test files against patterns"
echo "- analyze_advanced_patterns: Deep code analysis with test recommendations"
echo ""
echo "📁 Files created:"
echo "- mcp-config.json (ready-to-use MCP configuration)"
echo "- dist/ (compiled JavaScript files)"
echo ""
echo "💡 Quick tip: You can view the generated config with:"
echo "   cat mcp-config.json"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "🎉 Setup complete! Happy testing!" 