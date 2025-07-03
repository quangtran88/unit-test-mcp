import {
  ClassDeclaration,
  MethodDeclaration,
  SourceFile,
  SyntaxKind,
} from "ts-morph";

export interface ConcurrencyAnalysis {
  hasAsyncOperations: boolean;
  promiseChains: PromiseChainInfo[];
  raceConditions: RaceConditionInfo[];
  sharedResources: SharedResourceInfo[];
  asyncPatterns: AsyncPatternInfo[];
}

export interface PromiseChainInfo {
  depth: number;
  hasErrorHandling: boolean;
  hasFinally: boolean;
  canReject: boolean;
  operations: string[];
}

export interface RaceConditionInfo {
  type: "read-write" | "write-write" | "resource-access";
  resources: string[];
  methods: string[];
  likelihood: "low" | "medium" | "high";
}

export interface SharedResourceInfo {
  name: string;
  type: "database" | "file" | "memory" | "network";
  accessPatterns: string[];
  needsSynchronization: boolean;
}

export interface AsyncPatternInfo {
  pattern:
    | "fire-and-forget"
    | "parallel-execution"
    | "sequential-chain"
    | "timeout-retry";
  methods: string[];
  riskLevel: "low" | "medium" | "high";
}

export class ConcurrencyAnalyzer {
  analyzeConcurrency(
    sourceFile: SourceFile,
    mainClass: ClassDeclaration
  ): ConcurrencyAnalysis {
    const methods = mainClass.getMethods();
    const hasAsyncOperations = methods.some(
      (method) =>
        method.hasModifier(SyntaxKind.AsyncKeyword) ||
        method.getText().includes("Promise") ||
        method.getText().includes("await")
    );

    const promiseChains = this.analyzePromiseChains(methods);
    const raceConditions = this.detectRaceConditions(methods);
    const sharedResources = this.identifySharedResources(mainClass);
    const asyncPatterns = this.detectAsyncPatterns(methods);

    return {
      hasAsyncOperations,
      promiseChains,
      raceConditions,
      sharedResources,
      asyncPatterns,
    };
  }

