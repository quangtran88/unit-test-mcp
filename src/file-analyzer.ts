import * as fs from "fs";
import * as path from "path";
import {
  ClassDeclaration,
  MethodDeclaration,
  Project,
  SourceFile,
} from "ts-morph";
import { fileURLToPath } from "url";
import { AdvancedAnalysis, AdvancedAnalyzer } from "./advanced-analyzer.js";
import { PathResolver } from "./path-resolver.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FileStructure {
  filePath: string;
  className: string;
  methods: MethodInfo[];
  dependencies: string[];
  imports: string[];
  isService: boolean;
  isRepository: boolean;
  isController: boolean;
  advancedAnalysis?: AdvancedAnalysis;
}

export interface FileAnalysis {
  filePath: string;
  fileName: string;
  className?: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
  fileType:
    | "service"
    | "repository"
    | "controller"
    | "model"
    | "utility"
    | "unknown";
  hasConstructor: boolean;
  constructorParams: ParameterInfo[];
}

export interface MethodInfo {
  name: string;
  isPublic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isStatic: boolean;
  isAsync: boolean;
  parameters: ParameterInfo[];
  returnType?: string;
  decorators: string[];
}

export interface PropertyInfo {
  name: string;
  type?: string;
  isReadonly: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isStatic: boolean;
  decorators: string[];
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
}

