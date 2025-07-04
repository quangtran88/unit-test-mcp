# Cursor + MCP Tools Workflow Guide

## ✅ How to Ensure Tools Always Run

### 1. Use Tool-First Prompts

Instead of: _"Generate a test for UserService.ts"_
Use: _"Analyze UserService.ts structure and patterns, then generate comprehensive unit tests"_

### 2. Explicit Tool Commands

- `@generate_unit_test UserService.ts mode="analyze"` - Deep pattern and structure analysis
- `@generate_unit_test UserService.ts` - Generate tests with analysis (default mode)
- `@generate_unit_test UserService.test.ts mode="validate"` - Validate test files

### 3. Multi-Step Workflow Prompts

```
"For UserService.ts:
1. Analyze patterns, structure, and dependencies with mode='analyze'
2. Generate comprehensive unit tests (default mode)
3. Validate with mode='validate'"
```

### 4. Analysis-First Language

Use phrases that trigger analysis:

- "Analyze and then generate..."
- "Study the patterns in X, then create tests..."
- "Examine the structure of X before building tests..."
- "Review X for dependencies and generate tests..."

## 🔧 Effective Tool Usage Patterns

### Sequential Analysis Pattern

```
@generate_unit_test services/EmailService.ts mode="analyze"
@generate_unit_test services/EmailService.ts testType="service"
@generate_unit_test services/EmailService.test.ts mode="validate"
```

### Batch Analysis Pattern

```
"Analyze and generate tests for all services:
- UserService.ts
- EmailService.ts
- PaymentService.ts

Use the analysis tools first for each file."
```

## 🎯 Tool-Guaranteed Prompts

These prompts will ALWAYS trigger tool usage:

1. **"Perform complete analysis and test generation for [file]"**
2. **"Use MCP tools to analyze [file] structure and generate tests"**
3. **"Run file analysis, pattern detection, and test generation workflow for [file]"**
4. **"Execute the full MCP toolchain on [file] for test creation"**

## ⚡ Quick Commands

Add these to your Cursor snippets:

- `tg-analyze`: `@generate_unit_test $1 mode="analyze"`
- `tg-full`: `@generate_unit_test $1 mode="analyze" && @generate_unit_test $1 testType="$2"`
- `tg-validate`: `@generate_unit_test $1 mode="validate"`

## 🚫 Avoid These Prompts

These might skip tools:

- "Write a test for X" (too direct)
- "Create unit tests" (no analysis trigger)
- "Generate test file" (manual approach)

## ✨ Pro Tips

1. **Always mention "analyze first"** in your prompts
2. **Use specific tool names** when you want guaranteed execution
3. **Chain commands** with && for sequential execution
4. **Reference patterns** to trigger advanced analysis
5. **Ask for validation** to complete the workflow
