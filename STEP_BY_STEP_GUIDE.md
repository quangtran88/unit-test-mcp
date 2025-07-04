# 🎯 Step-by-Step Unit Test Generation Guide

This guide explains how to use the new step-by-step unit test generation features that allow you to create tests method by method with guided workflow and progress tracking.

## 📋 Overview

The step-by-step approach breaks down unit test generation into manageable phases:

1. **Analysis**: Understand your code structure and complexity
2. **Planning**: Create a prioritized test generation plan
3. **Execution**: Generate tests method by method
4. **Tracking**: Monitor progress and get recommendations

## 🚀 Quick Start

### 1. List Methods in a File

Start by exploring what methods need testing:

```bash
# List all methods with complexity and priority analysis
list_methods --filePath="/path/to/UserService.ts" --testType="service"
```

**Output includes:**

- Method complexity scores (1-10)
- Priority levels (high/medium/low)
- Dependencies count
- Error path analysis
- Recommended testing order

### 2. Create a Test Generation Plan

Generate a structured plan for testing all methods:

```bash
# Create step-by-step plan
plan_test_generation --filePath="/path/to/UserService.ts" --testType="service"
```

**Plan includes:**

- Session ID for tracking
- Phased execution strategy
- Time estimates
- Method prioritization
- Quick start instructions

### 3. Execute Step-by-Step

Follow the guided workflow:

```bash
# Get next recommended method
get_next_method --sessionId="test-session-12345"

# Generate test for specific method
generate_method_test --sessionId="test-session-12345" --methodName="createUser"

# Track overall progress
track_progress --sessionId="test-session-12345"
```

## 🧪 Available Tools

### `list_methods`

**Purpose**: Analyze and list all methods in a file with testing metadata

**Parameters:**

- `filePath` (required): Path to source file
- `testType` (optional): Type of component (service/repository/controller/model/utility)

**Output:**

- Method overview table with complexity visualization
- Priority assignments based on complexity and dependencies
- Recommended testing order

### `plan_test_generation`

**Purpose**: Create a comprehensive test generation plan

**Parameters:**

- `filePath` (required): Path to source file
- `testType` (optional): Component type for optimized planning
- `outputPath` (optional): Custom test file output path

**Output:**

- Unique session ID for tracking
- Multi-phase execution plan
- Time estimates and methodology
- Next steps and quick start commands

### `track_progress`

**Purpose**: Monitor current test generation progress

**Parameters:**

- `sessionId` (required): Session ID from plan generation

**Output:**

- Overall completion percentage with progress bar
- Phase-by-phase progress breakdown
- Completed vs remaining methods
- Next recommended action

### `get_next_method`

**Purpose**: Get the next recommended method to test

**Parameters:**

- `sessionId` (required): Session ID from plan generation

**Output:**

- Method details (complexity, priority, dependencies)
- Specific guidance for the method
- Dependencies that need mocking
- Current progress context

### `generate_method_test`

**Purpose**: Generate unit test for a specific method

**Parameters:**

- `sessionId` (required): Session ID from plan generation
- `methodName` (required): Name of method to test
- `markCompleted` (optional, default: true): Mark method as completed

**Output:**

- Generated test code for the specific method
- Progress update after completion
- Next recommended method
- Integration guidance

## 📊 Planning Methodology

### Phase-Based Execution

**Phase 1: Critical Methods**

- High complexity methods (8-10)
- Core business logic
- Methods with high error potential
- Estimated: 8 minutes per method

**Phase 2: Core Methods**

- Medium complexity (4-7)
- Methods with dependencies
- Secondary business logic
- Estimated: 5 minutes per method

**Phase 3: Utility Methods**

- Low complexity (1-3)
- Simple helper functions
- Independent methods
- Estimated: 3 minutes per method

### Priority Assignment

- **High Priority**: Complex logic, many dependencies, error-prone
- **Medium Priority**: Moderate complexity, some dependencies
- **Low Priority**: Simple utilities, no dependencies

## 🎯 Best Practices

### 1. Start with Analysis

Always begin with `list_methods` to understand the scope:

