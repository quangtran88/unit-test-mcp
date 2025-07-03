# Contributing to Unit Test Generator MCP Server

Thank you for your interest in contributing to the Unit Test Generator MCP Server! We welcome contributions from the community and are grateful for your help in making this project better.

## 🌟 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests with bug fixes or new features
- **Documentation**: Improve documentation, examples, or guides
- **Testing**: Add test cases or improve test coverage
- **Community**: Help answer questions and support other users

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- TypeScript knowledge
- Basic understanding of MCP (Model Context Protocol)

### Setting Up Development Environment

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/unit-test-mcp.git
   cd unit-test-mcp
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Standards

- **TypeScript**: Use strict TypeScript with proper typing
- **ESLint**: Follow the configured ESLint rules
- **Formatting**: Use consistent formatting (Prettier recommended)
- **Comments**: Add meaningful comments for complex logic
- **Error Handling**: Implement proper error handling and validation

### Testing Requirements

- Write unit tests for new features
- Maintain or improve test coverage
- Test edge cases and error scenarios
- Follow the existing test patterns using Jest and Sinon

### Commit Guidelines

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(analyzer): add support for async method analysis
fix(generator): resolve issue with mock interface generation
docs(readme): update installation instructions
test(analyzer): add tests for complex dependency scenarios
```

## 🔧 Project Structure

```
src/
├── index.ts                    # MCP server entry point
├── test-generator.ts          # Core test generation logic
├── advanced-analyzer.ts       # Advanced code analysis
├── file-analyzer.ts           # File structure analysis
├── dependency-analyzer.ts     # Dependency analysis
├── error-path-analyzer.ts     # Error path detection
├── method-flow-analyzer.ts    # Method complexity analysis
├── business-logic-pattern-detector.ts  # Pattern detection
├── test-scenario-generator.ts # Test scenario generation
├── type-analyzer.ts           # TypeScript type analysis
└── path-resolver.ts           # Path resolution utilities
```

## 🐛 Reporting Issues

When reporting bugs, please include:

1. **Environment Information**

   - Operating System
   - Node.js version
   - Package version
   - MCP client (Cursor, etc.)

2. **Reproduction Steps**

   - Clear steps to reproduce the issue
   - Expected vs actual behavior
   - Sample code if applicable

3. **Additional Context**
   - Error messages or logs
   - Screenshots if relevant
   - Any workarounds you've found

## 💡 Feature Requests

For feature requests, please provide:

- **Problem Description**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Use Cases**: When would this be useful?
- **Alternatives**: Any alternative solutions considered?

## 🔄 Pull Request Process

### Before Submitting

1. **Create an Issue**: Discuss large changes in an issue first
2. **Branch Naming**: Use descriptive branch names (`feature/add-async-analysis`)
3. **Local Testing**: Ensure all tests pass locally
4. **Documentation**: Update documentation if needed

### PR Checklist

- [ ] Code follows project standards
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated if necessary
- [ ] Commit messages follow conventional format
- [ ] PR description clearly explains changes
- [ ] No breaking changes (or clearly documented)

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: Maintainers review code quality and design
3. **Testing**: Manual testing for complex changes
4. **Merge**: Approved PRs are merged by maintainers

## 🧪 Testing Guidelines

### Test Structure

Follow the existing patterns:

```typescript
describe("ComponentName", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#methodName", () => {
    it("should handle success case", () => {
      // Test implementation
    });

    it("should handle error case", () => {
      // Error test implementation
    });
  });
});
```

### Test Coverage

- Aim for high test coverage on new code
- Test both success and error paths
- Include edge cases and boundary conditions
- Mock external dependencies appropriately

## 📚 Areas for Contribution

### High Priority

- **Language Support**: Add support for more languages (Python, Java, etc.)
- **Framework Support**: Support for other testing frameworks
- **Advanced Patterns**: More sophisticated code analysis patterns
- **Performance**: Optimize analysis speed for large files

### Medium Priority

- **Configuration**: Customizable rules and patterns
- **Templates**: User-defined test templates
- **Integration**: Support for more MCP clients
- **Documentation**: More examples and guides

### Good First Issues

Look for issues labeled `good-first-issue` for beginner-friendly contributions:

- Documentation improvements
- Simple bug fixes
- Adding test cases
- Refactoring small components

## 🤝 Community Guidelines

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together to find the best solutions
- **Be Patient**: Maintainers are volunteers with limited time
- **Be Constructive**: Provide helpful feedback and suggestions

## 📞 Getting Help

- **GitHub Issues**: For bugs, features, and questions
- **Discussions**: For general questions and community support
- **Documentation**: Check README and example files first

## 🏆 Recognition

Contributors will be:

- Listed in the README contributors section
- Credited in release notes for significant contributions
- Invited to join the core team for outstanding contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Unit Test Generator MCP Server! 🎉
