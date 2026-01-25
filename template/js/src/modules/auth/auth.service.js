import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "./auth.schemas.js";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";

export const AuthService = {
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  async register(data, userRepo) {
    const input = registerSchema.parse(data);

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

  async login(data, userRepo) {
    const input = loginSchema.parse(data);

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
