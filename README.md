# Unit Test Generator MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/randytran/unit-test-mcp.svg)](https://github.com/randytran/unit-test-mcp/releases)

A sophisticated **Model Context Protocol (MCP)** server that intelligently generates comprehensive **Jest** unit tests for TypeScript/JavaScript files using advanced code analysis and custom testing patterns.

Perfect for use with **Cursor IDE** and other MCP-compatible editors to accelerate your testing workflow with AI-powered test generation.

## 🚀 Key Features

### 🧠 **Intelligent Code Analysis**

- **Dependency Flow Analysis**: Deep understanding of how dependencies interact
- **Method Complexity Detection**: Automatic complexity scoring and flow classification
- **Error Path Identification**: Smart detection of validation and error conditions
- **Business Logic Pattern Recognition**: CRUD, validation, and workflow pattern detection

### 🧪 **Advanced Test Generation**

- **Jest-Based Testing**: Modern test generation with full TypeScript support
- **Smart Mock Strategy**: Optimal mocking using Sinon with Jest integration
- **Comprehensive Scenarios**: Success paths, error cases, and edge conditions
- **Custom Rules Integration**: Follows your specific testing patterns and conventions

### 📊 **Comprehensive Analysis Tools**

- **File Structure Analysis**: Understanding of code organization and dependencies
- **Test Scenario Recommendations**: AI-generated suggestions for thorough coverage
- **Pattern Validation**: Ensures generated tests follow best practices
- **Priority-Based Testing**: Focus on the most important test cases first

## 📦 Installation

### Option 1: From GitHub (Recommended)

```bash
git clone https://github.com/randytran/unit-test-mcp.git
cd unit-test-mcp
chmod +x setup.sh  # Make setup script executable
./setup.sh          # Automated setup - installs, builds, and configures everything
```

**Or manual installation:**

```bash
npm install
npm run build
```

### Option 2: Download Release

