import { MethodDeclaration, ParameterDeclaration } from "ts-morph";

export interface BoundaryValue {
  type: "numeric" | "string" | "array" | "date" | "object" | "boolean";
  category:
    | "minimum"
    | "maximum"
    | "just-below-min"
    | "just-above-max"
    | "zero"
    | "negative"
    | "positive"
    | "empty"
    | "overflow";
  value: any;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  expectedBehavior: "valid" | "invalid" | "edge" | "error";
}

export interface BoundaryAnalysis {
  parameterName: string;
  parameterType: string;
  boundaries: BoundaryValue[];
  constraints: ParameterConstraints;
  recommendations: string[];
}

export interface ParameterConstraints {
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowNull?: boolean;
  allowUndefined?: boolean;
  customRules?: string[];
}

export class BoundaryValueGenerator {
  generateBoundaryAnalysis(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): BoundaryAnalysis[] {
    return parameters.map((param) => this.analyzeBoundaries(param, method));
  }

  private analyzeBoundaries(
    param: ParameterDeclaration,
    method: MethodDeclaration
  ): BoundaryAnalysis {
    const paramName = param.getName();
    const paramType = param.getTypeNode()?.getText() || "unknown";
    const constraints = this.extractConstraints(param, method);

    const boundaries = this.generateBoundariesForType(
      paramType,
      constraints,
      paramName
    );
    const recommendations = this.generateRecommendations(boundaries, paramType);

    return {
      parameterName: paramName,
      parameterType: paramType,
      boundaries,
      constraints,
      recommendations,
    };
  }

  private generateBoundariesForType(
    type: string,
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    const boundaries: BoundaryValue[] = [];

    if (this.isNumericType(type)) {
      boundaries.push(
        ...this.generateNumericBoundaries(constraints, paramName)
      );
    }

    if (this.isStringType(type)) {
      boundaries.push(...this.generateStringBoundaries(constraints, paramName));
    }

    if (this.isArrayType(type)) {
      boundaries.push(...this.generateArrayBoundaries(constraints, paramName));
    }

    if (this.isDateType(type)) {
      boundaries.push(...this.generateDateBoundaries(constraints, paramName));
    }

    if (this.isObjectType(type)) {
      boundaries.push(...this.generateObjectBoundaries(constraints, paramName));
    }

    if (this.isBooleanType(type)) {
      boundaries.push(
        ...this.generateBooleanBoundaries(constraints, paramName)
      );
    }

    // Add null/undefined boundaries for nullable types
    if (constraints.allowNull || constraints.allowUndefined) {
      boundaries.push(...this.generateNullabilityBoundaries(paramName));
    }

    return boundaries;
  }

