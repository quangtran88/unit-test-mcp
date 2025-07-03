import {
  ClassDeclaration,
  MethodDeclaration,
  SourceFile,
  SyntaxKind,
} from "ts-morph";

// Import all the extracted analyzer classes
import {
  BusinessLogicPattern,
  BusinessLogicPatternDetector,
} from "./business-logic-pattern-detector.js";
import {
  AsyncPatternInfo,
  ConcurrencyAnalysis,
  ConcurrencyAnalyzer,
  PromiseChainInfo,
  RaceConditionInfo,
  SharedResourceInfo,
} from "./concurrency-analyzer.js";
import {
  DependencyAnalysis,
  DependencyAnalyzer,
  DependencyUsage,
} from "./dependency-analyzer.js";
import {
  AsyncEdgeCaseInfo,
  EdgeCaseDetector,
  EdgeCaseInfo,
} from "./edge-case-detector.js";
import { ErrorPathAnalyzer } from "./error-path-analyzer.js";
import {
  ErrorPath,
  MethodFlowAnalysis,
  MethodFlowAnalyzer,
  SideEffect,
} from "./method-flow-analyzer.js";
import {
  TestScenario,
  TestScenarioGenerator,
} from "./test-scenario-generator.js";

// Re-export all interfaces to maintain public API
export {
  AsyncEdgeCaseInfo,
  AsyncPatternInfo,
  BusinessLogicPattern,
  ConcurrencyAnalysis,
  DependencyAnalysis,
  DependencyUsage,
  EdgeCaseInfo,
  ErrorPath,
  MethodFlowAnalysis,
  PromiseChainInfo,
  RaceConditionInfo,
  SharedResourceInfo,
  SideEffect,
  TestScenario,
};

export interface AdvancedAnalysis {
  dependencies: DependencyAnalysis[];
  methods: MethodFlowAnalysis[];
  businessLogicPatterns: BusinessLogicPattern[];
  testScenarios: TestScenario[];
}

export class AdvancedAnalyzer {
  private dependencyAnalyzer = new DependencyAnalyzer();
  private methodFlowAnalyzer = new MethodFlowAnalyzer();
  private errorPathAnalyzer = new ErrorPathAnalyzer();
  private businessLogicPatternDetector = new BusinessLogicPatternDetector();
  private testScenarioGenerator = new TestScenarioGenerator();
  private concurrencyAnalyzer = new ConcurrencyAnalyzer();
  private edgeCaseDetector = new EdgeCaseDetector();

  analyzeAdvanced(
    sourceFile: SourceFile,
    mainClass: ClassDeclaration,
    methodName?: string
  ): AdvancedAnalysis {
    const dependencies = this.dependencyAnalyzer.analyzeDependencies(mainClass);
    let methods = this.methodFlowAnalyzer.analyzeMethodFlows(
      mainClass,
      dependencies
    );

    // Add error path analysis to methods
    methods = methods.map((method) => {
      const methodDecl = mainClass.getMethod(method.name);
      if (methodDecl) {
        const errorPaths = this.errorPathAnalyzer.analyzeErrorPaths(methodDecl);
        return { ...method, errorPaths };
      }
      return method;
    });

    // Filter methods if methodName is provided
    if (methodName) {
      methods = methods.filter((method) => method.name === methodName);
    }

    const businessLogicPatterns =
      this.businessLogicPatternDetector.detectBusinessLogicPatterns(methods);
    const testScenarios = this.testScenarioGenerator.generateTestScenarios(
      methods,
      dependencies,
      mainClass
    );

    return {
      dependencies,
      methods,
      businessLogicPatterns,
      testScenarios,
    };
  }

  analyzeConcurrency(
    sourceFile: SourceFile,
    mainClass: ClassDeclaration
  ): ConcurrencyAnalysis {
    return this.concurrencyAnalyzer.analyzeConcurrency(sourceFile, mainClass);
  }

  detectAsyncEdgeCases(
    method: MethodDeclaration,
    concurrencyAnalysis: ConcurrencyAnalysis
  ): AsyncEdgeCaseInfo[] {
    const edgeCases = this.edgeCaseDetector.detectEdgeCases(method);
    const isAsync = method.hasModifier(SyntaxKind.AsyncKeyword);
    const methodText = method.getText();

    if (!isAsync && !methodText.includes("Promise")) {
      return [];
    }

    // Filter for async-specific edge cases and convert to AsyncEdgeCaseInfo
    return edgeCases
      .filter(
        (edgeCase) =>
          edgeCase.type.includes("async") || edgeCase.category === "concurrency"
      )
      .map(
        (edgeCase) =>
          ({
            ...edgeCase,
            asyncType: "timeout" as const,
            dependencies: [],
          } as AsyncEdgeCaseInfo)
      );
  }
}
