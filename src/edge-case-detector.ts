import { MethodDeclaration } from "ts-morph";
import { TypeAnalyzer } from "./type-analyzer.js";

export interface EdgeCaseInfo {
  type:
    | "empty-array"
    | "null-input"
    | "undefined-input"
    | "empty-string"
    | "long-string"
    | "zero-number"
    | "negative-number"
    | "boundary-number"
    | "empty-object"
    | "large-array"
    | "special-chars"
    | "type-coercion"
    | "async-timeout"
    | "async-race-condition"
    | "promise-rejection"
    | "date-invalid"
    | "date-boundary"
    | "regex-dos"
    | "memory-exhaustion"
    | "circular-reference"
    | "nan-infinity"
    | "precision-loss"
    | "sql-injection"
    | "xss-payload"
    | "path-traversal"
    | "buffer-overflow"
    | "concurrent-modification"
    | "deadlock-scenario"
    | "duplicate-creation"
    | "cascade-delete";
  parameterName: string;
  parameterType: string;
  description: string;
  testValue: string;
  expectedBehavior:
    | "error"
    | "graceful"
    | "empty-result"
    | "timeout"
    | "security-block";
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "input-validation"
    | "type-safety"
    | "concurrency"
    | "security"
    | "performance"
    | "business-logic";
}

export interface AsyncEdgeCaseInfo extends EdgeCaseInfo {
  asyncType:
    | "timeout"
    | "race-condition"
    | "promise-chain"
    | "concurrent-access"
    | "deadlock"
    | "memory-leak";
  dependencies: string[];
  timeoutMs?: number;
  concurrencyLevel?: number;
}

export class EdgeCaseDetector {
  private typeAnalyzer = new TypeAnalyzer();

  detectEdgeCases(method: MethodDeclaration): EdgeCaseInfo[] {
    const edgeCases: EdgeCaseInfo[] = [];
    const parameters = method.getParameters();
    const methodText = method.getText();

    parameters.forEach((param) => {
      const paramName = param.getName();
      const typeNode = param.getTypeNode();
      const paramType = typeNode?.getText() || "unknown";

      // Basic type-based edge cases
      edgeCases.push(...this.generateBasicTypeEdgeCases(paramName, paramType));

      // Advanced type edge cases
      edgeCases.push(
        ...this.generateAdvancedTypeEdgeCases(paramName, paramType)
      );

      // Security-focused edge cases
      edgeCases.push(...this.generateSecurityEdgeCases(paramName, paramType));

      // Optional/nullable specific cases
      if (this.typeAnalyzer.isOptionalOrNullable(param)) {
        edgeCases.push(
          ...this.generateNullabilityEdgeCases(paramName, paramType)
        );
      }
    });

    // Method-specific edge cases based on content analysis
    edgeCases.push(...this.generateMethodContextEdgeCases(methodText));

    // Business logic edge cases
    edgeCases.push(...this.generateBusinessLogicEdgeCases(method));

    // Performance and resource edge cases
    edgeCases.push(...this.generatePerformanceEdgeCases(method));

    return edgeCases;
  }

  private generateBasicTypeEdgeCases(
    paramName: string,
    paramType: string
  ): EdgeCaseInfo[] {
    const cases: EdgeCaseInfo[] = [];

    if (this.typeAnalyzer.isArrayType(paramType)) {
      cases.push(
        {
          type: "empty-array",
          parameterName: paramName,
          parameterType: paramType,
          description: `Empty array for ${paramName}`,
          testValue: "[]",
          expectedBehavior: "graceful",
          severity: "low",
          category: "input-validation",
        },
        {
          type: "large-array",
          parameterName: paramName,
          parameterType: paramType,
          description: `Memory stress test with large array for ${paramName}`,
          testValue: "Array(100000).fill(fake())",
          expectedBehavior: "graceful",
          severity: "medium",
          category: "performance",
        }
      );
    }

    if (this.typeAnalyzer.isStringType(paramType)) {
      cases.push(
        {
          type: "empty-string",
          parameterName: paramName,
          parameterType: paramType,
          description: `Empty string for ${paramName}`,
          testValue: '""',
          expectedBehavior: "graceful",
          severity: "low",
          category: "input-validation",
        },
        {
          type: "long-string",
          parameterName: paramName,
          parameterType: paramType,
          description: `Memory exhaustion test with very long string for ${paramName}`,
          testValue: '"a".repeat(1000000)',
          expectedBehavior: "graceful",
          severity: "high",
          category: "performance",
        }
      );
    }

    if (this.typeAnalyzer.isNumberType(paramType)) {
      cases.push(
        {
          type: "zero-number",
          parameterName: paramName,
          parameterType: paramType,
          description: `Zero value boundary test for ${paramName}`,
          testValue: "0",
          expectedBehavior: "graceful",
          severity: "medium",
          category: "business-logic",
        },
        {
          type: "negative-number",
          parameterName: paramName,
          parameterType: paramType,
          description: `Negative boundary test for ${paramName}`,
          testValue: "-1",
          expectedBehavior: "graceful",
          severity: "medium",
          category: "business-logic",
        }
      );
    }

    return cases;
  }

