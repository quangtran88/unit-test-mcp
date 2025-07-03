import { MethodFlowAnalysis } from "./method-flow-analyzer.js";

export interface BusinessLogicPattern {
  pattern: "crud" | "validation" | "transformation" | "workflow";
  methods: string[];
  testStrategy: string;
}

export class BusinessLogicPatternDetector {
  detectBusinessLogicPatterns(
    methods: MethodFlowAnalysis[]
  ): BusinessLogicPattern[] {
    const patterns: BusinessLogicPattern[] = [];

    const crudMethods = methods.filter((m) =>
      /^(create|read|update|delete|find|get|save|remove)/.test(m.name)
    );
    if (crudMethods.length >= 2) {
      patterns.push({
        pattern: "crud",
        methods: crudMethods.map((m) => m.name),
        testStrategy:
          "Test each CRUD operation with success and error scenarios",
      });
    }

    const validationMethods = methods.filter((m) =>
      m.errorPaths.some((ep) => ep.errorType === "ValidationError")
    );
    if (validationMethods.length > 0) {
      patterns.push({
        pattern: "validation",
        methods: validationMethods.map((m) => m.name),
        testStrategy: "Test valid and invalid inputs, boundary conditions",
      });
    }

    const transformationMethods = methods.filter((m) =>
      /^(transform|convert|map|parse|format)/.test(m.name)
    );
    if (transformationMethods.length > 0) {
      patterns.push({
        pattern: "transformation",
        methods: transformationMethods.map((m) => m.name),
        testStrategy: "Test input-output transformations with edge cases",
      });
    }

    const workflowMethods = methods.filter(
      (m) => m.flowType === "async-chain" || m.dependencyUsage.length > 2
    );
    if (workflowMethods.length > 0) {
      patterns.push({
        pattern: "workflow",
        methods: workflowMethods.map((m) => m.name),
        testStrategy: "Test workflow steps and failure scenarios",
      });
    }

    return patterns;
  }
}