Download the latest release from the [GitHub releases page](https://github.com/randytran/unit-test-mcp/releases) and follow the setup instructions.

## ⚙️ Configuration

### For Cursor IDE

Add to your Cursor settings (`.cursorrules` or MCP configuration):

```json
{
  "mcpServers": {
    "unit-test-generator": {
      "command": "node",
      "args": ["/path/to/unit-test-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**Replace `/path/to/unit-test-mcp/` with the actual path where you cloned the repository.**

### Quick Setup

**Option 1: Automated Setup (Recommended)**

```bash
./setup.sh
# This will install dependencies, build the project, and create mcp-config.json automatically
```

**Option 2: Manual Setup**

```bash
cp mcp-config.example.json mcp-config.json
# Edit mcp-config.json to update the path to your installation
```

## 🛠 Available Tools

### Core Tool: `generate_unit_test`

**One comprehensive tool that handles all unit testing needs** - analysis, generation, and validation.

### 🆕 Step-by-Step Generation Tools

**New guided workflow tools for method-by-method test creation:**

- **`list_methods`**: Analyze all methods with complexity and priority scoring
- **`plan_test_generation`**: Create structured test generation plans with session tracking
- **`get_next_method`**: Get intelligent recommendations for which method to test next
- **`generate_method_test`**: Generate tests for specific methods with progress tracking
- **`track_progress`**: Monitor completion status with visual progress indicators

👉 **See [STEP_BY_STEP_GUIDE.md](./STEP_BY_STEP_GUIDE.md) for detailed documentation.**

### Traditional Tool: `generate_unit_test`

**Parameters:**

- `filePath` (required): Path to the source file to analyze/generate tests for
- `mode` (optional): Operation mode - `"generate"` (default), `"analyze"`, or `"validate"`
- `methodName` (optional): Focus on specific method only
- `testType` (optional): Component type (service, repository, controller, model, utility)
- `outputPath` (optional): Custom output path for the test file
- `includeTestSuggestions` (optional): Include test scenarios in analysis (default: true)
- `validateGenerated` (optional): Validate generated tests automatically (default: false)

**Usage Modes:**

- **Generate Mode** (default): `mode: "generate"` - Creates comprehensive unit tests with analysis insights
- **Analyze Mode**: `mode: "analyze"` - Provides detailed code analysis and test recommendations only
- **Validate Mode**: `mode: "validate"` - Validates existing test files against patterns and best practices

## 💡 Quick Start

### Option 1: Traditional Full-File Generation

#### 1. Install and Configure

```bash
git clone https://github.com/randytran/unit-test-mcp.git
cd unit-test-mcp
npm install
npm run build
# Add to your MCP client configuration
```

#### 2. Generate Your First Test

```typescript
// In Cursor or your MCP client
@unit-test-generator generate_unit_test filePath="src/services/UserService.ts" testType="service"
```

#### 3. Analyze Code Patterns

```typescript
@unit-test-generator generate_unit_test filePath="src/services/PaymentService.ts" mode="analyze"
```

#### 4. Validate Existing Tests

```typescript
@unit-test-generator generate_unit_test filePath="src/services/UserService.test.ts" mode="validate"
```

### Option 2: Step-by-Step Generation (🆕 NEW!)

Perfect for complex services or when you want guided, method-by-method test creation:

#### 1. Explore Code Structure

```typescript
// Analyze methods with complexity and priority
@unit-test-generator list_methods filePath="src/services/UserService.ts" testType="service"
```

#### 2. Create Test Generation Plan

```typescript
// Get a structured plan with session ID for tracking
@unit-test-generator plan_test_generation filePath="src/services/UserService.ts" testType="service"
```

#### 3. Follow Guided Workflow

```typescript
// Get next recommended method to test
@unit-test-generator get_next_method sessionId="your-session-id"

// Generate test for specific method
@unit-test-generator generate_method_test sessionId="your-session-id" methodName="createUser"

// Track your progress
@unit-test-generator track_progress sessionId="your-session-id"
```

#### 4. Repeat Until Complete

The MCP server guides you through each method with intelligent prioritization and visual progress tracking!

👉 **See [STEP_BY_STEP_GUIDE.md](./STEP_BY_STEP_GUIDE.md) for comprehensive documentation on the new step-by-step features.**

## 📋 Testing Patterns & Rules

### Jest + Sinon Integration

- **Jest Framework**: Primary testing framework with TypeScript support
- **Sinon Sandbox**: `sandbox = createSandbox()` pattern in `beforeEach`
- **Type-Safe Mocking**: Uses `ts-sinon` `stubInterface<T>()` for interface mocking
- **Proper Assertions**: Uses `.args` for call verification instead of `.calledWith`

### Generated Test Structure

```typescript
import { createSandbox, SinonSandbox, SinonStubbedInstance } from "sinon";
import { stubInterface } from "ts-sinon";

describe("UserService", () => {
  let sandbox: SinonSandbox;
  let userService: UserService;
  let userRepositoryMock: SinonStubbedInstance<UserRepository>;

  beforeEach(() => {
    sandbox = createSandbox();
    userRepositoryMock = stubInterface<UserRepository>();
    userService = new UserService(userRepositoryMock);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#findUserById", () => {
    it("should return user when found", async () => {
      // Comprehensive test with proper mocking and assertions
    });
  });
});
```

### Key Patterns

- ✅ **Sinon Sandbox Pattern**: Clean test isolation
- ✅ **Type-Safe Mocking**: Uses `SinonStubbedInstance<T>` types
- ✅ **Factory Patterns**: Test data generation with `.extend()` customization
- ✅ **Error Testing**: Uses `catchPromise` utility for error scenarios
- ✅ **Assertion Best Practices**: Uses `.args` for call verification

## 🔧 Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **ts-morph**: TypeScript AST manipulation for code analysis
- **Jest & ts-jest**: Modern testing framework with TypeScript support
- **Sinon & ts-sinon**: Advanced mocking capabilities

## 📁 Project Structure

```
unit-test-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── test-generator.ts     # Core test generation logic
│   ├── advanced-analyzer.ts  # Deep pattern analysis
│   ├── file-analyzer.ts      # Code structure analysis
│   └── ...                   # Additional analysis modules
├── examples/                 # Example files and tests
├── dist/                     # Compiled JavaScript (gitignored)
└── README.md                 # This file
```

## 🎯 Use Cases

- **Accelerate TDD**: Generate test scaffolds to kickstart test-driven development
- **Legacy Code**: Add comprehensive test coverage to existing codebases
- **Code Reviews**: Ensure proper test patterns and coverage
- **Team Standards**: Enforce consistent testing patterns across teams
- **Learning**: Understand best practices through generated examples

## 🌟 Why Choose This MCP Server?

- **AI-Powered**: Leverages advanced code analysis for intelligent test generation
- **Battle-Tested**: Based on real-world testing patterns and best practices
- **Cursor-Optimized**: Designed specifically for seamless Cursor IDE integration
- **Extensible**: Easy to customize rules and patterns for your team
- **Modern Stack**: Uses latest Jest, TypeScript, and Sinon patterns

## 📚 Examples

Check out the `examples/` directory for sample services and their generated tests:

- `UserService.ts` - Service with dependency injection
- `EmailService.ts` - Service with external API calls
- `UserRepository.ts` - Repository pattern implementation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/randytran/unit-test-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor IDE](https://cursor.sh/)

---

**Happy Testing!** 🧪✨

_Made with ❤️ for the developer community_
