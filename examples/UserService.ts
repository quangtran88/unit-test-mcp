import { UserRepository } from "./repositories/UserRepository";
import { EmailService } from "./services/EmailService";
import { Logger } from "./utils/Logger";
import { User } from "./models/User";

export interface CreateUserRequest {
  email: string;
  name: string;
  age?: number;
}

export interface UpdateUserRequest {
  name?: string;
  age?: number;
}

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(request: CreateUserRequest): Promise<User> {
    this.logger.info("Creating new user", { email: request.email });

    // Validation
    if (!request.email) {
      throw new Error("Email is required");
    }

    if (!request.email.includes("@")) {
      throw new Error("Invalid email format");
    }

    if (request.age && request.age < 0) {
      throw new Error("Age must be positive");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    try {
      // Create user
      const user = await this.userRepository.create({
        email: request.email,
        name: request.name,
        age: request.age || 18,
        createdAt: new Date(),
        isActive: true,
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.name);

      this.logger.info("User created successfully", { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error("Failed to create user", { error: error.message });
      throw new Error("Failed to create user");
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (!id) {
      throw new Error("User ID is required");
    }

    try {
      const user = await this.userRepository.findById(id);

      if (user) {
        this.logger.info("User retrieved", { userId: id });
      } else {
        this.logger.warn("User not found", { userId: id });
      }

      return user;
    } catch (error) {
      this.logger.error("Failed to get user", {
        userId: id,
        error: error.message,
      });
      throw new Error("Failed to retrieve user");
    }
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Validation
    if (request.age && request.age < 0) {
      throw new Error("Age must be positive");
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    try {
      const updatedUser = await this.userRepository.update(id, {
        ...request,
        updatedAt: new Date(),
      });

      this.logger.info("User updated successfully", { userId: id });
      return updatedUser;
    } catch (error) {
      this.logger.error("Failed to update user", {
        userId: id,
        error: error.message,
      });
      throw new Error("Failed to update user");
    }
  }

  async deleteUser(id: string): Promise<void> {
    if (!id) {
      throw new Error("User ID is required");
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    try {
      await this.userRepository.delete(id);
      this.logger.info("User deleted successfully", { userId: id });
    } catch (error) {
      this.logger.error("Failed to delete user", {
        userId: id,
        error: error.message,
      });
      throw new Error("Failed to delete user");
    }
  }

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    try {
      const users = await this.userRepository.findAll({
        limit: limit || 50,
        offset: offset || 0,
      });

      this.logger.info("Retrieved users", { count: users.length });
      return users;
    } catch (error) {
      this.logger.error("Failed to get users", { error: error.message });
      throw new Error("Failed to retrieve users");
    }
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isActive) {
      this.logger.warn("User is already active", { userId: id });
      return user;
    }

    try {
      const activatedUser = await this.userRepository.update(id, {
        isActive: true,
        activatedAt: new Date(),
      });

      await this.emailService.sendActivationEmail(user.email, user.name);
      this.logger.info("User activated successfully", { userId: id });

      return activatedUser;
    } catch (error) {
      this.logger.error("Failed to activate user", {
        userId: id,
        error: error.message,
      });
      throw new Error("Failed to activate user");
    }
  }

  async validateUserData(userData: CreateUserRequest): Promise<boolean> {
    // Email validation
    if (!userData.email || !userData.email.includes("@")) {
      return false;
    }

    // Name validation
    if (!userData.name || userData.name.length < 2) {
      return false;
    }

    // Age validation
    if (
      userData.age !== undefined &&
      (userData.age < 0 || userData.age > 150)
    ) {
      return false;
    }

    return true;
  }
}