  private generateNumericBoundaries(
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    const boundaries: BoundaryValue[] = [];

    // Basic numeric boundaries
    boundaries.push(
      {
        type: "numeric",
        category: "zero",
        value: 0,
        description: `Zero value for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "numeric",
        category: "positive",
        value: 1,
        description: `Smallest positive value for ${paramName}`,
        riskLevel: "low",
        expectedBehavior: "valid",
      },
      {
        type: "numeric",
        category: "negative",
        value: -1,
        description: `Smallest negative value for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      }
    );

    // JavaScript number limits
    boundaries.push(
      {
        type: "numeric",
        category: "maximum",
        value: Number.MAX_SAFE_INTEGER,
        description: `Maximum safe integer for ${paramName}`,
        riskLevel: "high",
        expectedBehavior: "edge",
      },
      {
        type: "numeric",
        category: "minimum",
        value: Number.MIN_SAFE_INTEGER,
        description: `Minimum safe integer for ${paramName}`,
        riskLevel: "high",
        expectedBehavior: "edge",
      },
      {
        type: "numeric",
        category: "overflow",
        value: Number.MAX_VALUE,
        description: `Maximum possible number for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "numeric",
        category: "overflow",
        value: Number.MIN_VALUE,
        description: `Minimum possible number for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      }
    );

    // Special numeric values
    boundaries.push(
      {
        type: "numeric",
        category: "overflow",
        value: NaN,
        description: `NaN value for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "numeric",
        category: "overflow",
        value: Infinity,
        description: `Positive infinity for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "numeric",
        category: "overflow",
        value: -Infinity,
        description: `Negative infinity for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      }
    );

    // Custom constraint boundaries
    if (constraints.minValue !== undefined) {
      boundaries.push(
        {
          type: "numeric",
          category: "minimum",
          value: constraints.minValue,
          description: `Minimum allowed value for ${paramName}`,
          riskLevel: "medium",
          expectedBehavior: "valid",
        },
        {
          type: "numeric",
          category: "just-below-min",
          value: constraints.minValue - 1,
          description: `Just below minimum for ${paramName}`,
          riskLevel: "high",
          expectedBehavior: "invalid",
        }
      );
    }

    if (constraints.maxValue !== undefined) {
      boundaries.push(
        {
          type: "numeric",
          category: "maximum",
          value: constraints.maxValue,
          description: `Maximum allowed value for ${paramName}`,
          riskLevel: "medium",
          expectedBehavior: "valid",
        },
        {
          type: "numeric",
          category: "just-above-max",
          value: constraints.maxValue + 1,
          description: `Just above maximum for ${paramName}`,
          riskLevel: "high",
          expectedBehavior: "invalid",
        }
      );
    }

    // Floating point precision boundaries
    boundaries.push({
      type: "numeric",
      category: "overflow",
      value: 0.1 + 0.2, // = 0.30000000000000004
      description: `Floating point precision issue for ${paramName}`,
      riskLevel: "medium",
      expectedBehavior: "edge",
    });

    return boundaries;
  }

  private generateStringBoundaries(
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    const boundaries: BoundaryValue[] = [];

    // Basic string boundaries
    boundaries.push(
      {
        type: "string",
        category: "empty",
        value: "",
        description: `Empty string for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "string",
        category: "minimum",
        value: "a",
        description: `Single character string for ${paramName}`,
        riskLevel: "low",
        expectedBehavior: "valid",
      }
    );

    // Length boundaries
    if (constraints.minLength !== undefined) {
      const minLengthStr = "a".repeat(constraints.minLength);
      boundaries.push({
        type: "string",
        category: "minimum",
        value: minLengthStr,
        description: `Minimum length string for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "valid",
      });

      if (constraints.minLength > 0) {
        boundaries.push({
          type: "string",
          category: "just-below-min",
          value: "a".repeat(Math.max(0, constraints.minLength - 1)),
          description: `Just below minimum length for ${paramName}`,
          riskLevel: "high",
          expectedBehavior: "invalid",
        });
      }
    }

    if (constraints.maxLength !== undefined) {
      boundaries.push(
        {
          type: "string",
          category: "maximum",
          value: "a".repeat(constraints.maxLength),
          description: `Maximum length string for ${paramName}`,
          riskLevel: "medium",
          expectedBehavior: "valid",
        },
        {
          type: "string",
          category: "just-above-max",
          value: "a".repeat(constraints.maxLength + 1),
          description: `Just above maximum length for ${paramName}`,
          riskLevel: "high",
          expectedBehavior: "invalid",
        }
      );
    }

    // Common problematic string values
    boundaries.push(
      {
        type: "string",
        category: "overflow",
        value: "a".repeat(100000),
        description: `Very long string for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "string",
        category: "overflow",
        value: "\0",
        description: `Null byte in string for ${paramName}`,
        riskLevel: "high",
        expectedBehavior: "error",
      },
      {
        type: "string",
        category: "overflow",
        value: "🚀🎉🌟", // Unicode characters
        description: `Unicode characters for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "string",
        category: "overflow",
        value: "   ", // Whitespace only
        description: `Whitespace-only string for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      }
    );

    // SQL injection and XSS attempts
    boundaries.push(
      {
        type: "string",
        category: "overflow",
        value: "'; DROP TABLE users; --",
        description: `SQL injection attempt for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "string",
        category: "overflow",
        value: "<script>alert('xss')</script>",
        description: `XSS attack attempt for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      }
    );

    return boundaries;
  }

  private generateArrayBoundaries(
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    const boundaries: BoundaryValue[] = [];

    // Basic array boundaries
    boundaries.push(
      {
        type: "array",
        category: "empty",
        value: [],
        description: `Empty array for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "array",
        category: "minimum",
        value: [1],
        description: `Single element array for ${paramName}`,
        riskLevel: "low",
        expectedBehavior: "valid",
      }
    );

    // Size boundaries
    if (constraints.minLength !== undefined) {
      boundaries.push({
        type: "array",
        category: "minimum",
        value: Array(constraints.minLength).fill(1),
        description: `Minimum size array for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "valid",
      });

      if (constraints.minLength > 0) {
        boundaries.push({
          type: "array",
          category: "just-below-min",
          value: Array(Math.max(0, constraints.minLength - 1)).fill(1),
          description: `Just below minimum size for ${paramName}`,
          riskLevel: "high",
          expectedBehavior: "invalid",
        });
      }
    }

    if (constraints.maxLength !== undefined) {
      boundaries.push(
        {
          type: "array",
          category: "maximum",
          value: Array(constraints.maxLength).fill(1),
          description: `Maximum size array for ${paramName}`,
          riskLevel: "medium",
          expectedBehavior: "valid",
        },
        {
          type: "array",
          category: "just-above-max",
          value: Array(constraints.maxLength + 1).fill(1),
          description: `Just above maximum size for ${paramName}`,
          riskLevel: "high",
          expectedBehavior: "invalid",
        }
      );
    }

    // Memory stress boundaries
    boundaries.push(
      {
        type: "array",
        category: "overflow",
        value: Array(1000000).fill(1),
        description: `Very large array for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "array",
        category: "overflow",
        value: [null, undefined, "", 0, false],
        description: `Array with falsy values for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      }
    );

    return boundaries;
  }

