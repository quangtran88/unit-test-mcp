import { ClassDeclaration, MethodDeclaration } from "ts-morph";
import { DependencyAnalysis } from "./dependency-analyzer.js";
import { MethodFlowAnalysis } from "./method-flow-analyzer.js";

export interface TestScenario {
  methodName: string;
  scenarios: {
    name: string;
    type: "success" | "error" | "edge-case";
    setup: string[];
    expectations: string[];
    priority: number;
  }[];
}

export class TestScenarioGenerator {
  generateTestScenarios(
    methods: MethodFlowAnalysis[],
    dependencies: DependencyAnalysis[],
    classDecl: ClassDeclaration
  ): TestScenario[] {
    return methods.map((method) => {
      const methodDecl = classDecl.getMethod(method.name);

      return {
        methodName: method.name,
        scenarios: this.generateMethodScenarios(
          method,
          dependencies,
          methodDecl
        ),
      };
    });
  }

  private generateMethodScenarios(
    method: MethodFlowAnalysis,
    dependencies: DependencyAnalysis[],
    methodDecl?: MethodDeclaration
  ): TestScenario["scenarios"] {
    const scenarios: TestScenario["scenarios"] = [];

    // Generate success scenario
    scenarios.push({
      name: `${method.name} success`,
      type: "success",
      setup: this.generateSuccessSetup(method, dependencies),
      expectations: ["expect(result).toEqual(expectedResult)"],
      priority: 5,
    });

    // Generate error scenarios
    method.errorPaths.forEach((errorPath) => {
      scenarios.push({
        name: `${method.name} error - ${errorPath.condition}`,
        type: "error",
        setup: [`Setup condition: ${errorPath.condition}`],
        expectations: [`should throw ${errorPath.errorType}`],
        priority: 4,
      });
    });

    // Add basic edge case scenarios
    if (methodDecl) {
      const parameters = methodDecl.getParameters();
      parameters.forEach((param) => {
        const paramName = param.getName();
        scenarios.push({
          name: `${method.name} with null ${paramName}`,
          type: "edge-case",
          setup: [`const ${paramName} = null`],
          expectations: ["expect(() => method(null)).toThrow()"],
          priority: 3,
        });
      });
    }

    return scenarios;
  }

  private generateSuccessSetup(
    method: MethodFlowAnalysis,
    dependencies: DependencyAnalysis[]
  ): string[] {
    const setup: string[] = [];

    method.dependencyUsage.forEach((depName) => {
      const dep = dependencies.find((d) => d.name === depName);
      if (dep) {
        dep.commonMethods.forEach((methodName) => {
          setup.push(`${depName}Mock.${methodName}.resolves(expectedResult)`);
        });
      }
    });

    setup.push("const expectedResult = fake()");
    return setup;
  }
}
