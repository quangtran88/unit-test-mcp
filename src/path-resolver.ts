import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export class PathResolver {
  /**
   * Resolves a file path to an absolute path, trying various strategies
   * to locate the file relative to the current working directory
   */
  static resolvePath(filePath: string): string {
    // If it's already an absolute path, use it directly
    if (path.isAbsolute(filePath)) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
      throw new Error(`File not found: ${filePath}`);
    }

    // Get the current working directory (where Cursor is operating)
    const currentWorkingDir = process.cwd();

    // Try current working directory first
    const directPath = path.resolve(currentWorkingDir, filePath);
    if (fs.existsSync(directPath)) {
      return directPath;
    }

    // Try to detect workspace from file patterns (generic approach)
    const detectedWorkspace = PathResolver.detectWorkspaceFromPath(filePath);
    if (detectedWorkspace && detectedWorkspace !== currentWorkingDir) {
      const workspacePath = path.resolve(detectedWorkspace, filePath);
      if (fs.existsSync(workspacePath)) {
        return workspacePath;
      }
    }

    // Find project root from current working directory
    const projectRoot = PathResolver.findProjectRoot();
    if (projectRoot) {
      const projectPath = path.resolve(projectRoot, filePath);
      if (fs.existsSync(projectPath)) {
        return projectPath;
      }
    }

    // Try environment-based paths that Cursor/editors might set
    const envPaths = [
      process.env.PWD,
      process.env.INIT_CWD,
      process.env.OLDPWD,
      // Cursor-specific environment variables
      process.env.VSCODE_CWD,
      process.env.WORKSPACE_FOLDER,
    ].filter(Boolean);

    for (const envPath of envPaths) {
      if (envPath && fs.existsSync(envPath)) {
        const fullPath = path.resolve(envPath, filePath);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
    }

    // Try common workspace locations (generic search)
    const commonWorkspaces = PathResolver.getCommonWorkspaceLocations();
    for (const workspace of commonWorkspaces) {
      if (fs.existsSync(workspace)) {
        const candidatePath = path.resolve(workspace, filePath);
        if (fs.existsSync(candidatePath)) {
          return candidatePath;
        }
      }
    }

    // Try walking up from current directory to find the file
    let currentDir = currentWorkingDir;
    for (let i = 0; i < 10; i++) {
      const candidatePath = path.resolve(currentDir, filePath);
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }

      // Also try common project structure patterns
      const commonPaths = [
        path.resolve(currentDir, "src", filePath),
        path.resolve(currentDir, "lib", filePath),
        path.resolve(currentDir, "libs", filePath),
        path.resolve(currentDir, "apps", filePath),
      ];

      for (const commonPath of commonPaths) {
        if (fs.existsSync(commonPath)) {
          return commonPath;
        }
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // Reached filesystem root
      currentDir = parentDir;
    }

    throw new Error(
      `File not found: ${filePath}. Searched from current working directory: ${currentWorkingDir}`
    );
  }

  /**
   * Detects the likely workspace directory based on file path patterns (generic approach)
   */
  static detectWorkspaceFromPath(filePath: string): string | null {
    const userHome = os.homedir();

    // Try to find any project that contains this exact file path
    const commonWorkspaces = PathResolver.getCommonWorkspaceLocations();

    for (const workspace of commonWorkspaces) {
      if (fs.existsSync(workspace) && PathResolver.isProjectRoot(workspace)) {
        const candidateFile = path.join(workspace, filePath);
        if (fs.existsSync(candidateFile)) {
          return workspace;
        }
      }
    }

    return null;
  }

  /**
   * Gets common workspace locations where projects might be located (generic approach)
   */
  static getCommonWorkspaceLocations(): string[] {
    const userHome = os.homedir();
    const locations: string[] = [];

    // Common development directories
    const commonDirs = [
      path.join(userHome, "Codes"),
      path.join(userHome, "Projects"),
      path.join(userHome, "Development"),
      path.join(userHome, "dev"),
      path.join(userHome, "workspace"),
      path.join(userHome, "src"),
      userHome,
    ];

    for (const baseDir of commonDirs) {
      if (fs.existsSync(baseDir)) {
        // Add subdirectories that look like projects
        try {
          const subdirs = fs
            .readdirSync(baseDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => path.join(baseDir, dirent.name))
            .filter((dir) => PathResolver.isProjectRoot(dir)); // Only include actual projects

          locations.push(...subdirs);
        } catch (error) {
          // Ignore read errors for directories we can't access
        }
      }
    }

    return locations;
  }

  /**
   * Finds the project root by walking up the directory tree looking for
   * common project indicators like package.json, .git, etc.
   */
  static findProjectRoot(): string | null {
    // If we're in the user home directory, try to find a better starting point
    const currentDir = process.cwd();
    const userHome = os.homedir();

    let startDir = currentDir;

    // If we're in the home directory, try environment variables first
    if (currentDir === userHome) {
      const envPaths = [
        process.env.PWD,
        process.env.INIT_CWD,
        process.env.VSCODE_CWD,
        process.env.WORKSPACE_FOLDER,
      ].filter(Boolean);

      for (const envPath of envPaths) {
        if (envPath && envPath !== userHome && fs.existsSync(envPath)) {
          startDir = envPath;
          break;
        }
      }
    }

    // Start from the determined starting directory
    let searchDir = startDir;

    // Look for common project root indicators, walking up the directory tree
    for (let i = 0; i < 10; i++) {
      // Try up to 10 levels up
      if (PathResolver.isProjectRoot(searchDir)) {
        return searchDir;
      }

      const parentDir = path.dirname(searchDir);
      if (parentDir === searchDir) break; // Reached filesystem root
      searchDir = parentDir;
    }

    // If no project root found in the directory tree, check environment variables as fallback
    const envPaths = [process.env.PWD, process.env.INIT_CWD].filter(Boolean);
    for (const envPath of envPaths) {
      if (envPath && envPath !== "/" && PathResolver.isProjectRoot(envPath)) {
        return path.resolve(envPath);
      }
    }

    return null;
  }

  /**
   * Determines if a directory is a project root by checking for
   * common project indicator files
   */
  static isProjectRoot(directory: string): boolean {
    const projectIndicators = [
      "package.json",
      "tsconfig.json",
      ".git",
      "nx.json",
      "angular.json",
      "workspace.json",
      "pnpm-workspace.yaml",
      "lerna.json",
    ];

    return projectIndicators.some((indicator) => {
      const indicatorPath = path.join(directory, indicator);
      return fs.existsSync(indicatorPath);
    });
  }

  /**
   * Gets the current working directory where the editor/tool is operating
   */
  static getCurrentWorkingDirectory(): string {
    return process.cwd();
  }
}
