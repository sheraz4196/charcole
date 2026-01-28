# Charcole API v2.1

> **Charcole v2.1 is a production-grade Node.js backend starter CLI that scaffolds enterprise-ready Express APIs with first-class TypeScript or JavaScript support, centralized error handling, Zod validation, structured logging, optional JWT authentication, and a revolutionary repository pattern for database abstraction.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![Zod](https://img.shields.io/badge/Zod-3.22+-purple.svg)](https://zod.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## What's New in v2.1

### Revolutionary Repository Pattern

- **Database abstraction layer** - Switch databases without changing business logic
- **In-memory repository included** - Test APIs instantly without database setup
- **Clean separation** - Business logic stays independent of database implementation
- **Future-proof** - Easy migration between MongoDB, PostgreSQL, MySQL, etc.

### Optional JWT Authentication Module

- **Complete auth system** - Register, login, logout, protected routes
- **JWT-based authentication** - Stateless, scalable token management
- **Password hashing** - Secure bcrypt password handling
- **Ready-to-use** - Production-ready auth APIs out of the box
- **Modular design** - Include/exclude during project creation

### Bug Fixes & Improvements

- **Fixed TypeScript compilation** - Clean builds with proper type definitions
- **Enhanced error handling** - Better error messages and debugging
- **Improved CLI experience** - Smoother project creation flow
- **Better dependency management** - Cleaner package.json merging

## Quick Start

```bash
# Create your charcole app now (with or without project name)
npx create-charcole@latest my-awesome-api

# OR (interactive mode)
npx create-charcole@latest

# Follow prompts to select:
# 1. Language: TypeScript or JavaScript
# 2. JWT Authentication: Yes/No (includes complete auth system)

# Configure environment
cp .env.example .env

# Start development server (with auto-reload)
npm run dev

# OR start production server
npm start
```

Server runs on http://localhost:3000 by default.

## Repository Pattern: A Game Changer

### The Problem

Traditional apps mix database logic with business logic. Switching databases means rewriting everything.

### The Solution

Charcole v2.1 introduces a Repository Pattern that abstracts database operations:

```javascript
// Traditional approach (tightly coupled)
// app.ts
import mongoose from 'mongoose';

async function getUser(id: string) {
  return await UserModel.findById(id); //  Direct MongoDB dependency
}

// Charcole v2.1 approach (abstracted)
// repositories/user.repo.ts
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

// controller.js
async login(req, res) {
    try {
      const result = await AuthService.login(req.body, req.app.locals.userRepo);

      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  },
```

### Benefits

- Test instantly - In-memory repository works without database setup

- Switch databases easily - Change MongoDB to PostgreSQL by updating one file

- Clean architecture - Business logic stays pure

- Better testing - Mock repositories for unit tests

- Future-proof - Adapt to any database technology

## JWT Authentication Module (Optional)

### What's Included

When you select "Yes" for authentication during project creation:

src/modules/auth/
│ ├── auth.controller.ts # Register, login, logout, me endpoints
│ └── auth.middleware.ts # JWT verification, protected routes
│ └── auth.service.ts # Business logic for authentication
| └── auth.routes.ts # Auth API routes
| └── auth.schemas.ts # Auth API Schemas
| └── auth.constants.ts # Auth API constants

### Available Endpoints

POST /api/auth/register # Create new account
POST /api/auth/login # Get JWT token
GET /api/protected/me # Get current user (protected)

## Golder Rules (Updated for v2.1)

1. Wrap async handlers with asyncHandler
      `router.get("/users/:id", asyncHandler(async (req, res) => { ... }))`
2. Throw AppError (never use res.status().json())
      `throw new NotFoundError("User", { id });`
3. Validate requests with validateRequest
      `router.post("/users", validateRequest(schema), handler);`
4. Use repositories for database operations

```typescript
//  Direct database calls
const user = await UserModel.findById(id);

//  Repository pattern
const user = await AuthService.login(req.body, req.app.locals.userRepo);
```

## Why Choose Charcole v2.1?

### For Startups

- Launch faster - Production-ready API in minutes
- Test without DB - In-memory repository for rapid prototyping
- Built-in auth - User management out of the box
- Clean code - Follows best practices from day one

### For Enterprises

- Maintainable - Repository pattern enables easy database migrations
- Scalable - Modular architecture grows with your needs
- Reliable - Battle-tested error handling
- Type-safe - Full TypeScript support reduces bugs

### For Developers

- Learn best practices - Production patterns built-in

- Easy to extend - Add modules, databases, features

- Great DX - Excellent error messages and logging

- Future-proof - Designed for long-term maintenance

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository, create new branch and raise a pull request. If it fits with the goals of **charcole** we'll merge it
2. Follow the repository pattern for database operations
3. Use TypeScript for new features
4. Include tests with in-memory repositories
5. Document new modules thoroughly
6. Update README.md for significant changes

## 📄 License

ISC
