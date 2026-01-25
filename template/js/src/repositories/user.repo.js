import { randomUUID } from "crypto";

const users = [];

export const userRepo = {
  async findByEmail(email) {
    return users.find((u) => u.email === email);
  },

  async create(data) {
    const user = {
      id: randomUUID(),
      role: "user",
      ...data,
    };
    users.push(user);
    return user;
  },
};
