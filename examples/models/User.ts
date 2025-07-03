export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  activatedAt?: Date;
}
