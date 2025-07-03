import { MethodDeclaration, ParameterDeclaration } from "ts-morph";
import { EdgeCaseInfo } from "./edge-case-detector.js";

export interface PropertyBasedTestCase {
  name: string;
  description: string;
  strategy: "exhaustive" | "random" | "boundary" | "mutation";
  inputGenerators: InputGenerator[];
  properties: PropertyAssertion[];
  iterations: number;
  seed?: number;
}

export interface InputGenerator {
  parameterName: string;
  type: string;
  generator: GeneratorFunction;
  constraints?: GeneratorConstraints;
}

export interface GeneratorFunction {
  type: "random" | "sequence" | "combination" | "mutation";
  baseValue?: any;
  range?: { min: number; max: number };
  options?: any[];
  pattern?: string;
}

export interface GeneratorConstraints {
  minLength?: number;
  maxLength?: number;
  allowNull?: boolean;
  allowUndefined?: boolean;
  allowEmpty?: boolean;
  customValidation?: string;
}

export interface PropertyAssertion {
  name: string;
  description: string;
  type: "invariant" | "postcondition" | "precondition" | "metamorphic";
  assertion: string;
  priority: number;
}

export class PropertyBasedTestGenerator {
  generatePropertyTests(
    method: MethodDeclaration,
    edgeCases: EdgeCaseInfo[]
  ): PropertyBasedTestCase[] {
    const testCases: PropertyBasedTestCase[] = [];
    const parameters = method.getParameters();
    const methodName = method.getName();

    // Generate exhaustive combination tests for small parameter sets
    if (parameters.length <= 3) {
      testCases.push(this.generateExhaustiveTest(method, parameters));
    }

    // Generate random property tests
    testCases.push(this.generateRandomPropertyTest(method, parameters));

    // Generate boundary value tests
    testCases.push(this.generateBoundaryTest(method, parameters, edgeCases));

    // Generate mutation tests
    testCases.push(this.generateMutationTest(method, parameters));

    // Generate metamorphic tests
    testCases.push(...this.generateMetamorphicTests(method, parameters));

    return testCases;
  }