  private generateDateBoundaries(
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    const boundaries: BoundaryValue[] = [];

    // JavaScript Date boundaries
    boundaries.push(
      {
        type: "date",
        category: "minimum",
        value: new Date(-8640000000000000), // Minimum JS date
        description: `Minimum JavaScript date for ${paramName}`,
        riskLevel: "high",
        expectedBehavior: "edge",
      },
      {
        type: "date",
        category: "maximum",
        value: new Date(8640000000000000), // Maximum JS date
        description: `Maximum JavaScript date for ${paramName}`,
        riskLevel: "high",
        expectedBehavior: "edge",
      },
      {
        type: "date",
        category: "overflow",
        value: new Date(8640000000000001), // Beyond max
        description: `Invalid date beyond maximum for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "date",
        category: "overflow",
        value: new Date("invalid"),
        description: `Invalid date string for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      }
    );

    // Common problematic dates
    boundaries.push(
      {
        type: "date",
        category: "overflow",
        value: new Date(1970, 0, 1), // Unix epoch
        description: `Unix epoch date for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "date",
        category: "overflow",
        value: new Date(2038, 0, 19), // Y2038 problem
        description: `Y2038 problem date for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "date",
        category: "overflow",
        value: new Date(2000, 1, 29), // Leap year edge case
        description: `Leap year date for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      }
    );

    return boundaries;
  }

  private generateObjectBoundaries(
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    const boundaries: BoundaryValue[] = [];

    // Basic object boundaries
    boundaries.push(
      {
        type: "object",
        category: "empty",
        value: {},
        description: `Empty object for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "object",
        category: "minimum",
        value: { key: "value" },
        description: `Simple object for ${paramName}`,
        riskLevel: "low",
        expectedBehavior: "valid",
      }
    );

    // Problematic object structures
    const circularObj: any = {};
    circularObj.self = circularObj;

    boundaries.push(
      {
        type: "object",
        category: "overflow",
        value: circularObj,
        description: `Circular reference object for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "object",
        category: "overflow",
        value: this.createDeepObject(100),
        description: `Very deep nested object for ${paramName}`,
        riskLevel: "critical",
        expectedBehavior: "error",
      },
      {
        type: "object",
        category: "overflow",
        value: this.createWideObject(10000),
        description: `Very wide object for ${paramName}`,
        riskLevel: "high",
        expectedBehavior: "error",
      }
    );

    return boundaries;
  }

  private generateBooleanBoundaries(
    constraints: ParameterConstraints,
    paramName: string
  ): BoundaryValue[] {
    return [
      {
        type: "boolean",
        category: "minimum",
        value: true,
        description: `True value for ${paramName}`,
        riskLevel: "low",
        expectedBehavior: "valid",
      },
      {
        type: "boolean",
        category: "maximum",
        value: false,
        description: `False value for ${paramName}`,
        riskLevel: "low",
        expectedBehavior: "valid",
      },
    ];
  }

  private generateNullabilityBoundaries(paramName: string): BoundaryValue[] {
    return [
      {
        type: "object",
        category: "empty",
        value: null,
        description: `Null value for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
      {
        type: "object",
        category: "empty",
        value: undefined,
        description: `Undefined value for ${paramName}`,
        riskLevel: "medium",
        expectedBehavior: "edge",
      },
    ];
  }

  private extractConstraints(
    param: ParameterDeclaration,
    method: MethodDeclaration
  ): ParameterConstraints {
    const isOptional = param.hasQuestionToken();
    const type = param.getTypeNode()?.getText() || "unknown";
    const methodText = method.getText();
    const paramName = param.getName();

    const constraints: ParameterConstraints = {
      allowNull: type.includes("null") || isOptional,
      allowUndefined: type.includes("undefined") || isOptional,
    };

    // Try to extract constraints from validation logic in method
    const validationPatterns = [
      { pattern: new RegExp(`${paramName}\\s*>\\s*(\\d+)`), type: "minValue" },
      { pattern: new RegExp(`${paramName}\\s*<\\s*(\\d+)`), type: "maxValue" },
      {
        pattern: new RegExp(`${paramName}\\.length\\s*>\\s*(\\d+)`),
        type: "minLength",
      },
      {
        pattern: new RegExp(`${paramName}\\.length\\s*<\\s*(\\d+)`),
        type: "maxLength",
      },
    ];

    validationPatterns.forEach(({ pattern, type }) => {
      const match = methodText.match(pattern);
      if (match) {
        (constraints as any)[type] = parseInt(match[1]);
      }
    });

    return constraints;
  }

  private generateRecommendations(
    boundaries: BoundaryValue[],
    type: string
  ): string[] {
    const recommendations: string[] = [];

    const criticalBoundaries = boundaries.filter(
      (b) => b.riskLevel === "critical"
    );
    const highRiskBoundaries = boundaries.filter((b) => b.riskLevel === "high");

    if (criticalBoundaries.length > 0) {
      recommendations.push(
        "Add input validation to handle critical boundary cases"
      );
      recommendations.push("Implement error handling for overflow scenarios");
    }

    if (highRiskBoundaries.length > 0) {
      recommendations.push("Test all high-risk boundary scenarios thoroughly");
    }

    if (this.isNumericType(type)) {
      recommendations.push("Validate numeric ranges to prevent overflow");
      recommendations.push("Handle special values like NaN and Infinity");
    }

    if (this.isStringType(type)) {
      recommendations.push("Sanitize input to prevent injection attacks");
      recommendations.push("Validate string length limits");
    }

    if (this.isArrayType(type)) {
      recommendations.push(
        "Implement size limits to prevent memory exhaustion"
      );
    }

    return recommendations;
  }

  // Helper methods for type checking
  private isNumericType(type: string): boolean {
    return type.includes("number") || type.includes("bigint");
  }

  private isStringType(type: string): boolean {
    return type.includes("string");
  }

  private isArrayType(type: string): boolean {
    return (
      type.includes("[]") ||
      type.includes("Array<") ||
      type.includes("ReadonlyArray<")
    );
  }

  private isDateType(type: string): boolean {
    return type.includes("Date");
  }

  private isObjectType(type: string): boolean {
    return (
      type.includes("{") ||
      type.includes("interface") ||
      type.includes("Record<") ||
      type === "object"
    );
  }

  private isBooleanType(type: string): boolean {
    return type.includes("boolean");
  }

  // Helper methods for creating test objects
  private createDeepObject(depth: number): any {
    if (depth <= 0) return "deep";
    return { nested: this.createDeepObject(depth - 1) };
  }

  private createWideObject(width: number): any {
    const obj: any = {};
    for (let i = 0; i < width; i++) {
      obj[`key${i}`] = `value${i}`;
    }
    return obj;
  }
}