export interface ImportInfo {
  source: string;
  imports: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportInfo {
  name: string;
  isDefault: boolean;
  type: "class" | "function" | "variable" | "interface" | "type";
}

export class FileAnalyzer {
  private project: Project;
  private advancedAnalyzer: AdvancedAnalyzer;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // Latest
        module: 1, // CommonJS
        allowJs: true,
        declaration: false,
      },
    });
    this.advancedAnalyzer = new AdvancedAnalyzer();
  }

  /**
   * Analyzes a TypeScript file and extracts its structure including classes, methods, and dependencies.
   *
   * NOTE: Method extraction now includes ALL methods (public, protected, and private) with access modifier metadata.
   * This enables comprehensive analysis for test generation that can cover internal logic, not just public interfaces.
   *
   * @param filePath - Path to the TypeScript file to analyze
   * @param methodName - Optional specific method name to analyze
   * @returns FileStructure with complete method information including access modifiers
   */
  async analyzeFile(
    filePath: string,
    methodName?: string
  ): Promise<FileStructure> {
    try {
      // Use PathResolver utility instead of local resolvePath method
      const resolvedPath = PathResolver.resolvePath(filePath);

      // Read the file content and add it manually to avoid path issues
      const fileContent = fs.readFileSync(resolvedPath, "utf-8");
      const sourceFile = this.project.createSourceFile(
        resolvedPath,
        fileContent,
        { overwrite: true }
      );

      return this.extractFileStructure(sourceFile, resolvedPath, methodName);
    } catch (error) {
      throw new Error(
        `Failed to analyze file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private extractFileStructure(
    sourceFile: SourceFile,
    filePath: string,
    methodName?: string
  ): FileStructure {
    const classes = sourceFile.getClasses();
    const imports = sourceFile
      .getImportDeclarations()
      .map((imp) => imp.getModuleSpecifierValue());

    if (classes.length === 0) {
      throw new Error("No classes found in the file");
    }

    const mainClass = classes[0]; // Assume first class is the main one
    const className = mainClass.getName() || "UnknownClass";

    // Extract all methods (public, protected, and private) with their access modifier metadata
    let allMethods = mainClass
      .getMethods()
      .map((method) => this.createMethodInfo(method));

    // Filter methods if methodName is provided
    let methods = allMethods;
    if (methodName) {
      methods = allMethods.filter((method) => method.name === methodName);
      if (methods.length === 0) {
        const availableMethodNames = allMethods.map((m) => m.name).join(", ");
        throw new Error(
          `Method '${methodName}' not found in class '${className}'. Available methods: ${availableMethodNames}`
        );
      }
    }

    const dependencies = this.extractDependencies(mainClass);

    // Determine the type of class
    const isService = this.isServiceClass(className, filePath);
    const isRepository = this.isRepositoryClass(className, filePath);
    const isController = this.isControllerClass(className, filePath);

    // Perform advanced analysis
    const advancedAnalysis = this.advancedAnalyzer.analyzeAdvanced(
      sourceFile,
      mainClass,
      methodName
    );

    return {
      filePath,
      className,
      methods,
      dependencies,
      imports,
      isService,
      isRepository,
      isController,
      advancedAnalysis,
    };
  }

  private extractDependencies(classDecl: ClassDeclaration): string[] {
    const constructor = classDecl.getConstructors()[0];
    if (!constructor) {
      return [];
    }

    return constructor.getParameters().map((param) => {
      const name = param.getName();
      const type = param.getTypeNode()?.getText() || "unknown";
      return `${name}: ${type}`;
    });
  }

  private isServiceClass(className: string, filePath: string): boolean {
    return (
      className.toLowerCase().includes("service") ||
      filePath.toLowerCase().includes("service")
    );
  }

  private isRepositoryClass(className: string, filePath: string): boolean {
    return (
      className.toLowerCase().includes("repository") ||
      filePath.toLowerCase().includes("repository")
    );
  }

  private isControllerClass(className: string, filePath: string): boolean {
    return (
      className.toLowerCase().includes("controller") ||
      filePath.toLowerCase().includes("controller")
    );
  }

  getDetailedAnalysis(fileStructure: FileStructure): string {
    if (!fileStructure.advancedAnalysis) {
      return "No advanced analysis available";
    }

    const analysis = fileStructure.advancedAnalysis;
    let report = `# Detailed Analysis for ${fileStructure.className}\n\n`;

    // Dependencies Analysis
    report += `## Dependencies (${analysis.dependencies.length})\n`;
    analysis.dependencies.forEach((dep) => {
      report += `- **${dep.name}** (${dep.type})\n`;
      report += `  - Mock Strategy: ${dep.mockStrategy}\n`;
      report += `  - Common Methods: ${dep.commonMethods.join(", ")}\n`;
      report += `  - Used in: ${dep.usage
        .map((u) => u.methodName)
        .join(", ")}\n\n`;
    });

    // Methods Analysis
    report += `## Methods Analysis (${analysis.methods.length})\n`;
    analysis.methods.forEach((method) => {
      report += `### ${method.name}\n`;
      report += `- **Complexity**: ${method.complexity}\n`;
      report += `- **Flow Type**: ${method.flowType}\n`;
      report += `- **Test Complexity**: ${method.testComplexity}/10\n`;
      report += `- **Dependencies Used**: ${method.dependencyUsage.join(
        ", "
      )}\n`;

      if (method.errorPaths.length > 0) {
        report += `- **Error Paths**: ${method.errorPaths.length}\n`;
        method.errorPaths.forEach((ep) => {
          report += `  - ${ep.condition} → ${ep.errorType}\n`;
        });
      }

      if (method.sideEffects.length > 0) {
        report += `- **Side Effects**: ${method.sideEffects
          .map((se) => se.type)
          .join(", ")}\n`;
      }

      report += `- **Suggested Test Cases**:\n`;
      method.suggestedTestCases.forEach((tc) => {
        report += `  - ${tc}\n`;
      });
      report += "\n";
    });

    // Business Logic Patterns
    if (analysis.businessLogicPatterns.length > 0) {
      report += `## Business Logic Patterns\n`;
      analysis.businessLogicPatterns.forEach((pattern) => {
        report += `- **${pattern.pattern.toUpperCase()}** pattern detected\n`;
        report += `  - Methods: ${pattern.methods.join(", ")}\n`;
        report += `  - Strategy: ${pattern.testStrategy}\n\n`;
      });
    }

    // Test Scenarios Summary
    report += `## Test Scenarios Summary\n`;
    const totalScenarios = analysis.testScenarios.reduce(
      (sum, ts) => sum + ts.scenarios.length,
      0
    );
    report += `Total test scenarios identified: ${totalScenarios}\n`;

    const priorityCount = analysis.testScenarios.reduce((acc, ts) => {
      ts.scenarios.forEach((s) => {
        acc[s.priority] = (acc[s.priority] || 0) + 1;
      });
      return acc;
    }, {} as Record<number, number>);

    report += `Priority breakdown: ${Object.entries(priorityCount)
      .map(([p, c]) => `P${p}:${c}`)
      .join(", ")}\n`;

    return report;
  }

  /**
   * Creates a MethodInfo object from a ts-morph MethodDeclaration.
   * Includes metadata for access modifiers (public, protected, private).
   *
   * @param method - The ts-morph MethodDeclaration to analyze
   * @returns MethodInfo object with complete method metadata
   */
  private createMethodInfo(method: MethodDeclaration): MethodInfo {
    // Determine access modifiers
    // SyntaxKind values: PrivateKeyword = 8, ProtectedKeyword = 9, PublicKeyword = 10
    const isPrivate = method.hasModifier(8);
    const isProtected = method.hasModifier(9);
    const isPublic = method.hasModifier(10) || (!isPrivate && !isProtected); // Default to public if no explicit modifier

    // Check for other modifiers
    const isStatic = method.isStatic();
    const isAsync = method.isAsync();

    // Extract parameters
    const parameters = method.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getTypeNode()?.getText(),
      isOptional: param.hasQuestionToken(),
      defaultValue: param.getInitializer()?.getText(),
    }));

    // Extract decorators
    const decorators = method
      .getDecorators()
      .map((decorator) => decorator.getName());

    // Get return type
    const returnType = method.getReturnTypeNode()?.getText();

    return {
      name: method.getName(),
      isPublic,
      isPrivate,
      isProtected,
      isStatic,
      isAsync,
      parameters,
      returnType,
      decorators,
    };
  }
}