```bash
list_methods --filePath="./src/services/PaymentService.ts"
```

### 2. Follow the Plan

Use `plan_test_generation` to get structured guidance:

```bash
plan_test_generation --filePath="./src/services/PaymentService.ts" --testType="service"
```

### 3. Work Method by Method

Follow the recommended order:

```bash
# Get next method
get_next_method --sessionId="your-session-id"

# Generate its test
generate_method_test --sessionId="your-session-id" --methodName="processPayment"
```

### 4. Track Progress Regularly

Monitor your progress to stay motivated:

```bash
track_progress --sessionId="your-session-id"
```

## 📈 Progress Tracking Features

### Visual Progress Indicators

- Progress bars: `[████████░░] 80%`
- Phase completion status: ✅ 🔄 ⏳
- Method completion counters

### Smart Recommendations

- Next method suggestions based on complexity
- Dependency-aware ordering
- Error-path prioritization

### Session Management

- Automatic session cleanup (1 hour timeout)
- Multiple concurrent sessions supported
- Session state persistence during active development

## 🔄 Example Workflow

Here's a complete example of generating tests for a service:

```bash
# 1. Explore the service
list_methods --filePath="./src/services/UserService.ts" --testType="service"

# 2. Create a plan
plan_test_generation --filePath="./src/services/UserService.ts" --testType="service"
# Returns: Session ID test-session-1645123456-abc123

# 3. Start testing (repeat for each method)
get_next_method --sessionId="test-session-1645123456-abc123"
# Recommends: createUser (complexity: 8, priority: high)

generate_method_test --sessionId="test-session-1645123456-abc123" --methodName="createUser"
# Generates test + shows progress: 1/5 methods (20%)

# 4. Continue with next method
get_next_method --sessionId="test-session-1645123456-abc123"
# Recommends: updateUser (complexity: 6, priority: medium)

generate_method_test --sessionId="test-session-1645123456-abc123" --methodName="updateUser"
# Progress: 2/5 methods (40%)

# 5. Check overall progress
track_progress --sessionId="test-session-1645123456-abc123"
# Shows detailed progress breakdown and phase completion

# 6. Continue until completion
# When all methods are tested, get_next_method returns completion message
```

## 🛠️ Integration with Cursor

### Recommended Usage in Cursor

1. **Start Planning Session**

   ```
   Use plan_test_generation to create a session and get session ID
   ```

2. **Iterative Development**

   ```
   Use get_next_method → generate_method_test cycle
   Copy generated test code to your test file
   Run tests to verify
   Repeat for next method
   ```

3. **Progress Monitoring**
   ```
   Use track_progress between methods to stay organized
   Review completed methods and remaining work
   ```

### Benefits for Cursor Users

- **Guided Workflow**: Never wonder which method to test next
- **Progress Tracking**: Visual feedback on completion status
- **Focused Generation**: Generate one method at a time for better review
- **Context Aware**: Each test generation considers the full class context
- **Incremental Development**: Build your test suite progressively

## 🎉 Advanced Features

### Custom Test Paths

```bash
plan_test_generation --filePath="./src/UserService.ts" --outputPath="./tests/user-service.test.ts"
```

### Non-Completion Mode

```bash
# Generate test without marking as completed (for review)
generate_method_test --sessionId="session-id" --methodName="methodName" --markCompleted=false
```

### Cross-Session Analysis

```bash
# List methods anytime for quick reference
list_methods --filePath="./src/UserService.ts"
```

## 🔧 Troubleshooting

### Session Not Found

- Sessions expire after 1 hour of inactivity
- Create a new plan if session expires
- Session IDs must be exact (copy from plan output)

### Method Not Found

- Ensure method name matches exactly
- Use list_methods to see available methods
- Check if method is public (private methods aren't tested)

### Complex Dependencies

- High-dependency methods are prioritized in Phase 2
- Use the dependency list from get_next_method for mock planning
- Consider breaking down overly complex methods

This step-by-step approach transforms overwhelming test generation into manageable, guided tasks that help you build comprehensive test suites systematically.