  private generateAdvancedTypeEdgeCases(
    paramName: string,
    paramType: string
  ): EdgeCaseInfo[] {
    const cases: EdgeCaseInfo[] = [];

    if (this.typeAnalyzer.isNumberType(paramType)) {
      cases.push({
        type: "nan-infinity",
        parameterName: paramName,
        parameterType: paramType,
        description: `NaN and Infinity values for ${paramName}`,
        testValue: "NaN",
        expectedBehavior: "error",
        severity: "high",
        category: "type-safety",
      });
    }

    if (paramType.includes("Date")) {
      cases.push({
        type: "date-invalid",
        parameterName: paramName,
        parameterType: paramType,
        description: `Invalid date for ${paramName}`,
        testValue: "new Date('invalid')",
        expectedBehavior: "error",
        severity: "high",
        category: "input-validation",
      });
    }

    if (this.typeAnalyzer.isObjectType(paramType)) {
      cases.push({
        type: "circular-reference",
        parameterName: paramName,
        parameterType: paramType,
        description: `Circular reference object for ${paramName}`,
        testValue:
          "(() => { const obj: any = {}; obj.self = obj; return obj; })()",
        expectedBehavior: "error",
        severity: "high",
        category: "type-safety",
      });
    }

    return cases;
  }

  private generateSecurityEdgeCases(
    paramName: string,
    paramType: string
  ): EdgeCaseInfo[] {
    const cases: EdgeCaseInfo[] = [];

    if (this.typeAnalyzer.isStringType(paramType)) {
      cases.push(
        {
          type: "xss-payload",
          parameterName: paramName,
          parameterType: paramType,
          description: `XSS injection payload for ${paramName}`,
          testValue: '"<img src=x onerror=alert(1)>"',
          expectedBehavior: "security-block",
          severity: "critical",
          category: "security",
        },
        {
          type: "sql-injection",
          parameterName: paramName,
          parameterType: paramType,
          description: `SQL injection attempt for ${paramName}`,
          testValue: '"1; DROP TABLE users; --"',
          expectedBehavior: "security-block",
          severity: "critical",
          category: "security",
        }
      );
    }

    return cases;
  }

  private generateNullabilityEdgeCases(
    paramName: string,
    paramType: string
  ): EdgeCaseInfo[] {
    return [
      {
        type: "null-input",
        parameterName: paramName,
        parameterType: paramType,
        description: `Null coercion test for ${paramName}`,
        testValue: "null",
        expectedBehavior: "graceful",
        severity: "medium",
        category: "type-safety",
      },
      {
        type: "undefined-input",
        parameterName: paramName,
        parameterType: paramType,
        description: `Undefined coercion test for ${paramName}`,
        testValue: "undefined",
        expectedBehavior: "graceful",
        severity: "medium",
        category: "type-safety",
      },
    ];
  }

  private generateMethodContextEdgeCases(methodText: string): EdgeCaseInfo[] {
    const cases: EdgeCaseInfo[] = [];

    if (methodText.includes("async") || methodText.includes("await")) {
      cases.push({
        type: "async-timeout",
        parameterName: "async",
        parameterType: "Promise",
        description: "Async operation timeout scenario",
        testValue: "new Promise(resolve => setTimeout(resolve, 30000))",
        expectedBehavior: "timeout",
        severity: "high",
        category: "concurrency",
      });
    }

    if (this.containsArrayOperations(methodText)) {
      cases.push({
        type: "concurrent-modification",
        parameterName: "array",
        parameterType: "array",
        description: "Concurrent modification during iteration",
        testValue: "mockArrayWithConcurrentModification()",
        expectedBehavior: "error",
        severity: "high",
        category: "concurrency",
      });
    }

    return cases;
  }

  private generateBusinessLogicEdgeCases(
    method: MethodDeclaration
  ): EdgeCaseInfo[] {
    const cases: EdgeCaseInfo[] = [];
    const methodName = method.getName();

    // CRUD operation edge cases
    if (methodName.toLowerCase().includes("create")) {
      cases.push({
        type: "duplicate-creation",
        parameterName: "entity",
        parameterType: "object",
        description: "Attempt to create duplicate entity",
        testValue: "existingEntityMock()",
        expectedBehavior: "error",
        severity: "medium",
        category: "business-logic",
      });
    }

    if (methodName.toLowerCase().includes("delete")) {
      cases.push({
        type: "cascade-delete",
        parameterName: "id",
        parameterType: "string",
        description: "Cascading delete with dependencies",
        testValue: "entityWithDependenciesId",
        expectedBehavior: "error",
        severity: "high",
        category: "business-logic",
      });
    }

    return cases;
  }

  private generatePerformanceEdgeCases(
    method: MethodDeclaration
  ): EdgeCaseInfo[] {
    const cases: EdgeCaseInfo[] = [];
    const methodText = method.getText();

    if (
      methodText.includes("JSON.parse") ||
      methodText.includes("JSON.stringify")
    ) {
      cases.push({
        type: "memory-exhaustion",
        parameterName: "data",
        parameterType: "object",
        description: "Memory exhaustion through large JSON",
        testValue: "createLargeNestedObject(1000)",
        expectedBehavior: "error",
        severity: "high",
        category: "performance",
      });
    }

    return cases;
  }

  private containsArrayOperations(methodText: string): boolean {
    const arrayOperations = [
      ".map(",
      ".filter(",
      ".reduce(",
      ".forEach(",
      ".find(",
      ".length",
      ".push(",
      ".pop(",
    ];
    return arrayOperations.some((op) => methodText.includes(op));
  }
}
