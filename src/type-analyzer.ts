import { ParameterDeclaration } from "ts-morph";
import { TYPE_DETECTION_PATTERNS } from "./analysis-constants.js";

export class TypeAnalyzer {
  /**
   * Gets reliable type text from a parameter, handling complex types and fallbacks
   */
  getParameterTypeText(param: ParameterDeclaration): string {
    try {
      // First try to get the actual type (more reliable for complex types)
      const type = param.getType();
      if (type) {
        const typeText = type.getText(param);
        if (typeText && typeText !== "unknown" && typeText !== "any") {
          return typeText;
        }
      }

      // Fallback to type node if available
      const typeNode = param.getTypeNode();
      if (typeNode) {
        const nodeText = typeNode.getText();
        if (nodeText && nodeText !== "unknown" && nodeText !== "any") {
          return nodeText;
        }
      }

      // Try to infer from parameter name patterns
      const paramName = param.getName().toLowerCase();
      if (paramName.includes("repository") || paramName.includes("repo")) {
        return "Repository";
      }
      if (paramName.includes("service")) {
        return "Service";
      }
      if (paramName.includes("logger")) {
        return "Logger";
      }

      // Final fallback
      return "unknown";
    } catch (error) {
      // Graceful degradation if type analysis fails
      console.warn(
        `Failed to analyze parameter type for ${param.getName()}:`,
        error
      );
      return "unknown";
    }
  }

  isArrayType(type: string): boolean {
    const cleanType = type.trim();

    // Check for direct array patterns
    const hasArrayPattern = TYPE_DETECTION_PATTERNS.ARRAY.some((pattern) =>
      cleanType.includes(pattern)
    );

    if (hasArrayPattern) {
      return true;
    }

    // Check for union types containing arrays
    if (cleanType.includes("|")) {
      const unionParts = cleanType.split("|").map((part) => part.trim());
      return unionParts.some((part) =>
        TYPE_DETECTION_PATTERNS.ARRAY.some((pattern) => part.includes(pattern))
      );
    }

    return false;
  }

  isStringType(type: string): boolean {
    const cleanType = type.trim();

    // Direct string type check
    if (
      TYPE_DETECTION_PATTERNS.STRING.some((pattern) => cleanType === pattern)
    ) {
      return true;
    }

    // Check for union types containing string
    if (cleanType.includes("|")) {
      const unionParts = cleanType.split("|").map((part) => part.trim());
      return unionParts.some((part) =>
        TYPE_DETECTION_PATTERNS.STRING.some((pattern) => part === pattern)
      );
    }

    // Check for string literal types
    return /^["'].*["']$/.test(cleanType) || cleanType.includes("string");
  }

  isNumberType(type: string): boolean {
    const cleanType = type.trim();

    // Direct number type check
    if (
      TYPE_DETECTION_PATTERNS.NUMBER.some((pattern) => cleanType === pattern)
    ) {
      return true;
    }

    // Check for union types containing number
    if (cleanType.includes("|")) {
      const unionParts = cleanType.split("|").map((part) => part.trim());
      return unionParts.some((part) =>
        TYPE_DETECTION_PATTERNS.NUMBER.some((pattern) => part === pattern)
      );
    }

    // Check for numeric literal types
    return /^\d+$/.test(cleanType);
  }

  isObjectType(type: string): boolean {
    const cleanType = type.trim();

    // Exclude primitive types first
    if (
      this.isArrayType(cleanType) ||
      this.isStringType(cleanType) ||
      this.isNumberType(cleanType) ||
      TYPE_DETECTION_PATTERNS.BOOLEAN.some((pattern) =>
        cleanType.includes(pattern)
      )
    ) {
      return false;
    }

    // Check for object patterns
    const hasObjectPattern = TYPE_DETECTION_PATTERNS.OBJECT.some((pattern) =>
      cleanType.includes(pattern)
    );

    if (hasObjectPattern) {
      return true;
    }

    // Check for union types containing objects
    if (cleanType.includes("|")) {
      const unionParts = cleanType.split("|").map((part) => part.trim());
      return unionParts.some((part) => {
        const isNotPrimitive =
          !this.isArrayType(part) &&
          !this.isStringType(part) &&
          !this.isNumberType(part) &&
          !TYPE_DETECTION_PATTERNS.BOOLEAN.some((pattern) =>
            part.includes(pattern)
          ) &&
          !TYPE_DETECTION_PATTERNS.NULLABLE.some((pattern) =>
            part.includes(pattern)
          );
        return (
          isNotPrimitive &&
          TYPE_DETECTION_PATTERNS.OBJECT.some((pattern) =>
            part.includes(pattern)
          )
        );
      });
    }

    // Assume complex types are objects if not primitives
    return (
      !cleanType.includes("void") &&
      !cleanType.includes("never") &&
      cleanType !== "unknown"
    );
  }

  isOptionalOrNullable(param: ParameterDeclaration): boolean {
    try {
      // Check for explicit optional parameter (parameter?)
      if (param.hasQuestionToken()) {
        return true;
      }

      // Check the type node for null/undefined
      const typeNode = param.getTypeNode();
      if (typeNode) {
        const typeText = typeNode.getText();
        if (this.typeIncludesNullish(typeText)) {
          return true;
        }
      }

      // Check the actual type for null/undefined (more reliable for complex types)
      const type = param.getType();
      if (type) {
        const typeText = type.getText(param);
        if (this.typeIncludesNullish(typeText)) {
          return true;
        }

        // Check if the type is a union type containing null/undefined
        if (type.isUnion()) {
          const unionTypes = type.getUnionTypes();
          return unionTypes.some((unionType) => {
            const unionTypeText = unionType.getText(param);
            return TYPE_DETECTION_PATTERNS.NULLABLE.some((pattern) =>
              unionTypeText.includes(pattern)
            );
          });
        }
      }

      // Check for default value (implicitly optional)
      if (param.hasInitializer()) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn(
        `Failed to analyze parameter optionality for ${param.getName()}:`,
        error
      );
      // Conservative fallback - assume not optional if analysis fails
      return false;
    }
  }

  /**
   * Helper method to check if a type string includes null or undefined
   */
  private typeIncludesNullish(typeText: string): boolean {
    if (!typeText) return false;

    const cleanType = typeText.trim();

    // Direct checks
    if (
      TYPE_DETECTION_PATTERNS.NULLABLE.some((pattern) =>
        cleanType.includes(pattern)
      )
    ) {
      return true;
    }

    // Union type checks
    if (cleanType.includes("|")) {
      const unionParts = cleanType.split("|").map((part) => part.trim());
      return unionParts.some((part) =>
        TYPE_DETECTION_PATTERNS.NULLABLE.some((pattern) => part === pattern)
      );
    }

    return false;
  }

  getJSType(typeString?: string): string {
    if (!typeString) return "unknown";
    if (typeString.includes("string")) return "string";
    if (typeString.includes("number")) return "number";
    if (typeString.includes("boolean")) return "boolean";
    if (typeString.includes("object")) return "object";
    return "object";
  }
}
