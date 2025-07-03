#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FileAnalysis, FileAnalyzer, FileStructure } from "./file-analyzer.js";
import { TestGenerator } from "./test-generator.js";

const server = new Server(
  {
    name: "unit-test-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize components
const fileAnalyzer = new FileAnalyzer();
const testGenerator = new TestGenerator();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_unit_test",
        description:
          "Generate a unit test file for a given source file following custom rules and patterns",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description:
                "Path to the source file to generate tests for. Absolute paths are strongly recommended for better reliability (e.g., /full/path/to/file.ts). Relative paths will be resolved from the current workspace.",
            },
            methodName: {
              type: "string",
              description:
                "Optional method name to generate tests for only that specific method. If not provided, tests will be generated for all public methods.",
            },
            testType: {
              type: "string",
              enum: ["service", "repository", "controller", "model", "utility"],
              description:
                "Type of component being tested (affects test structure and patterns)",
            },
            outputPath: {
              type: "string",
              description:
                "Optional custom output path for the test file. If not provided, will be generated automatically.",
            },
          },
          required: ["filePath"],
        },
      },
      {
        name: "analyze_file_structure",
        description:
          "Analyze a file to understand its structure, methods, and dependencies for test generation",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description:
                "Path to the file to analyze. Absolute paths are strongly recommended for better reliability (e.g., /full/path/to/file.ts). Relative paths will be resolved from the current workspace.",
            },
          },
          required: ["filePath"],
        },
      },
      {
        name: "validate_test_patterns",
        description:
          "Validate existing test files against the defined patterns and rules",
        inputSchema: {
          type: "object",
          properties: {
            testFilePath: {
              type: "string",
              description:
                "Path to the test file to validate. Absolute paths are strongly recommended for better reliability (e.g., /full/path/to/file.test.ts). Relative paths will be resolved from the current workspace.",
            },
          },
          required: ["testFilePath"],
        },
      },
      {
        name: "analyze_advanced_patterns",
        description:
          "Perform advanced analysis to identify complex patterns, dependencies, error paths, and generate comprehensive test scenarios",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description:
                "Path to the file to analyze in detail. Absolute paths are strongly recommended for better reliability (e.g., /full/path/to/file.ts). Relative paths will be resolved from the current workspace.",
            },
            methodName: {
              type: "string",
              description:
                "Optional method name to focus analysis on only that specific method. If not provided, all methods will be analyzed.",
            },
            includeTestSuggestions: {
              type: "boolean",
              default: true,
              description:
                "Include detailed test case suggestions and scenarios",
            },
          },
          required: ["filePath"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "generate_unit_test": {
          const { filePath, methodName, testType, outputPath } = args as {
            filePath: string;
            methodName?: string;
            testType?: string;
            outputPath?: string;
          };

          // Analyze the source file with advanced analysis
          const fileStructure = await fileAnalyzer.analyzeFile(
            filePath,
            methodName
          );

          // Generate enhanced test with detailed analysis
          let response = `# Generated Unit Test for ${filePath}`;
          if (methodName) {
            response += ` - Method: ${methodName}`;
          }
          response += `\n\n`;

          // Add advanced analysis insights if available
          if (fileStructure.advancedAnalysis) {
            response += `## 🔍 Advanced Analysis Insights\n\n`;
            response += fileAnalyzer.getDetailedAnalysis(fileStructure);
            response += `\n---\n\n`;
          }

          // Convert FileStructure to FileAnalysis format for test generation
          const analysis = convertToFileAnalysis(fileStructure);

          // Generate the test
          const testCode = testGenerator.generateTest(
            analysis,
            testType,
            methodName
          );

          // Determine output path
          const finalOutputPath =
            outputPath || testGenerator.getDefaultTestPath(filePath);

          response += `## 📝 Generated Test File\n\n`;
          response += `**Output path:** ${finalOutputPath}\n\n`;
          if (methodName) {
            response += `**Focused on method:** ${methodName}\n\n`;
          }
          response += `\`\`\`typescript\n${testCode}\n\`\`\``;

          return {
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          };
        }

        case "analyze_file_structure": {
          const { filePath } = args as { filePath: string };
          const analysis = await fileAnalyzer.analyzeFile(filePath);

          return {
            content: [
              {
                type: "text",
                text: `File analysis for ${filePath}:\n\n${JSON.stringify(
                  analysis,
                  null,
                  2
                )}`,
              },
            ],
          };
        }

        case "validate_test_patterns": {
          const { testFilePath } = args as { testFilePath: string };
          const validation = await testGenerator.validateTestFile(testFilePath);

          return {
            content: [
              {
                type: "text",
                text: `Test validation for ${testFilePath}:\n\n${JSON.stringify(
                  validation,
                  null,
                  2
                )}`,
              },
            ],
          };
        }

        case "analyze_advanced_patterns": {
          const {
            filePath,
            methodName,
            includeTestSuggestions = true,
          } = args as {
            filePath: string;
            methodName?: string;
            includeTestSuggestions?: boolean;
          };

          try {
            // Perform advanced analysis
            const fileStructure = await fileAnalyzer.analyzeFile(
              filePath,
              methodName
            );

            let response = `# 🔬 Advanced Pattern Analysis for ${filePath}`;
            if (methodName) {
              response += ` - Method: ${methodName}`;
            }
            response += `\n\n`;

            if (fileStructure.advancedAnalysis) {
              const analysis = fileStructure.advancedAnalysis;

              // Class Overview
              response += `## 📊 Class Overview\n`;
              response += `- **Class**: ${fileStructure.className}\n`;
              response += `- **Type**: ${
                fileStructure.isService
                  ? "Service"
                  : fileStructure.isRepository
                  ? "Repository"
                  : fileStructure.isController
                  ? "Controller"
                  : "Other"
              }\n`;
              response += `- **Dependencies**: ${analysis.dependencies.length}\n`;
              response += `- **Public Methods**: ${analysis.methods.length}\n\n`;

              // Dependency Analysis
              response += `## 🔗 Dependency Analysis\n`;
              analysis.dependencies.forEach((dep) => {
                response += `### ${dep.name} (${dep.type})\n`;
                response += `- **Mock Strategy**: ${dep.mockStrategy}\n`;
                response += `- **Common Methods**: ${
                  dep.commonMethods.join(", ") || "None detected"
                }\n`;
                response += `- **Usage Pattern**: ${
                  dep.usage.some((u) => u.isConditional)
                    ? "Conditional"
                    : "Direct"
                }\n`;
                response += `- **Error Handling**: ${
                  dep.usage.some((u) => u.errorHandling) ? "Yes" : "No"
                }\n\n`;
              });

              // Method Complexity Analysis
              response += `## ⚙️ Method Complexity Analysis\n`;
              analysis.methods.forEach((method) => {
                response += `### ${method.name}()\n`;
                response += `- **Complexity**: ${method.complexity} (${method.testComplexity}/10)\n`;
                response += `- **Flow Type**: ${method.flowType}\n`;
                response += `- **Error Paths**: ${method.errorPaths.length}\n`;
                response += `- **Side Effects**: ${
                  method.sideEffects.map((se) => se.type).join(", ") || "None"
                }\n`;
                response += `- **Dependencies Used**: ${
                  method.dependencyUsage.join(", ") || "None"
                }\n\n`;
              });

              // Business Logic Patterns
              if (analysis.businessLogicPatterns.length > 0) {
                response += `## 🧩 Business Logic Patterns\n`;
                analysis.businessLogicPatterns.forEach((pattern) => {
                  response += `### ${pattern.pattern.toUpperCase()} Pattern\n`;
                  response += `- **Methods**: ${pattern.methods.join(", ")}\n`;
                  response += `- **Test Strategy**: ${pattern.testStrategy}\n\n`;
                });
              }

              // Test Scenarios (if requested)
              if (includeTestSuggestions) {
                response += `## 🧪 Recommended Test Scenarios\n`;
                analysis.testScenarios.forEach((scenario) => {
                  response += `### ${scenario.methodName}()\n`;
                  scenario.scenarios.forEach((s) => {
                    response += `#### ${s.name} (Priority: ${s.priority}/5)\n`;
                    response += `- **Type**: ${s.type}\n`;
                    response += `- **Setup**: \n`;
                    s.setup.forEach((setup) => (response += `  - ${setup}\n`));
                    response += `- **Expectations**: \n`;
                    s.expectations.forEach(
                      (exp) => (response += `  - ${exp}\n`)
                    );
                    response += "\n";
                  });
                });
              }

              // Test Recommendations
              response += `## 💡 Test Generation Recommendations\n`;
              const totalComplexity = analysis.methods.reduce(
                (sum, m) => sum + m.testComplexity,
                0
              );
              const avgComplexity = totalComplexity / analysis.methods.length;

              response += `- **Average Test Complexity**: ${avgComplexity.toFixed(
                1
              )}/10\n`;
              response += `- **Total Test Scenarios**: ${analysis.testScenarios.reduce(
                (sum, ts) => sum + ts.scenarios.length,
                0
              )}\n`;
              response += `- **High Priority Tests**: ${analysis.testScenarios.reduce(
                (sum, ts) =>
                  sum + ts.scenarios.filter((s) => s.priority >= 4).length,
                0
              )}\n`;

              if (avgComplexity > 6) {
                response += `- **⚠️ Recommendation**: High complexity detected. Consider breaking down methods for better testability.\n`;
              }

              if (analysis.methods.some((m) => m.flowType === "error-prone")) {
                response += `- **⚠️ Recommendation**: Error-prone methods detected. Focus on error path testing.\n`;
              }

              if (
                analysis.dependencies.some((d) => d.mockStrategy === "fake")
              ) {
                response += `- **💡 Tip**: Consider using factory patterns for complex mock setups.\n`;
              }
            } else {
              response += `No advanced analysis available. Basic file structure:\n\n`;
              response += `- **Class**: ${fileStructure.className}\n`;
              response += `- **Methods**: ${fileStructure.methods
                .map(
                  (m) =>
                    `${m.name} (${
                      m.isPrivate
                        ? "private"
                        : m.isProtected
                        ? "protected"
                        : "public"
                    })`
                )
                .join(", ")}\n`;
              response += `- **Dependencies**: ${fileStructure.dependencies.length}\n`;
            }

            return {
              content: [
                {
                  type: "text",
                  text: response,
                },
              ],
            };
          } catch (analysisError) {
            return {
              content: [
                {
                  type: "text",
                  text: `Advanced analysis failed for ${filePath}:\n${
                    analysisError instanceof Error
                      ? analysisError.message
                      : String(analysisError)
                  }\n\nPlease check:\n- File path is correct\n- File contains a valid TypeScript class\n- File is accessible from current directory`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Helper function to convert FileStructure to FileAnalysis
function convertToFileAnalysis(fileStructure: FileStructure): FileAnalysis {
  // Use methods from FileStructure (which now includes access modifier info)
  // or from advancedAnalysis if more detailed analysis is available
  let methodAnalysis = fileStructure.methods.map((method) => ({
    name: method.name,
    isPublic: method.isPublic,
    isPrivate: method.isPrivate,
    isProtected: method.isProtected,
    isStatic: method.isStatic,
    isAsync: method.isAsync,
    parameters: method.parameters,
    decorators: method.decorators,
    returnType: method.returnType,
  }));

  // If we have advanced analysis with method details, use those instead
  if (
    fileStructure.advancedAnalysis &&
    fileStructure.advancedAnalysis.methods.length > 0
  ) {
    methodAnalysis = fileStructure.advancedAnalysis.methods.map((method) => ({
      name: method.name,
      isPublic: true,
      isPrivate: false,
      isProtected: false,
      isStatic: false,
      isAsync:
        method.flowType === "async-chain" || method.flowType === "error-prone",
      parameters: [],
      decorators: [],
      returnType: undefined,
    }));
  }

  return {
    filePath: fileStructure.filePath,
    fileName: fileStructure.filePath.split("/").pop() || "",
    className: fileStructure.className,
    methods: methodAnalysis,
    properties: [],
    imports: fileStructure.imports.map((imp) => ({
      source: imp,
      imports: [],
      isDefault: false,
      isNamespace: false,
    })),
    exports: [],
    dependencies: fileStructure.dependencies,
    fileType: fileStructure.isService
      ? "service"
      : fileStructure.isRepository
      ? "repository"
      : fileStructure.isController
      ? "controller"
      : "unknown",
    hasConstructor: fileStructure.dependencies.length > 0,
    constructorParams: fileStructure.dependencies.map((dep) => {
      const [name, type] = dep.split(": ");
      return {
        name: name || "param",
        type: type || "unknown",
        isOptional: false,
      };
    }),
  } as FileAnalysis;
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Unit Test Generator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
