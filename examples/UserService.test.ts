import { createSandbox, SinonSandbox } from "sinon";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { UserService } from "./UserService";
import { User } from "./models/User";
import { UserRepository } from "./repositories/UserRepository";
import { EmailService } from "./services/EmailService";
import { Logger } from "./utils/Logger";

describe("UserService", () => {
  let sandbox: SinonSandbox;
  let userService: UserService;
  let userRepositoryMock: StubbedInstance<UserRepository>;
  let emailServiceMock: StubbedInstance<EmailService>;
  let loggerMock: StubbedInstance<Logger>;

  beforeEach(() => {
    sandbox = createSandbox();

    userRepositoryMock = stubInterface<UserRepository>();
    emailServiceMock = stubInterface<EmailService>();
    loggerMock = stubInterface<Logger>();

    userService = new UserService(
      userRepositoryMock,
      emailServiceMock,
      loggerMock
    );

    // Pre-configure common mock returns
    emailServiceMock.sendWelcomeEmail.resolves();
    emailServiceMock.sendActivationEmail.resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#createUser", () => {
    const validRequest = {
      email: "test@example.com",
      name: "Test User",
      age: 25,
    };

    const mockUser: User = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      age: 25,
      createdAt: new Date("2023-01-01"),
      isActive: true,
    };

    beforeEach(() => {
      userRepositoryMock.findByEmail.resolves(null);
      userRepositoryMock.create.resolves(mockUser);
    });

    it("should create user successfully with valid data", async () => {
      // Act
      const result = await userService.createUser(validRequest);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepositoryMock.findByEmail.args).toEqual([
        [validRequest.email],
      ]);
      expect(userRepositoryMock.create.args).toEqual([
        [
          {
            email: validRequest.email,
            name: validRequest.name,
            age: validRequest.age,
            createdAt: expect.any(Date),
            isActive: true,
          },
        ],
      ]);
      expect(emailServiceMock.sendWelcomeEmail.args).toEqual([
        [mockUser.email, mockUser.name],
      ]);
      expect(loggerMock.info.calledTwice).toBe(true);
    });

    it("should throw error when email is required", async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: "" };

      // Act & Assert
      await expect(userService.createUser(invalidRequest)).rejects.toThrow(
        "Email is required"
      );
      expect(userRepositoryMock.findByEmail).not.toBeCalled();
    });

    it("should throw error when email format is invalid", async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: "invalid-email" };

      // Act & Assert
      await expect(userService.createUser(invalidRequest)).rejects.toThrow(
        "Invalid email format"
      );
      expect(userRepositoryMock.findByEmail).not.toBeCalled();
    });

    it("should throw error when age is negative", async () => {
      // Arrange
      const invalidRequest = { ...validRequest, age: -5 };

      // Act & Assert
      await expect(userService.createUser(invalidRequest)).rejects.toThrow(
        "Age must be positive"
      );
      expect(userRepositoryMock.findByEmail).not.toBeCalled();
    });

    it("should throw error when user already exists", async () => {
      // Arrange
      userRepositoryMock.findByEmail.resolves(mockUser);

      // Act & Assert
      await expect(userService.createUser(validRequest)).rejects.toThrow(
        "User already exists"
      );
      expect(userRepositoryMock.findByEmail.args).toEqual([
        [validRequest.email],
      ]);
      expect(userRepositoryMock.create).not.toBeCalled();
    });

    it("should use default age 18 when age is not provided", async () => {
      // Arrange
      const requestWithoutAge = {
        email: validRequest.email,
        name: validRequest.name,
      };

      // Act
      await userService.createUser(requestWithoutAge);

      // Assert
      expect(userRepositoryMock.create.args).toEqual([
        [
          {
            email: requestWithoutAge.email,
            name: requestWithoutAge.name,
            age: 18,
            createdAt: expect.any(Date),
            isActive: true,
          },
        ],
      ]);
    });

    it("should throw error when repository create fails", async () => {
      // Arrange
      userRepositoryMock.create.rejects(new Error("Database error"));

      // Act & Assert
      await expect(userService.createUser(validRequest)).rejects.toThrow(
        "Failed to create user"
      );
      expect(loggerMock.error.args[0][0]).toBe("Failed to create user");
    });

    it("should throw error when email service fails", async () => {
      // Arrange
      emailServiceMock.sendWelcomeEmail.rejects(
        new Error("Email service error")
      );

      // Act & Assert
      await expect(userService.createUser(validRequest)).rejects.toThrow(
        "Failed to create user"
      );
      expect(loggerMock.error.args[0][0]).toBe("Failed to create user");
    });
  });

  describe("#getUserById", () => {
    const userId = "user-123";
    const mockUser: User = {
      id: userId,
      email: "test@example.com",
      name: "Test User",
      age: 25,
      createdAt: new Date("2023-01-01"),
      isActive: true,
    };

    it("should retrieve user successfully when user exists", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(mockUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(loggerMock.info.args).toEqual([["User retrieved", { userId }]]);
    });

    it("should return null when user does not exist", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(null);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toBeNull();
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(loggerMock.warn.args).toEqual([["User not found", { userId }]]);
    });

    it("should throw error when user ID is required", async () => {
      // Act & Assert
      await expect(userService.getUserById("")).rejects.toThrow(
        "User ID is required"
      );
      expect(userRepositoryMock.findById).not.toBeCalled();
    });

    it("should throw error when repository fails", async () => {
      // Arrange
      userRepositoryMock.findById.rejects(new Error("Database error"));

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        "Failed to retrieve user"
      );
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(loggerMock.error.args[0][0]).toBe("Failed to get user");
      expect(loggerMock.error.args[0][1]).toEqual({
        userId,
        error: "Database error",
      });
    });
  });

  describe("#updateUser", () => {
    const userId = "user-123";
    const existingUser: User = {
      id: userId,
      email: "existing@example.com",
      name: "Existing User",
      age: 30,
      createdAt: new Date("2023-01-01"),
      isActive: true,
    };

    const updateRequest = {
      name: "Updated Name",
      age: 35,
    };

    const updatedUser: User = {
      ...existingUser,
      ...updateRequest,
      updatedAt: new Date("2023-01-02"),
    };

    beforeEach(() => {
      userRepositoryMock.findById.resolves(existingUser);
      userRepositoryMock.update.resolves(updatedUser);
    });

    it("should update user successfully with valid data", async () => {
      // Act
      const result = await userService.updateUser(userId, updateRequest);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            ...updateRequest,
            updatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(loggerMock.info.args).toEqual([
        ["User updated successfully", { userId }],
      ]);
    });

    it("should throw error when user ID is required", async () => {
      // Act & Assert
      await expect(userService.updateUser("", updateRequest)).rejects.toThrow(
        "User ID is required"
      );
      expect(userRepositoryMock.findById).not.toBeCalled();
    });

    it("should throw error when age is negative", async () => {
      // Arrange
      const invalidRequest = { ...updateRequest, age: -5 };

      // Act & Assert
      await expect(
        userService.updateUser(userId, invalidRequest)
      ).rejects.toThrow("Age must be positive");
      expect(userRepositoryMock.findById).not.toBeCalled();
    });

    it("should throw error when user not found", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(null);

      // Act & Assert
      await expect(
        userService.updateUser(userId, updateRequest)
      ).rejects.toThrow("User not found");
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update).not.toBeCalled();
    });

    it("should throw error when repository update fails", async () => {
      // Arrange
      userRepositoryMock.update.rejects(new Error("Database error"));

      // Act & Assert
      await expect(
        userService.updateUser(userId, updateRequest)
      ).rejects.toThrow("Failed to update user");
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            ...updateRequest,
            updatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(loggerMock.error.args[0][0]).toBe("Failed to update user");
      expect(loggerMock.error.args[0][1]).toEqual({
        userId,
        error: "Database error",
      });
    });

    it("should update user with partial data", async () => {
      // Arrange
      const partialRequest = { name: "New Name Only" };
      const partiallyUpdatedUser = {
        ...existingUser,
        name: "New Name Only",
        updatedAt: new Date(),
      };
      userRepositoryMock.update.resolves(partiallyUpdatedUser);

      // Act
      const result = await userService.updateUser(userId, partialRequest);

      // Assert
      expect(result).toEqual(partiallyUpdatedUser);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            name: "New Name Only",
            updatedAt: expect.any(Date),
          },
        ],
      ]);
    });

    it("should update user with empty request object", async () => {
      // Arrange
      const emptyRequest = {};
      const unchangedUser = { ...existingUser, updatedAt: new Date() };
      userRepositoryMock.update.resolves(unchangedUser);

      // Act
      const result = await userService.updateUser(userId, emptyRequest);

      // Assert
      expect(result).toEqual(unchangedUser);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            updatedAt: expect.any(Date),
          },
        ],
      ]);
    });
  });

  describe("#deleteUser", () => {
    const userId = "user-123";
    const existingUser: User = {
      id: userId,
      email: "delete@example.com",
      name: "User To Delete",
      age: 30,
      createdAt: new Date("2023-01-01"),
      isActive: true,
    };

    beforeEach(() => {
      userRepositoryMock.findById.resolves(existingUser);
      userRepositoryMock.delete.resolves();
    });

    it("should delete user successfully when user exists", async () => {
      // Act
      await userService.deleteUser(userId);

      // Assert
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.delete.args).toEqual([[userId]]);
      expect(loggerMock.info.args).toEqual([
        ["User deleted successfully", { userId }],
      ]);
    });

    it("should throw error when user ID is required", async () => {
      // Act & Assert
      await expect(userService.deleteUser("")).rejects.toThrow(
        "User ID is required"
      );
      expect(userRepositoryMock.findById).not.toBeCalled();
      expect(userRepositoryMock.delete).not.toBeCalled();
    });

    it("should throw error when user not found", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(null);

      // Act & Assert
      await expect(userService.deleteUser(userId)).rejects.toThrow(
        "User not found"
      );
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.delete).not.toBeCalled();
    });

    it("should throw error when repository delete fails", async () => {
      // Arrange
      userRepositoryMock.delete.rejects(new Error("Database error"));

      // Act & Assert
      await expect(userService.deleteUser(userId)).rejects.toThrow(
        "Failed to delete user"
      );
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.delete.args).toEqual([[userId]]);
      expect(loggerMock.error.args[0][0]).toBe("Failed to delete user");
      expect(loggerMock.error.args[0][1]).toEqual({
        userId,
        error: "Database error",
      });
    });
  });

  describe("#getAllUsers", () => {
    const mockUsers: User[] = [
      {
        id: "user-1",
        email: "user1@example.com",
        name: "User One",
        age: 25,
        createdAt: new Date("2023-01-01"),
        isActive: true,
      },
      {
        id: "user-2",
        email: "user2@example.com",
        name: "User Two",
        age: 30,
        createdAt: new Date("2023-01-02"),
        isActive: false,
      },
    ];

    beforeEach(() => {
      userRepositoryMock.findAll.resolves(mockUsers);
    });

    it("should retrieve all users successfully with default pagination", async () => {
      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(userRepositoryMock.findAll.args).toEqual([
        [
          {
            limit: 50,
            offset: 0,
          },
        ],
      ]);
      expect(loggerMock.info.args).toEqual([
        ["Retrieved users", { count: mockUsers.length }],
      ]);
    });

    it("should retrieve users with custom limit and offset", async () => {
      // Arrange
      const limit = 10;
      const offset = 5;

      // Act
      const result = await userService.getAllUsers(limit, offset);

      // Assert
      expect(result).toEqual(mockUsers);
      expect(userRepositoryMock.findAll.args).toEqual([
        [
          {
            limit,
            offset,
          },
        ],
      ]);
      expect(loggerMock.info.args).toEqual([
        ["Retrieved users", { count: mockUsers.length }],
      ]);
    });

    it("should retrieve users with only limit specified", async () => {
      // Arrange
      const limit = 25;

      // Act
      const result = await userService.getAllUsers(limit);

      // Assert
      expect(result).toEqual(mockUsers);
      expect(userRepositoryMock.findAll.args).toEqual([
        [
          {
            limit,
            offset: 0,
          },
        ],
      ]);
    });

    it("should retrieve users with only offset specified", async () => {
      // Arrange
      const offset = 10;

      // Act
      const result = await userService.getAllUsers(undefined, offset);

      // Assert
      expect(result).toEqual(mockUsers);
      expect(userRepositoryMock.findAll.args).toEqual([
        [
          {
            limit: 50,
            offset,
          },
        ],
      ]);
    });

    it("should return empty array when no users exist", async () => {
      // Arrange
      userRepositoryMock.findAll.resolves([]);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(result).toEqual([]);
      expect(loggerMock.info.args).toEqual([["Retrieved users", { count: 0 }]]);
    });

    it("should throw error when repository fails", async () => {
      // Arrange
      userRepositoryMock.findAll.rejects(new Error("Database error"));

      // Act & Assert
      await expect(userService.getAllUsers()).rejects.toThrow(
        "Failed to retrieve users"
      );
      expect(userRepositoryMock.findAll.args).toEqual([
        [
          {
            limit: 50,
            offset: 0,
          },
        ],
      ]);
      expect(loggerMock.error.args[0][0]).toBe("Failed to get users");
      expect(loggerMock.error.args[0][1]).toEqual({
        error: "Database error",
      });
    });
  });

  describe("#activateUser", () => {
    const userId = "user-123";
    const inactiveUser: User = {
      id: userId,
      email: "inactive@example.com",
      name: "Inactive User",
      age: 25,
      createdAt: new Date("2023-01-01"),
      isActive: false,
    };

    const activeUser: User = {
      ...inactiveUser,
      isActive: true,
    };

    const activatedUser: User = {
      ...inactiveUser,
      isActive: true,
      activatedAt: new Date("2023-01-02"),
    };

    beforeEach(() => {
      // Reset mocks to ensure clean state
      userRepositoryMock.findById.reset();
      userRepositoryMock.update.reset();
      emailServiceMock.sendActivationEmail.reset();
      loggerMock.info.reset();
      loggerMock.warn.reset();
      loggerMock.error.reset();

      userRepositoryMock.update.resolves(activatedUser);
      emailServiceMock.sendActivationEmail.resolves();
    });

    it("should activate inactive user successfully", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(inactiveUser);

      // Act
      const result = await userService.activateUser(userId);

      // Assert
      expect(result).toEqual(activatedUser);
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            isActive: true,
            activatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(emailServiceMock.sendActivationEmail.args).toEqual([
        [inactiveUser.email, inactiveUser.name],
      ]);
      expect(loggerMock.info.args).toEqual([
        ["User activated successfully", { userId }],
      ]);
    });

    it("should return user when already active without updating", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(activeUser);

      // Act
      const result = await userService.activateUser(userId);

      // Assert
      expect(result).toEqual(activeUser);
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update).not.toBeCalled();
      expect(emailServiceMock.sendActivationEmail).not.toBeCalled();
      expect(loggerMock.warn.args).toEqual([
        ["User is already active", { userId }],
      ]);
    });

    it("should throw error when user not found", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(null);

      // Act & Assert
      await expect(userService.activateUser(userId)).rejects.toThrow(
        "User not found"
      );
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update).not.toBeCalled();
      expect(emailServiceMock.sendActivationEmail).not.toBeCalled();
    });

    it("should throw error when repository update fails", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(inactiveUser);
      userRepositoryMock.update.rejects(new Error("Database error"));

      // Act & Assert
      await expect(userService.activateUser(userId)).rejects.toThrow(
        "Failed to activate user"
      );
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            isActive: true,
            activatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(emailServiceMock.sendActivationEmail).not.toBeCalled();
      expect(loggerMock.error.args[0][0]).toBe("Failed to activate user");
      expect(loggerMock.error.args[0][1]).toEqual({
        userId,
        error: "Database error",
      });
    });

    it("should throw error when email service fails", async () => {
      // Arrange
      userRepositoryMock.findById.resolves(inactiveUser);
      emailServiceMock.sendActivationEmail.rejects(
        new Error("Email service error")
      );

      // Act & Assert
      await expect(userService.activateUser(userId)).rejects.toThrow(
        "Failed to activate user"
      );
      expect(userRepositoryMock.findById.args).toEqual([[userId]]);
      expect(userRepositoryMock.update.args).toEqual([
        [
          userId,
          {
            isActive: true,
            activatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(emailServiceMock.sendActivationEmail.args).toEqual([
        [inactiveUser.email, inactiveUser.name],
      ]);
      expect(loggerMock.error.args[0][0]).toBe("Failed to activate user");
      expect(loggerMock.error.args[0][1]).toEqual({
        userId,
        error: "Email service error",
      });
    });
  });

  describe("#validateUserData", () => {
    const validUserData = {
      email: "valid@example.com",
      name: "Valid User",
      age: 25,
    };

    it("should return true for valid user data", () => {
      // Act
      const result = userService.validateUserData(validUserData);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for valid user data without age", () => {
      // Arrange
      const userDataWithoutAge = {
        email: "valid@example.com",
        name: "Valid User",
      };

      // Act
      const result = userService.validateUserData(userDataWithoutAge);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when email is missing", () => {
      // Arrange
      const userData = { ...validUserData, email: "" };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when email is undefined", () => {
      // Arrange
      const userData = { ...validUserData, email: undefined as any };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when email format is invalid", () => {
      // Arrange
      const userData = { ...validUserData, email: "invalid-email" };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when name is missing", () => {
      // Arrange
      const userData = { ...validUserData, name: "" };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when name is undefined", () => {
      // Arrange
      const userData = { ...validUserData, name: undefined as any };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when name is too short", () => {
      // Arrange
      const userData = { ...validUserData, name: "A" };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when age is negative", () => {
      // Arrange
      const userData = { ...validUserData, age: -1 };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when age is too high", () => {
      // Arrange
      const userData = { ...validUserData, age: 151 };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when age is exactly 0", () => {
      // Arrange
      const userData = { ...validUserData, age: 0 };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when age is exactly 150", () => {
      // Arrange
      const userData = { ...validUserData, age: 150 };

      // Act
      const result = userService.validateUserData(userData);

      // Assert
      expect(result).toBe(true);
    });
  });
});
