import { ClassDeclaration, MethodDeclaration, SyntaxKind } from "ts-morph";
import {
  COMPLEXITY_THRESHOLDS,
  TEST_COMPLEXITY_LIMITS,
} from "./analysis-constants.js";
import { DependencyAnalysis } from "./dependency-analyzer.js";

export interface MethodFlowAnalysis {
  name: string;
  complexity: "simple" | "medium" | "complex";
  flowType: "linear" | "conditional" | "loop" | "async-chain" | "error-prone";
  dependencyUsage: string[];
  errorPaths: ErrorPath[];
  sideEffects: SideEffect[];
  testComplexity: number;
  suggestedTestCases: string[];
}

export interface ErrorPath {
  condition: string;
  errorType: string;
  errorMessage?: string;
  isExpected: boolean;
  severity: "low" | "medium" | "high" | "critical";
  category: "validation" | "business-logic" | "system" | "security";
  recoverable: boolean;
  propagatesTo?: string[];
  nestedLevel: number;
  dependsOn?: string[];
}

export interface SideEffect {
  type: "database" | "network" | "notification" | "logging";
  description: string;
  needsMocking: boolean;
}

export class MethodFlowAnalyzer {
  analyzeMethodFlows(
    classDecl: ClassDeclaration,
    dependencies: DependencyAnalysis[]
  ): MethodFlowAnalysis[] {
    return (
      classDecl
        .getMethods()
        // Use proper SyntaxKind constant instead of magic number
        .filter((method) => !method.hasModifier(SyntaxKind.PrivateKeyword))
        .map((method) => this.analyzeMethodFlow(method, dependencies))
    );
  }

  private analyzeMethodFlow(
    method: MethodDeclaration,
    dependencies: DependencyAnalysis[]
  ): MethodFlowAnalysis {
    const name = method.getName();
    const complexity = this.calculateComplexity(method);
    const flowType = this.determineFlowType(method);
    const dependencyUsage = this.getMethodDependencyUsage(method, dependencies);
    const errorPaths: ErrorPath[] = []; // Will be populated by ErrorPathAnalyzer
    const sideEffects = this.analyzeSideEffects(method);
    const testComplexity = this.calculateTestComplexity(
      method,
      errorPaths,
      sideEffects
    );
    const suggestedTestCases = this.generateTestCaseSuggestions(
      method,
      errorPaths,
      flowType
    );

    return {
      name,
      complexity,
      flowType,
      dependencyUsage,
      errorPaths,
      sideEffects,
      testComplexity,
      suggestedTestCases,
    };
  }

  private calculateComplexity(
    method: MethodDeclaration
  ): "simple" | "medium" | "complex" {
    let complexity = 1;

    complexity += method.getDescendantsOfKind(SyntaxKind.IfStatement).length;
    complexity += method.getDescendantsOfKind(SyntaxKind.ForStatement).length;
    complexity += method.getDescendantsOfKind(SyntaxKind.WhileStatement).length;
    complexity += method.getDescendantsOfKind(
      SyntaxKind.SwitchStatement
    ).length;

    if (complexity <= COMPLEXITY_THRESHOLDS.SIMPLE_MAX) return "simple";
    if (complexity <= COMPLEXITY_THRESHOLDS.MEDIUM_MAX) return "medium";
    return "complex";
  }

  private determineFlowType(
    method: MethodDeclaration
  ): MethodFlowAnalysis["flowType"] {
    const hasLoops =
      method.getDescendantsOfKind(SyntaxKind.ForStatement).length > 0;
    const hasConditionals =
      method.getDescendantsOfKind(SyntaxKind.IfStatement).length > 0;
    const hasAwait =
      method.getDescendantsOfKind(SyntaxKind.AwaitExpression).length > 0;
    const hasErrorHandling =
      method.getDescendantsOfKind(SyntaxKind.TryStatement).length > 0;

    if (hasErrorHandling && hasAwait) return "error-prone";
    if (
      hasAwait &&
      method.getDescendantsOfKind(SyntaxKind.CallExpression).length > 3
    )
      return "async-chain";
    if (hasLoops) return "loop";
    if (hasConditionals) return "conditional";
    return "linear";
  }

  private getMethodDependencyUsage(
    method: MethodDeclaration,
    dependencies: DependencyAnalysis[]
  ): string[] {
    const used: string[] = [];
    const methodText = method.getText();

    dependencies.forEach((dep) => {
      if (methodText.includes(`this.${dep.name}`)) {
        used.push(dep.name);
      }
    });

    return used;
  }

  private analyzeSideEffects(method: MethodDeclaration): SideEffect[] {
    const sideEffects: SideEffect[] = [];
    const methodText = method.getText();

    if (
      this.containsPattern(methodText, [
        "save",
        "create",
        "update",
        "delete",
        "findOne",
      ])
    ) {
      sideEffects.push({
        type: "database",
        description: "Database operations detected",
        needsMocking: true,
      });
    }

    if (this.containsPattern(methodText, ["fetch", "axios", "http"])) {
      sideEffects.push({
        type: "network",
        description: "Network calls detected",
        needsMocking: true,
      });
    }

    if (this.containsPattern(methodText, ["email", "notification", "send"])) {
      sideEffects.push({
        type: "notification",
        description: "Notification sending detected",
        needsMocking: true,
      });
    }

    return sideEffects;
  }

  private containsPattern(text: string, patterns: string[]): boolean {
    return patterns.some((pattern) =>
      text.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private calculateTestComplexity(
    method: MethodDeclaration,
    errorPaths: ErrorPath[],
    sideEffects: SideEffect[]
  ): number {
    let complexity = 1;
    complexity +=
      method.getParameters().length * TEST_COMPLEXITY_LIMITS.PARAMETER_WEIGHT;
    complexity += errorPaths.length;
    complexity += sideEffects.filter((se) => se.needsMocking).length;
    return Math.min(
      Math.ceil(complexity),
      TEST_COMPLEXITY_LIMITS.MAX_COMPLEXITY
    );
  }

  private generateTestCaseSuggestions(
    method: MethodDeclaration,
    errorPaths: ErrorPath[],
    flowType: string
  ): string[] {
    const suggestions: string[] = [];

    suggestions.push(
      `should ${this.generateSuccessDescription(method.getName())}`
    );

    errorPaths.forEach((errorPath) => {
      if (errorPath.errorMessage) {
        suggestions.push(`should throw error: "${errorPath.errorMessage}"`);
      } else {
        suggestions.push(`should handle error when ${errorPath.condition}`);
      }
    });

    if (flowType === "conditional") {
      suggestions.push("should handle all conditional branches");
    }

    return suggestions;
  }

  private generateSuccessDescription(methodName: string): string {
    if (methodName.startsWith("get") || methodName.startsWith("find")) {
      return `return ${methodName.replace(/^(get|find)/, "").toLowerCase()}`;
    }
    if (methodName.startsWith("create")) {
      return `create new entity successfully`;
    }
    return `execute ${methodName} successfully`;
  }
}