  private generateExhaustiveTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createExhaustiveGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_exhaustive_combinations`,
      description: `Exhaustive testing of all valid input combinations for ${method.getName()}`,
      strategy: "exhaustive",
      inputGenerators,
      properties: this.generateInvariantProperties(method),
      iterations: Math.min(100, Math.pow(3, parameters.length)), // Limit combinatorial explosion
    };
  }

  private generateRandomPropertyTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createRandomGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_random_property_test`,
      description: `Random property-based testing for ${method.getName()}`,
      strategy: "random",
      inputGenerators,
      properties: [
        ...this.generateInvariantProperties(method),
        ...this.generatePostconditionProperties(method),
      ],
      iterations: 1000,
      seed: 42,
    };
  }

  private generateBoundaryTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[],
    edgeCases: EdgeCaseInfo[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createBoundaryGenerator(param, edgeCases),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_boundary_value_test`,
      description: `Boundary value analysis for ${method.getName()}`,
      strategy: "boundary",
      inputGenerators,
      properties: [
        ...this.generateInvariantProperties(method),
        ...this.generateBoundaryProperties(method),
      ],
      iterations: 200,
    };
  }

  private generateMutationTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createMutationGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_mutation_test`,
      description: `Mutation testing with gradually corrupted inputs for ${method.getName()}`,
      strategy: "mutation",
      inputGenerators,
      properties: this.generateRobustnessProperties(method),
      iterations: 500,
    };
  }

  private generateMetamorphicTests(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase[] {
    const methodName = method.getName();
    const testCases: PropertyBasedTestCase[] = [];

    // Idempotency test for operations that should be idempotent
    if (this.isIdempotentOperation(methodName)) {
      testCases.push(this.generateIdempotencyTest(method, parameters));
    }

    // Commutativity test
    if (this.isCommutativeOperation(methodName)) {
      testCases.push(this.generateCommutativityTest(method, parameters));
    }

    // Associativity test
    if (this.isAssociativeOperation(methodName)) {
      testCases.push(this.generateAssociativityTest(method, parameters));
    }

    // Order invariance test
    if (this.isOrderInvariantOperation(methodName)) {
      testCases.push(this.generateOrderInvarianceTest(method, parameters));
    }

    return testCases;
  }

  private createExhaustiveGenerator(
    param: ParameterDeclaration
  ): GeneratorFunction {
    const type = param.getTypeNode()?.getText() || "unknown";

    if (type.includes("boolean")) {
      return {
        type: "sequence",
        options: [true, false, null, undefined],
      };
    }

    if (type.includes("number")) {
      return {
        type: "sequence",
        options: [
          -1,
          0,
          1,
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          NaN,
          Infinity,
        ],
      };
    }

    if (type.includes("string")) {
      return {
        type: "sequence",
        options: ["", "a", "test", "a".repeat(1000), null, undefined],
      };
    }

    return {
      type: "sequence",
      options: [null, undefined, {}, []],
    };
  }

  private createRandomGenerator(
    param: ParameterDeclaration
  ): GeneratorFunction {
    const type = param.getTypeNode()?.getText() || "unknown";

    if (type.includes("number")) {
      return {
        type: "random",
        range: { min: -1000000, max: 1000000 },
      };
    }

    if (type.includes("string")) {
      return {
        type: "random",
        pattern: "[a-zA-Z0-9]{0,100}",
      };
    }

    if (type.includes("boolean")) {
      return {
        type: "random",
        options: [true, false],
      };
    }

    return {
      type: "random",
      baseValue: {},
    };
  }

  private createBoundaryGenerator(
    param: ParameterDeclaration,
    edgeCases: EdgeCaseInfo[]
  ): GeneratorFunction {
    const type = param.getTypeNode()?.getText() || "unknown";
    const paramName = param.getName();

    // Find relevant edge cases for this parameter
    const relevantEdgeCases = edgeCases.filter(
      (edge) => edge.parameterName === paramName
    );

    const boundaryValues = relevantEdgeCases.map((edge) => edge.testValue);

    if (type.includes("number")) {
      boundaryValues.push(
        "0",
        "1",
        "-1",
        "Number.MAX_SAFE_INTEGER",
        "Number.MIN_SAFE_INTEGER",
        "Number.MAX_VALUE",
        "Number.MIN_VALUE"
      );
    }

    if (type.includes("string")) {
      boundaryValues.push('""', '"a"', '"a".repeat(255)', '"a".repeat(65535)');
    }

    return {
      type: "sequence",
      options: boundaryValues,
    };
  }

  private createMutationGenerator(
    param: ParameterDeclaration
  ): GeneratorFunction {
    const type = param.getTypeNode()?.getText() || "unknown";

    return {
      type: "mutation",
      baseValue: this.getValidBaseValue(type),
    };
  }

  private extractConstraints(
    param: ParameterDeclaration
  ): GeneratorConstraints {
    const isOptional = param.hasQuestionToken();
    const type = param.getTypeNode()?.getText() || "unknown";

    return {
      allowNull: type.includes("null") || isOptional,
      allowUndefined: type.includes("undefined") || isOptional,
      allowEmpty: true,
      minLength: type.includes("string") ? 0 : undefined,
      maxLength: type.includes("string") ? 10000 : undefined,
    };
  }

  private generateInvariantProperties(
    method: MethodDeclaration
  ): PropertyAssertion[] {
    const methodName = method.getName();
    const properties: PropertyAssertion[] = [];

    // Basic invariants that should hold for most methods
    properties.push({
      name: "no_crash_invariant",
      description: "Method should not crash with valid inputs",
      type: "invariant",
      assertion: "result !== undefined || error instanceof Error",
      priority: 1,
    });

    // Type safety invariant
    if (method.getReturnTypeNode()) {
      const returnType = method.getReturnTypeNode()?.getText();
      properties.push({
        name: "return_type_invariant",
        description: `Return type should match expected type: ${returnType}`,
        type: "invariant",
        assertion: `typeof result === '${this.getJSType(returnType)}'`,
        priority: 2,
      });
    }

    return properties;
  }

  private generatePostconditionProperties(
    method: MethodDeclaration
  ): PropertyAssertion[] {
    const methodName = method.getName();
    const properties: PropertyAssertion[] = [];

    // CRUD-specific postconditions
    if (methodName.toLowerCase().includes("create")) {
      properties.push({
        name: "create_postcondition",
        description: "Created entity should have required properties",
        type: "postcondition",
        assertion: "result && result.id && result.createdAt",
        priority: 2,
      });
    }

    if (methodName.toLowerCase().includes("update")) {
      properties.push({
        name: "update_postcondition",
        description: "Updated entity should have updated timestamp",
        type: "postcondition",
        assertion: "result && result.updatedAt >= originalEntity.updatedAt",
        priority: 2,
      });
    }

    return properties;
  }

  private generateBoundaryProperties(
    method: MethodDeclaration
  ): PropertyAssertion[] {
    return [
      {
        name: "boundary_safety",
        description: "Method should handle boundary values gracefully",
        type: "invariant",
        assertion: "!result || typeof result !== 'undefined'",
        priority: 2,
      },
    ];
  }

  private generateRobustnessProperties(
    method: MethodDeclaration
  ): PropertyAssertion[] {
    return [
      {
        name: "input_mutation_robustness",
        description: "Method should be robust to input mutations",
        type: "invariant",
        assertion: "result !== undefined || error instanceof Error",
        priority: 1,
      },
      {
        name: "consistent_error_handling",
        description: "Error handling should be consistent across mutations",
        type: "invariant",
        assertion: "!error || error.message.length > 0",
        priority: 2,
      },
    ];
  }

  private generateIdempotencyTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createRandomGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_idempotency_test`,
      description: `Idempotency test for ${method.getName()}`,
      strategy: "random",
      inputGenerators,
      properties: [
        {
          name: "idempotency_property",
          description: "f(f(x)) = f(x)",
          type: "metamorphic",
          assertion: "JSON.stringify(result1) === JSON.stringify(result2)",
          priority: 1,
        },
      ],
      iterations: 100,
    };
  }

  private generateCommutativityTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createRandomGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_commutativity_test`,
      description: `Commutativity test for ${method.getName()}`,
      strategy: "random",
      inputGenerators,
      properties: [
        {
          name: "commutativity_property",
          description: "f(a, b) = f(b, a)",
          type: "metamorphic",
          assertion: "JSON.stringify(resultAB) === JSON.stringify(resultBA)",
          priority: 1,
        },
      ],
      iterations: 100,
    };
  }

  private generateAssociativityTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createRandomGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_associativity_test`,
      description: `Associativity test for ${method.getName()}`,
      strategy: "random",
      inputGenerators,
      properties: [
        {
          name: "associativity_property",
          description: "f(f(a, b), c) = f(a, f(b, c))",
          type: "metamorphic",
          assertion:
            "JSON.stringify(resultABC1) === JSON.stringify(resultABC2)",
          priority: 1,
        },
      ],
      iterations: 100,
    };
  }

  private generateOrderInvarianceTest(
    method: MethodDeclaration,
    parameters: ParameterDeclaration[]
  ): PropertyBasedTestCase {
    const inputGenerators = parameters.map((param) => ({
      parameterName: param.getName(),
      type: param.getTypeNode()?.getText() || "unknown",
      generator: this.createRandomGenerator(param),
      constraints: this.extractConstraints(param),
    }));

    return {
      name: `${method.getName()}_order_invariance_test`,
      description: `Order invariance test for ${method.getName()}`,
      strategy: "random",
      inputGenerators,
      properties: [
        {
          name: "order_invariance_property",
          description: "Result should be invariant to input order",
          type: "metamorphic",
          assertion:
            "JSON.stringify(resultOriginal) === JSON.stringify(resultShuffled)",
          priority: 1,
        },
      ],
      iterations: 50,
    };
  }

  private isIdempotentOperation(methodName: string): boolean {
    const idempotentPatterns = ["get", "find", "search", "validate", "check"];
    return idempotentPatterns.some((pattern) =>
      methodName.toLowerCase().includes(pattern)
    );
  }

  private isCommutativeOperation(methodName: string): boolean {
    const commutativePatterns = ["add", "merge", "combine", "union"];
    return commutativePatterns.some((pattern) =>
      methodName.toLowerCase().includes(pattern)
    );
  }

  private isAssociativeOperation(methodName: string): boolean {
    const associativePatterns = ["add", "concat", "merge", "union"];
    return associativePatterns.some((pattern) =>
      methodName.toLowerCase().includes(pattern)
    );
  }

  private isOrderInvariantOperation(methodName: string): boolean {
    const orderInvariantPatterns = ["sort", "aggregate", "count", "sum"];
    return orderInvariantPatterns.some((pattern) =>
      methodName.toLowerCase().includes(pattern)
    );
  }

  private getValidBaseValue(type: string): any {
    if (type.includes("string")) return "test";
    if (type.includes("number")) return 42;
    if (type.includes("boolean")) return true;
    if (type.includes("array") || type.includes("[]")) return [];
    return {};
  }

  private getJSType(typeString?: string): string {
    if (!typeString) return "unknown";
    if (typeString.includes("string")) return "string";
    if (typeString.includes("number")) return "number";
    if (typeString.includes("boolean")) return "boolean";
    if (typeString.includes("object")) return "object";
    return "object";
  }
}
