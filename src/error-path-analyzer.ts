import { MethodDeclaration, Node, SyntaxKind } from "ts-morph";
import { ERROR_CONDITION_PATTERNS } from "./analysis-constants.js";
import { ErrorPath } from "./method-flow-analyzer.js";

export class ErrorPathAnalyzer {
  analyzeErrorPaths(method: MethodDeclaration): ErrorPath[] {
    const errorPaths: ErrorPath[] = [];

    // Analyze throw statements
    errorPaths.push(...this.analyzeThrowStatements(method));

    // Analyze conditional errors
    errorPaths.push(...this.analyzeConditionalErrors(method));

    // Analyze try-catch blocks
    errorPaths.push(...this.analyzeTryCatchBlocks(method));

    // Analyze async error patterns
    if (method.hasModifier(SyntaxKind.AsyncKeyword)) {
      errorPaths.push(...this.analyzeAsyncErrorPaths(method));
    }

    return errorPaths;
  }

  private analyzeThrowStatements(method: MethodDeclaration): ErrorPath[] {
    const errorPaths: ErrorPath[] = [];

    method
      .getDescendantsOfKind(SyntaxKind.ThrowStatement)
      .forEach((throwStmt, index) => {
        const errorMessage = this.extractErrorMessage(throwStmt);
        const errorType = this.extractErrorType(throwStmt);
        const nestedLevel = this.calculateNestingLevel(throwStmt);
        const category = this.categorizeError(errorType, errorMessage);
        const severity = this.assessErrorSeverity(errorType, category);

        // Create more specific condition based on error message/type or context
        const condition = this.generateSpecificCondition(
          throwStmt,
          errorMessage,
          errorType,
          index
        );

        errorPaths.push({
          condition,
          errorType,
          errorMessage,
          isExpected: true,
          severity,
          category,
          recoverable: this.isRecoverableError(errorType, category),
          nestedLevel,
          propagatesTo: ["caller"],
          dependsOn: [],
        });
      });

    return errorPaths;
  }

  private generateSpecificCondition(
    throwStmt: any,
    errorMessage?: string,
    errorType?: string,
    index?: number
  ): string {
    // Try to extract meaningful condition from error message
    if (errorMessage) {
      const message = errorMessage.toLowerCase();

      if (message.includes("required") || message.includes("missing")) {
        return "missing required parameter";
      }
      if (message.includes("invalid") || message.includes("bad")) {
        return "invalid input provided";
      }
      if (message.includes("not found") || message.includes("does not exist")) {
        return "entity not found";
      }
      if (message.includes("unauthorized") || message.includes("permission")) {
        return "unauthorized access";
      }
      if (message.includes("duplicate") || message.includes("already exists")) {
        return "duplicate entity";
      }
      if (message.includes("validation")) {
        return "validation error";
      }
      if (message.includes("positive") || message.includes("negative")) {
        return "value validation error";
      }
      if (message.includes("format") || message.includes("email")) {
        return "format validation error";
      }
    }

    // Try to extract condition from error type
    if (errorType) {
      const type = errorType.toLowerCase();
      if (type.includes("validation")) {
        return "validation failure";
      }
      if (type.includes("notfound")) {
        return "resource not found";
      }
      if (type.includes("unauthorized")) {
        return "access denied";
      }
      if (type.includes("conflict")) {
        return "resource conflict";
      }
    }

    // Try to get context from surrounding code
    const parentContext = this.getParentContext(throwStmt);
    if (parentContext) {
      return parentContext;
    }

    // If all else fails, use explicit throw with index to differentiate
    const suffix = index !== undefined && index > 0 ? ` (${index + 1})` : "";
    return `explicit throw${suffix}`;
  }

  private getParentContext(throwStmt: any): string | null {
    let current = throwStmt.getParent();

    // Look for meaningful parent context
    while (current) {
      if (current.getKind() === SyntaxKind.IfStatement) {
        const condition = current.getExpression()?.getText();
        if (condition) {
          if (
            condition.includes("!") ||
            condition.includes("null") ||
            condition.includes("undefined")
          ) {
            return "null check failed";
          }
          if (condition.includes("length") && condition.includes("0")) {
            return "empty collection";
          }
          if (condition.includes("===") || condition.includes("!==")) {
            return "equality check failed";
          }
          return `condition check: ${condition.slice(0, 30)}...`;
        }
      }
      if (current.getKind() === SyntaxKind.CatchClause) {
        return "exception caught";
      }
      if (current.getKind() === SyntaxKind.MethodDeclaration) {
        break;
      }
      current = current.getParent();
    }

    return null;
  }

  private analyzeConditionalErrors(method: MethodDeclaration): ErrorPath[] {
    const errorPaths: ErrorPath[] = [];

    method.getDescendantsOfKind(SyntaxKind.IfStatement).forEach((ifStmt) => {
      const condition = ifStmt.getExpression().getText();

      if (this.isErrorCondition(condition)) {
        const errorType = this.inferErrorTypeFromCondition(condition);
        const nestedLevel = this.calculateNestingLevel(ifStmt);
        const category = this.categorizeErrorCondition(condition);
        const severity = this.assessConditionSeverity(condition, category);

        errorPaths.push({
          condition,
          errorType,
          isExpected: true,
          severity,
          category,
          recoverable: true,
          nestedLevel,
          propagatesTo: ["caller"],
          dependsOn: [],
        });
      }
    });

    return errorPaths;
  }

