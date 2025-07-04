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
    const seenScenarios = new Set<string>(); // Track unique scenarios

    // Generate success scenario
    const successScenario = {
      name: `${method.name} success`,
      type: "success" as const,
      setup: this.generateSuccessSetup(method, dependencies),
      expectations: ["expect(result).toEqual(expectedResult)"],
      priority: 5,
    };
    scenarios.push(successScenario);
    seenScenarios.add(this.getScenarioKey(successScenario));

    // Generate error scenarios with deduplication
    method.errorPaths.forEach((errorPath) => {
      const errorScenario = {
        name: `${method.name} error - ${errorPath.condition}`,
        type: "error" as const,
        setup: [`Setup condition: ${errorPath.condition}`],
        expectations: [`should throw ${errorPath.errorType}`],
        priority: 4,
      };

      const scenarioKey = this.getScenarioKey(errorScenario);
      if (!seenScenarios.has(scenarioKey)) {
        scenarios.push(errorScenario);
        seenScenarios.add(scenarioKey);
      }
    });

    // Add basic edge case scenarios with deduplication
    if (methodDecl) {
      const parameters = methodDecl.getParameters();
      parameters.forEach((param) => {
        const paramName = param.getName();
        const edgeCaseScenario = {
          name: `${method.name} with null ${paramName}`,
          type: "edge-case" as const,
          setup: [`const ${paramName} = null`],
          expectations: ["expect(() => method(null)).toThrow()"],
          priority: 3,
        };

        const scenarioKey = this.getScenarioKey(edgeCaseScenario);
        if (!seenScenarios.has(scenarioKey)) {
          scenarios.push(edgeCaseScenario);
          seenScenarios.add(scenarioKey);
        }
      });
    }

    return scenarios;
  }

  private getScenarioKey(scenario: TestScenario["scenarios"][0]): string {
    // Create a unique key based on name, type, and setup/expectations
    return `${scenario.name}|${scenario.type}|${JSON.stringify(
      scenario.setup
    )}|${JSON.stringify(scenario.expectations)}`;
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