  private analyzePromiseChains(
    methods: MethodDeclaration[]
  ): PromiseChainInfo[] {
    return methods
      .filter(
        (method) =>
          method.hasModifier(SyntaxKind.AsyncKeyword) ||
          method.getText().includes("Promise")
      )
      .map((method) => {
        const methodText = method.getText();
        const awaitCount = (methodText.match(/await/g) || []).length;
        const thenCount = (methodText.match(/\.then\(/g) || []).length;
        const catchCount = (methodText.match(/\.catch\(/g) || []).length;
        const finallyCount = (methodText.match(/\.finally\(/g) || []).length;

        const operations = this.extractAsyncOperations(methodText);

        return {
          depth: Math.max(awaitCount, thenCount),
          hasErrorHandling: catchCount > 0 || methodText.includes("try"),
          hasFinally: finallyCount > 0,
          canReject:
            methodText.includes("reject") || methodText.includes("throw"),
          operations,
        };
      });
  }

  private detectRaceConditions(
    methods: MethodDeclaration[]
  ): RaceConditionInfo[] {
    const raceConditions: RaceConditionInfo[] = [];
    const sharedResourceAccess = new Map<string, string[]>();

    // Analyze shared resource access patterns
    methods.forEach((method) => {
      const methodName = method.getName();
      const methodText = method.getText();

      // Detect database access
      if (
        methodText.includes("repository") ||
        methodText.includes("query") ||
        methodText.includes("transaction")
      ) {
        const dbResources = this.extractDatabaseResources(methodText);
        dbResources.forEach((resource) => {
          if (!sharedResourceAccess.has(resource)) {
            sharedResourceAccess.set(resource, []);
          }
          sharedResourceAccess.get(resource)?.push(methodName);
        });
      }

      // Detect file system access
      if (
        methodText.includes("fs.") ||
        methodText.includes("writeFile") ||
        methodText.includes("readFile")
      ) {
        const fileResources = this.extractFileResources(methodText);
        fileResources.forEach((resource) => {
          if (!sharedResourceAccess.has(resource)) {
            sharedResourceAccess.set(resource, []);
          }
          sharedResourceAccess.get(resource)?.push(methodName);
        });
      }
    });

    // Identify potential race conditions
    sharedResourceAccess.forEach((accessingMethods, resource) => {
      if (accessingMethods.length > 1) {
        const hasWrites = accessingMethods.some((methodName) => {
          const method = methods.find((m) => m.getName() === methodName);
          return method && this.isWriteOperation(method);
        });

        if (hasWrites) {
          raceConditions.push({
            type: "read-write",
            resources: [resource],
            methods: accessingMethods,
            likelihood: accessingMethods.length > 2 ? "high" : "medium",
          });
        }
      }
    });

    return raceConditions;
  }

  private identifySharedResources(
    classDecl: ClassDeclaration
  ): SharedResourceInfo[] {
    const resources: SharedResourceInfo[] = [];
    const classText = classDecl.getText();

    // Database resources
    if (classText.includes("repository") || classText.includes("Repository")) {
      resources.push({
        name: "database",
        type: "database",
        accessPatterns: ["read", "write", "transaction"],
        needsSynchronization: true,
      });
    }

    // File system resources
    if (classText.includes("fs.") || classText.includes("file")) {
      resources.push({
        name: "filesystem",
        type: "file",
        accessPatterns: ["read", "write"],
        needsSynchronization: true,
      });
    }

    // Network resources
    if (
      classText.includes("http") ||
      classText.includes("fetch") ||
      classText.includes("axios")
    ) {
      resources.push({
        name: "network",
        type: "network",
        accessPatterns: ["request", "response"],
        needsSynchronization: false,
      });
    }

    // Memory resources (caches, etc.)
    if (classText.includes("cache") || classText.includes("Cache")) {
      resources.push({
        name: "cache",
        type: "memory",
        accessPatterns: ["get", "set", "delete"],
        needsSynchronization: true,
      });
    }

    return resources;
  }

  private detectAsyncPatterns(
    methods: MethodDeclaration[]
  ): AsyncPatternInfo[] {
    const patterns: AsyncPatternInfo[] = [];

    methods.forEach((method) => {
      const methodText = method.getText();

      // Fire-and-forget pattern
      if (methodText.includes("void ") && methodText.includes("async")) {
        patterns.push({
          pattern: "fire-and-forget",
          methods: [method.getName()],
          riskLevel: "medium",
        });
      }

      // Parallel execution pattern
      if (
        methodText.includes("Promise.all") ||
        methodText.includes("Promise.allSettled")
      ) {
        patterns.push({
          pattern: "parallel-execution",
          methods: [method.getName()],
          riskLevel: "medium",
        });
      }

      // Sequential chain pattern
      if ((methodText.match(/await/g) || []).length > 3) {
        patterns.push({
          pattern: "sequential-chain",
          methods: [method.getName()],
          riskLevel: "low",
        });
      }

      // Timeout/retry pattern
      if (
        methodText.includes("setTimeout") ||
        methodText.includes("retry") ||
        methodText.includes("timeout")
      ) {
        patterns.push({
          pattern: "timeout-retry",
          methods: [method.getName()],
          riskLevel: "high",
        });
      }
    });

    return patterns;
  }

  // Helper methods
  private extractAsyncOperations(methodText: string): string[] {
    const operations: string[] = [];

    // Extract await expressions
    const awaitMatches = methodText.match(/await\s+([^;,\s\)]+)/g);
    if (awaitMatches) {
      operations.push(
        ...awaitMatches.map((match) => match.replace("await ", ""))
      );
    }

    // Extract Promise.then chains
    const thenMatches = methodText.match(/\.then\([^)]+\)/g);
    if (thenMatches) {
      operations.push(...thenMatches);
    }

    return operations;
  }

  private extractDatabaseResources(methodText: string): string[] {
    const resources: string[] = [];

    // Extract table names from repository calls
    const tableMatches = methodText.match(/repository\.(\w+)/g);
    if (tableMatches) {
      resources.push(...tableMatches.map((match) => match.split(".")[1]));
    }

    // Extract query targets
    const queryMatches = methodText.match(/query\(['"`](\w+)['"`]\)/g);
    if (queryMatches) {
      resources.push(
        ...queryMatches.map((match) => match.match(/['"`](\w+)['"`]/)![1])
      );
    }

    return resources;
  }

  private extractFileResources(methodText: string): string[] {
    const resources: string[] = [];

    // Extract file paths
    const fileMatches = methodText.match(/['"`]([^'"`]*\.[a-zA-Z0-9]+)['"`]/g);
    if (fileMatches) {
      resources.push(
        ...fileMatches.map((match) => match.replace(/['"`]/g, ""))
      );
    }

    return resources;
  }

  private isWriteOperation(method: MethodDeclaration): boolean {
    const methodText = method.getText();
    const writePatterns = [
      "create",
      "update",
      "delete",
      "insert",
      "save",
      "write",
    ];
    return writePatterns.some(
      (pattern) =>
        method.getName().toLowerCase().includes(pattern) ||
        methodText.toLowerCase().includes(pattern)
    );
  }
}