  private analyzeTryCatchBlocks(method: MethodDeclaration): ErrorPath[] {
    const errorPaths: ErrorPath[] = [];

    method.getDescendantsOfKind(SyntaxKind.TryStatement).forEach((tryStmt) => {
      const catchClause = tryStmt.getCatchClause();
      if (catchClause) {
        const nestedLevel = this.calculateNestingLevel(tryStmt);
        const hasFinally = tryStmt.getFinallyBlock() !== undefined;
        const isNested = nestedLevel > 1;

        errorPaths.push({
          condition: "try-catch block",
          errorType: "CaughtError",
          isExpected: true,
          severity: isNested ? "high" : "medium",
          category: "system",
          recoverable: hasFinally,
          nestedLevel,
          propagatesTo: ["caller"],
          dependsOn: [],
        });
      }
    });

    return errorPaths;
  }

  private analyzeAsyncErrorPaths(method: MethodDeclaration): ErrorPath[] {
    const errorPaths: ErrorPath[] = [];
    const methodText = method.getText();

    if (
      methodText.includes("reject") ||
      methodText.includes("Promise.reject")
    ) {
      errorPaths.push({
        condition: "promise rejection",
        errorType: "PromiseRejection",
        isExpected: true,
        severity: "medium",
        category: "system",
        recoverable: true,
        nestedLevel: 0,
        propagatesTo: ["caller"],
      });
    }

    return errorPaths;
  }

  private calculateNestingLevel(node: any): number {
    let level = 0;
    let current = node.getParent();

    while (current) {
      if (
        current.getKind() === SyntaxKind.IfStatement ||
        current.getKind() === SyntaxKind.TryStatement ||
        current.getKind() === SyntaxKind.ForStatement ||
        current.getKind() === SyntaxKind.WhileStatement ||
        current.getKind() === SyntaxKind.SwitchStatement
      ) {
        level++;
      }
      current = current.getParent();

      if (current?.getKind() === SyntaxKind.MethodDeclaration) {
        break;
      }
    }

    return level;
  }

  private categorizeError(
    errorType: string,
    errorMessage?: string
  ): ErrorPath["category"] {
    const errorText = `${errorType} ${errorMessage || ""}`.toLowerCase();

    if (
      errorText.includes("validation") ||
      errorText.includes("invalid") ||
      errorText.includes("required")
    ) {
      return "validation";
    }
    if (
      errorText.includes("permission") ||
      errorText.includes("unauthorized") ||
      errorText.includes("forbidden")
    ) {
      return "security";
    }
    if (
      errorText.includes("not found") ||
      errorText.includes("exists") ||
      errorText.includes("business")
    ) {
      return "business-logic";
    }

    return "system";
  }

  private assessErrorSeverity(
    errorType: string,
    category: ErrorPath["category"]
  ): ErrorPath["severity"] {
    if (category === "security") return "critical";
    if (category === "system" && errorType.includes("Database")) return "high";
    if (category === "business-logic") return "medium";
    if (category === "validation") return "low";

    return "medium";
  }

  private isRecoverableError(
    errorType: string,
    category: ErrorPath["category"]
  ): boolean {
    if (category === "validation") return true;
    if (category === "business-logic") return true;
    if (category === "security") return false;
    if (errorType.includes("Fatal") || errorType.includes("Critical"))
      return false;

    return true;
  }

  private extractErrorMessage(throwStmt: any): string | undefined {
    try {
      const expression = throwStmt.getExpression();

      if (Node.isNewExpression(expression)) {
        const args = expression.getArguments();
        if (args.length > 0) {
          const firstArg = args[0];
          if (Node.isStringLiteral(firstArg)) {
            return firstArg.getLiteralValue();
          }
        }
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  private extractErrorType(throwStmt: any): string {
    try {
      const expression = throwStmt.getExpression();

      if (Node.isNewExpression(expression)) {
        const identifier = expression.getExpression();
        if (Node.isIdentifier(identifier)) {
          return identifier.getText();
        }
      }

      return "Error";
    } catch (error) {
      return "Error";
    }
  }

  private isErrorCondition(condition: string): boolean {
    const cleanCondition = condition.trim().replace(/\s+/g, " ");

    const matchesPattern = ERROR_CONDITION_PATTERNS.some((pattern) =>
      pattern.test(cleanCondition)
    );

    if (matchesPattern) {
      return true;
    }

    const errorKeywords = [
      "invalid",
      "error",
      "fail",
      "missing",
      "empty",
      "null",
      "undefined",
    ];

    return errorKeywords.some((keyword) =>
      cleanCondition.toLowerCase().includes(keyword)
    );
  }

  private inferErrorTypeFromCondition(condition: string): string {
    const lowerCondition = condition.toLowerCase();

    if (
      lowerCondition.includes("null") ||
      lowerCondition.includes("undefined")
    ) {
      return "NullReferenceError";
    }
    if (lowerCondition.includes("length") || lowerCondition.includes("empty")) {
      return "ValidationError";
    }
    if (
      lowerCondition.includes("valid") ||
      lowerCondition.includes("invalid")
    ) {
      return "ValidationError";
    }

    return "ValidationError";
  }

  private categorizeErrorCondition(condition: string): ErrorPath["category"] {
    const conditionLower = condition.toLowerCase();

    if (
      conditionLower.includes("null") ||
      conditionLower.includes("undefined") ||
      conditionLower.includes("empty")
    ) {
      return "validation";
    }
    if (
      conditionLower.includes("permission") ||
      conditionLower.includes("role")
    ) {
      return "security";
    }
    if (conditionLower.includes("exist") || conditionLower.includes("found")) {
      return "business-logic";
    }

    return "system";
  }

  private assessConditionSeverity(
    condition: string,
    category: ErrorPath["category"]
  ): ErrorPath["severity"] {
    if (category === "security") return "high";
    if (condition.includes("!") && category === "business-logic")
      return "medium";

    return "low";
  }
}
