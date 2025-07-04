# Quick Start Guide

Get your Unit Test MCP Server running in 5 minutes!

## 1. Setup

Run the setup script:

```bash
./setup.sh
```

This will install dependencies and build the project.

## 2. Configure Cursor

1. Open Cursor IDE
2. Open Settings (Cmd/Ctrl + ,)
3. Search for "MCP" in settings
4. Add the configuration shown by the setup script
5. Restart Cursor

## 3. Test It Out

1. Open the example file: `examples/UserService.ts`
2. Use Cursor's command palette (Cmd/Ctrl + Shift + P)
3. Look for MCP tools or use the unit test generator
4. Run: **Generate Unit Test** with file path `examples/UserService.ts`

## 4. What You'll Get

The generator will create a comprehensive test file with:

- Proper Sinon sandbox setup
- Mocked dependencies using ts-sinon
- Test cases for all public methods
- Error testing scenarios
- Proper assertion patterns using `.args`

## Example Usage in Cursor

### Generate a Test

```
Tool: generate_unit_test
File Path: ./src/services/UserService.ts
Test Type: service
```

### Analyze Advanced Patterns

```
Tool: generate_unit_test
File Path: ./src/services/UserService.ts
Mode: analyze
```

### Validate Existing Tests

```
Tool: generate_unit_test
File Path: ./src/services/UserService.test.ts
Mode: validate
```

## Generated Test Structure

Your generated tests will follow this pattern:

```typescript
// Proper imports with testing utilities
import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import { createSandbox, SinonSandbox, StubbedInstance } from "sinon";

describe("UserService", () => {
  let sandbox: SinonSandbox;
  let userService: UserService;
  let userRepositoryMock: StubbedInstance<UserRepository>;

  beforeEach(() => {
    // Setup with sandbox pattern
    sandbox = createSandbox();
    userRepositoryMock = stubInterface<UserRepository>();
    userService = new UserService(userRepositoryMock);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#findUserById", () => {
    it("should return user", async () => {
      // Arrange, Act, Assert pattern
      // Uses .args for assertions
      expect(userRepositoryMock.findOne.args).toEqual([[{ id: "test-id" }]]);
    });
  });
});
```

## Custom Rules Applied

- ✅ Sinon sandbox pattern
- ✅ ts-sinon stubInterface for mocking
- ✅ Proper assertion patterns with `.args`
- ✅ Factory patterns for test data
- ✅ Error testing with catchPromise
- ✅ Logical test organization
- ✅ beforeEach/afterEach structure

## Need Help?

- Check the full [README.md](./README.md) for detailed documentation
- Look at the example files in `examples/`
- Ensure all dependencies are installed with `npm install`
- Verify the MCP configuration path is correct in Cursor settings

Happy testing! 🧪
