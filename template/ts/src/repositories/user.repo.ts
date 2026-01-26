import { randomUUID } from "crypto";
import type { User } from "../modules/auth/auth.schemas.ts";

const users: User[] = [];

type CreateUserData = {
  email: string;
  name: string;
  passwordHash: string;
};

export const userRepo = {
  async findByEmail(email: string): Promise<User | undefined> {
    return users.find((u) => u.email === email);
  },

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: randomUUID(),
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: "user",
      provider: "credentials",
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(user);
    return user;
  },
};
