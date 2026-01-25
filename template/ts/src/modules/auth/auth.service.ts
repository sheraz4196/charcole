import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import type { z } from "zod";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";

// Type definitions
type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
};

type UserRepo = {
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User>;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type LoginResult = {
  user: User;
  token: string;
};

export const AuthService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  signToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    return jwt.sign(payload, secret, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  async register(data: unknown, userRepo: UserRepo): Promise<User> {
    const input: RegisterInput = registerSchema.parse(data);

    const existingUser = await userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already in use");
    }

    const passwordHash = await this.hashPassword(input.password);

    const user = await userRepo.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    return user;
  },

  async login(data: unknown, userRepo: UserRepo): Promise<LoginResult> {
    const input: LoginInput = loginSchema.parse(data);

    const user = await userRepo.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const isValid = await this.comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  },
};
