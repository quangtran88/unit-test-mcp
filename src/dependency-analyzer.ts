import {
  ClassDeclaration,
  MethodDeclaration,
  Node,
  SyntaxKind,
} from "ts-morph";
import { TypeAnalyzer } from "./type-analyzer.js";

export interface DependencyAnalysis {
  name: string;
  type: string;
  usage: DependencyUsage[];
  mockStrategy: "stub" | "spy" | "fake" | "real";
  commonMethods: string[];
}

export interface DependencyUsage {
  methodName: string;
  calls: string[];
  isConditional: boolean;
  errorHandling: boolean;
}

export class DependencyAnalyzer {
  private typeAnalyzer = new TypeAnalyzer();

  analyzeDependencies(classDecl: ClassDeclaration): DependencyAnalysis[] {
    const constructor = classDecl.getConstructors()[0];
    if (!constructor) return [];

    return constructor.getParameters().map((param) => {
      const name = param.getName();
      const type = this.typeAnalyzer.getParameterTypeText(param);

      const usage = this.analyzeDependencyUsage(classDecl, name);
      const mockStrategy = this.determineMockStrategy(type, usage);
      const commonMethods = this.extractCommonMethods(usage);

      return {
        name,
        type,
        usage,
        mockStrategy,
        commonMethods,
      };
    });
  }

  private analyzeDependencyUsage(
    classDecl: ClassDeclaration,
    depName: string
  ): DependencyUsage[] {
    const methods = classDecl.getMethods();
    const usage: DependencyUsage[] = [];

    methods.forEach((method) => {
      const calls = this.findDependencyCalls(method, depName);
      if (calls.length > 0) {
        usage.push({
          methodName: method.getName(),
          calls,
          isConditional: this.hasConditionalCalls(method, depName),
          errorHandling: this.hasErrorHandling(method, depName),
        });
      }
    });

    return usage;
  }

  private findDependencyCalls(
    method: MethodDeclaration,
    depName: string
  ): string[] {
    const calls: string[] = [];

    method.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expression = call.getExpression();
      if (Node.isPropertyAccessExpression(expression)) {
        const objectName = expression.getExpression().getText();
        if (objectName === `this.${depName}`) {
          calls.push(expression.getName());
        }
      }
    });

    return [...new Set(calls)];
  }

  private hasConditionalCalls(
    method: MethodDeclaration,
    depName: string
  ): boolean {
    return method
      .getDescendantsOfKind(SyntaxKind.IfStatement)
      .some((ifStmt) => ifStmt.getText().includes(`this.${depName}`));
  }

  private hasErrorHandling(
    method: MethodDeclaration,
    depName: string
  ): boolean {
    const hasTryCatch = method
      .getDescendantsOfKind(SyntaxKind.TryStatement)
      .some((tryStmt) => tryStmt.getText().includes(`this.${depName}`));

    const hasThrow =
      method.getDescendantsOfKind(SyntaxKind.ThrowStatement).length > 0;

    return hasTryCatch || hasThrow;
  }

  private determineMockStrategy(
    type: string,
    usage: DependencyUsage[]
  ): "stub" | "spy" | "fake" | "real" {
    const totalCalls = usage.reduce((sum, u) => sum + u.calls.length, 0);
    const hasComplexInteraction = usage.some(
      (u) => u.isConditional || u.errorHandling
    );

    if (type.toLowerCase().includes("repository")) {
      return "stub";
    }

    if (type.toLowerCase().includes("service") && hasComplexInteraction) {
      return "spy";
    }

    if (totalCalls > 5) {
      return "fake";
    }

    return "stub";
  }

  private extractCommonMethods(usage: DependencyUsage[]): string[] {
    const allCalls = usage.flatMap((u) => u.calls);
    const frequency = allCalls.reduce((acc, call) => {
      acc[call] = (acc[call] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .filter(([_, count]) => count > 1)
      .map(([call, _]) => call);
  }

  getMethodDependencyUsage(
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
}
