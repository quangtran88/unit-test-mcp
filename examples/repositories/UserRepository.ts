import { User } from "../models/User";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: { limit: number; offset: number }): Promise<User[]>;
  create(userData: Omit<User, "id">): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
