export interface MethodTestStatus {
  methodName: string;
  complexity: number;
  hasTests: boolean;
  testPath?: string;
  priority: "high" | "medium" | "low";
  dependencies: string[];
  errorCount: number;
  lastUpdated?: Date;
}

export interface TestGenerationSession {
  sessionId: string;
  filePath: string;
  className: string;
  testType: string;
  outputPath: string;
  methods: MethodTestStatus[];
  completedMethods: string[];
  currentMethod?: string;
  totalMethods: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface TestGenerationPlan {
  sessionId: string;
  phases: TestPhase[];
  currentPhase: number;
  estimatedTime: string;
  methodology: string;
}

export interface TestPhase {
  phaseNumber: number;
  name: string;
  methods: string[];
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedTime: string;
  completed: boolean;
}

export class SessionStateManager {
  private sessions: Map<string, TestGenerationSession> = new Map();
  private plans: Map<string, TestGenerationPlan> = new Map();

  createSession(
    filePath: string,
    className: string,
    testType: string,
    outputPath: string,
    methods: MethodTestStatus[]
  ): TestGenerationSession {
    const sessionId = this.generateSessionId();
    const session: TestGenerationSession = {
      sessionId,
      filePath,
      className,
      testType,
      outputPath,
      methods,
      completedMethods: [],
      totalMethods: methods.length,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): TestGenerationSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateMethodStatus(
    sessionId: string,
    methodName: string,
    hasTests: boolean,
    testPath?: string
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const method = session.methods.find((m) => m.methodName === methodName);
    if (!method) return false;

    method.hasTests = hasTests;
    method.testPath = testPath;
    method.lastUpdated = new Date();

    if (hasTests && !session.completedMethods.includes(methodName)) {
      session.completedMethods.push(methodName);
    }

    session.lastActivity = new Date();
    return true;
  }

  getNextMethod(sessionId: string): MethodTestStatus | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Find the next method that doesn't have tests, prioritized by complexity and dependencies
    const untestedMethods = session.methods.filter((m) => !m.hasTests);
    if (untestedMethods.length === 0) return null;

    // Sort by priority (high -> medium -> low) then by complexity (higher first)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    untestedMethods.sort((a, b) => {
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.complexity - a.complexity;
    });

    return untestedMethods[0];
  }

  getProgress(
    sessionId: string
  ): {
    completed: number;
    total: number;
    percentage: number;
    remaining: string[];
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const completed = session.completedMethods.length;
    const total = session.totalMethods;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining = session.methods
      .filter((m) => !m.hasTests)
      .map((m) => m.methodName);

    return { completed, total, percentage, remaining };
  }

  createPlan(
    sessionId: string,
    methods: MethodTestStatus[]
  ): TestGenerationPlan {
    const phases = this.createPhases(methods);
    const plan: TestGenerationPlan = {
      sessionId,
      phases,
      currentPhase: 0,
      estimatedTime: this.calculateEstimatedTime(methods),
      methodology: "Complexity-driven test generation with dependency analysis",
    };

    this.plans.set(sessionId, plan);
    return plan;
  }

  getPlan(sessionId: string): TestGenerationPlan | undefined {
    return this.plans.get(sessionId);
  }

  updatePlanProgress(sessionId: string, completedMethod: string): boolean {
    const plan = this.plans.get(sessionId);
    if (!plan) return false;

    // Find which phase this method belongs to and update accordingly
    for (let i = 0; i < plan.phases.length; i++) {
      const phase = plan.phases[i];
      if (phase.methods.includes(completedMethod)) {
        const allMethodsCompleted = phase.methods.every((method) => {
          const session = this.sessions.get(sessionId);
          return session?.completedMethods.includes(method);
        });

        if (allMethodsCompleted) {
          phase.completed = true;
          if (i === plan.currentPhase) {
            plan.currentPhase = Math.min(i + 1, plan.phases.length - 1);
          }
        }
        return true;
      }
    }

    return false;
  }

  private generateSessionId(): string {
    return `test-session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private createPhases(methods: MethodTestStatus[]): TestPhase[] {
    const phases: TestPhase[] = [];

    // Phase 1: Critical and High Priority Methods
    const criticalMethods = methods.filter(
      (m) => m.priority === "high" || m.complexity >= 8
    );
    if (criticalMethods.length > 0) {
      phases.push({
        phaseNumber: 1,
        name: "Critical Methods",
        methods: criticalMethods.map((m) => m.methodName),
        description:
          "Test core business logic and high-complexity methods first",
        priority: "critical",
        estimatedTime: `${criticalMethods.length * 8}min`,
        completed: false,
      });
    }

    // Phase 2: Medium Priority and Dependencies
    const mediumMethods = methods.filter(
      (m) =>
        m.priority === "medium" ||
        (m.complexity >= 4 && m.complexity < 8) ||
        m.dependencies.length > 0
    );
    if (mediumMethods.length > 0) {
      phases.push({
        phaseNumber: 2,
        name: "Core Methods",
        methods: mediumMethods.map((m) => m.methodName),
        description: "Test methods with dependencies and moderate complexity",
        priority: "high",
        estimatedTime: `${mediumMethods.length * 5}min`,
        completed: false,
      });
    }

    // Phase 3: Low Priority and Simple Methods
    const simpleMethods = methods.filter(
      (m) =>
        m.priority === "low" && m.complexity < 4 && m.dependencies.length === 0
    );
    if (simpleMethods.length > 0) {
      phases.push({
        phaseNumber: 3,
        name: "Utility Methods",
        methods: simpleMethods.map((m) => m.methodName),
        description: "Test simple utility and helper methods",
        priority: "medium",
        estimatedTime: `${simpleMethods.length * 3}min`,
        completed: false,
      });
    }

    return phases;
  }

  private calculateEstimatedTime(methods: MethodTestStatus[]): string {
    const totalMinutes = methods.reduce((total, method) => {
      // Estimate based on complexity: complex methods take longer
      const baseTime =
        method.complexity >= 8 ? 8 : method.complexity >= 4 ? 5 : 3;
      const dependencyTime = method.dependencies.length * 2;
      return total + baseTime + dependencyTime;
    }, 0);

    if (totalMinutes < 60) {
      return `${totalMinutes}min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}min`;
    }
  }

  // Cleanup old sessions (call periodically)
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(sessionId);
        this.plans.delete(sessionId);
      }
    }
  }

  // Get all active sessions for debugging
  getActiveSessions(): TestGenerationSession[] {
    return Array.from(this.sessions.values());
  }
}
