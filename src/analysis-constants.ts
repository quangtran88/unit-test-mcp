// Constants for better maintainability
export const COMPLEXITY_THRESHOLDS = {
  SIMPLE_MAX: 3,
  MEDIUM_MAX: 7,
} as const;

export const TEST_COMPLEXITY_LIMITS = {
  MAX_COMPLEXITY: 10,
  PARAMETER_WEIGHT: 0.5,
} as const;

export const TYPE_DETECTION_PATTERNS = {
  ARRAY: ["[]", "Array<", "ReadonlyArray<"],
  STRING: ["string"],
  NUMBER: ["number", "bigint"],
  BOOLEAN: ["boolean"],
  OBJECT: ["{", "interface", "Record<", "object"],
  NULLABLE: ["null", "undefined"],
} as const;

export const ERROR_CONDITION_PATTERNS = [
  // Null/undefined checks
  /!.*\w+/,
  /.*===?\s*null/,
  /.*===?\s*undefined/,
  /.*!==?\s*null/,
  /.*!==?\s*undefined/,

  // Length/existence checks
  /!.*\.length/,
  /.*\.length\s*===?\s*0/,
  /.*\.length\s*<\s*1/,

  // Falsy checks
  /!.*\./,
  /.*===?\s*false/,
  /.*===?\s*""/,
  /.*===?\s*0/,

  // Validation patterns
  /.*\.isEmpty\(\)/,
  /.*\.isValid\(\)\s*===?\s*false/,
  /.*\.hasError/,
  /.*\.isInvalid/,

  // Type checks
  /typeof\s+.*\s*!==?\s*["'].*["']/,
  /.*instanceof\s+.*\s*===?\s*false/,
] as const;
