# Unit Test Generation Rules

## 🚨 CRITICAL: Generate ONE METHOD AT A TIME + Write Code to Files

When generating unit tests, ALWAYS use STEP-BY-STEP approach (never generate all methods at once):

1. First analyze the file structure using `list_methods` tool
2. Run `plan_test_generation` for comprehensive planning
3. **Generate ONLY ONE method at a time** using `generate_method_test`
4. **IMMEDIATELY WRITE THE GENERATED CODE TO FILES** - Don't just show code in chat
5. Track progress with `track_progress` after every 2-3 methods
6. **Repeat steps 3-5 until ALL methods are complete**

## 🔄 DEFAULT BEHAVIOR: Step-by-Step (Not Bulk Generation)

- **NEVER** use `generate_unit_test` to create all tests at once
- **ALWAYS** use step-by-step tools for method-by-method generation
- Generate ONE method → Write to file → Get next method → Repeat

## Tool Priority

- ALWAYS use MCP tools before writing any test code manually
- Prefer tool-generated tests over manual test creation
- Use the step-by-step tools to understand complex patterns and dependencies
- Apply the project's custom test patterns and rules through the tools

## Workflow: ONE METHOD AT A TIME

```typescript
// PHASE 1: Setup (do once)
@unit-test-generator list_methods filePath="UserService.ts" testType="service"
@unit-test-generator plan_test_generation filePath="UserService.ts" testType="service"
// → Get session ID from plan response

// PHASE 2: Iterative (repeat for EACH method)
@unit-test-generator get_next_method sessionId="session-id"
// → Shows: "Next method: createUser"

@unit-test-generator generate_method_test sessionId="session-id" methodName="createUser"
// → Generate ONLY createUser test
// → Extract code from response
// → Write ONLY createUser test to UserService.test.ts

@unit-test-generator get_next_method sessionId="session-id"
// → Shows: "Next method: updateUser"

@unit-test-generator generate_method_test sessionId="session-id" methodName="updateUser"
// → Generate ONLY updateUser test
// → Write ONLY updateUser test to UserService.test.ts

// Continue until get_next_method says "All methods completed"
@unit-test-generator track_progress sessionId="session-id"
```

## ❌ NEVER DO THIS (Bulk Generation):

```typescript
// DON'T generate all methods at once
@unit-test-generator generate_unit_test filePath="UserService.ts" // ❌ WRONG
```

## Test Organization Rules

- Group setup variables logically (models first, repos second, services third)
- Create separate `beforeEach` in nested describe blocks for method-specific setup
- Don't stub protected/private methods - test through public interface
- Focus on testing method contracts and side effects, not implementation details

## Mocking Patterns

- Use Sinon sandbox pattern: `sandbox = createSandbox()` in beforeEach
- Use `ts-sinon` `stubInterface<T>()` for interface mocking
- Use `StubbedInstance<T>` type for all mocked dependencies
- Use factory pattern for creating test data with `.extend()` for customization

## Assertion Patterns

- Always use `.args` to assert call arguments instead of `.calledWith`
- Assert whole call arguments as arrays: `expect(methodStub.args).toEqual([[...], [...], ...])`
- Use `expect().toEqual()` for object/array comparisons, not `toBe()`
- Use `.notCalled` for checking methods weren't called

## 🎯 SUMMARY: What Cursor Should Do

**When user asks: "Generate tests for UserService.ts"**

✅ **CORRECT Approach:**

1. `list_methods` → analyze file
2. `plan_test_generation` → get session ID
3. `get_next_method` → get first method recommendation
4. `generate_method_test` → generate ONLY that one method
5. Write the generated code to test file
6. `get_next_method` → get next method recommendation
7. `generate_method_test` → generate ONLY that next method
8. Write to test file
9. Repeat until all methods done

❌ **WRONG Approach:**

- Using `generate_unit_test` to create all tests at once
- Generating multiple methods in a single call
- Showing code in chat without writing to files

When asked to generate tests, IMMEDIATELY start with `list_methods` tool analysis and follow step-by-step approach.
