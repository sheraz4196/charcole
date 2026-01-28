# Changelog

All notable changes to Charcole will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] – 2026-01-29

### 🎉 Major Release: Repository Pattern & JWT Authentication

#### ✨ **New Features**

- **🎯 Revolutionary Repository Pattern** – Database abstraction layer for clean separation between business logic and data access
- **🔐 Optional JWT Authentication Module** – Complete auth system with register, login, logout, and protected routes
- **🧪 In-Memory Repository Implementation** – Test APIs instantly without database setup
- **🏗️ Repository Interfaces** – `BaseRepository` and `InMemoryRepository` for easy database switching
- **💻 Command-line project name support** – Create projects via `npx create-charcole@latest my-project`
- **📝 Enhanced TypeScript support** – Improved type definitions and compilation

#### 🚀 **New Architecture**

- **Database Abstraction Layer**: Switch between MongoDB, PostgreSQL, MySQL, etc., by changing one file
- **Modular Auth System**:
  - Full user authentication (register/login/logout)
  - JWT token generation and validation
  - Password hashing with bcrypt
  - Protected route middleware
  - In-memory user repository for testing
- **Improved CLI**:
  - Accept project name as command-line argument
  - Better dependency merging for optional modules
  - Cleaner project generation flow

#### 🔧 **Technical Improvements**

- **Fixed Module Copying**: Auth module properly excluded when user selects "No"
- **Fixed Package.json Merging**: Dependencies correctly merged into single package.json
- **Fixed TypeScript Compilation**: Clean builds with proper type definitions
- **Improved Path Resolution**: Better template directory structure handling

#### 📁 **Project Structure Updates**

- Added `src/modules/auth/` directory with complete auth system
- Modules now located in `src/modules/` instead of template root
- Cleaner dependency management with proper merging
- Enhanced CLI user experience with better flow control

#### 📦 **New Dependencies** (when auth selected)

- `jsonwebtoken@^9.0.0` for JWT authentication
- `bcryptjs@^2.4.3` for password hashing
- Type definitions for both libraries

#### 🎯 **Repository Pattern Benefits**

- ✅ Test without database setup
- ✅ Easy database migration
- ✅ Clean separation of concerns
- ✅ Better unit testing capabilities

#### 🔐 **Auth Module Structure**

```
auth/
├── auth.controller.js
├── auth.middleware.js
├── auth.constants.js
├── auth.schemas.js

```

### 🚦 **Migration Notes from v2.0**

- Existing v2.0 projects remain compatible
- No breaking changes to core error handling or validation
- New projects get optional auth module
- Repository pattern is opt-in for existing codebases

### ✅ **Known Issues**

- None reported

---

## [2.0.0] – 2026-01-24

### 🎉 **Major Release: TypeScript & JavaScript Support**

#### ✨ **New Features**

- **Full TypeScript project template support** – Production-ready TypeScript setup
- **Language selection at CLI runtime** – Choose between JavaScript or TypeScript during project creation
- **Improved project scaffolding structure** – Better organized template files
- **Enhanced developer experience** – Streamlined production setup process

#### 🔧 **Technical Improvements**

- **Improved template resolution logic** – More reliable project generation
- **Enhanced CLI output** – Better onboarding messages and instructions
- **Fixed template path resolution** – Resolved issues from previous versions
- **Fixed local CLI linking** – Improved development workflow

#### 📝 **Release Notes**

- This release focuses on stability and language parity
- Authentication and database modules intentionally excluded (added in v2.1)
- Foundation for future modular expansion

---

## [1.0.0] – 2025-12-15

### 🎉 **Initial Release**

#### ✨ **Core Features**

- **Production-grade Express API boilerplate**
- **Centralized error handling system** – All errors flow through single handler
- **Error classification** – Operational vs programmer errors distinguished
- **Zod validation integration** – Type-safe schema validation with automatic error formatting
- **Structured logging** – Color-coded logs with context and stack traces
- **Consistent JSON responses** – Standardized format across all endpoints
- **Async error handling** – Promise rejection leaks prevented with asyncHandler
- **Graceful shutdown** – Proper cleanup on SIGTERM/SIGINT
- **Request logging** – Method, path, status, duration, IP automatically tracked

#### 🛡️ **Error Handling System**

- **AppError class hierarchy** – Specialized error types (ValidationError, NotFoundError, etc.)
- **Global error middleware** – Catches all unhandled errors
- **Production-safe responses** – Internal details hidden in production
- **Context-rich errors** – Debug information included in development

#### 📦 **Key Dependencies**

- Express.js web framework
- Zod for validation
- Structured logging system
- CORS middleware
- dotenv for environment variables

#### 🎯 **Design Philosophy**

- Never leak internal errors to clients in production
- Always classify errors (operational vs programmer)
- Consistent response format for all endpoints
- Type-safe validation with helpful error messages
- Easy to extend and maintain

---

## Versioning Scheme

Charcole follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards compatible)
- **PATCH** version for bug fixes (backwards compatible)

## Release Notes Policy

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## How to Update the Changelog

When creating a new release:

1. Add a new `## [X.Y.Z]` header at the top of the file
2. Use descriptive headings for each section
3. Include migration notes if there are breaking changes
4. Add emojis for visual clarity (optional but recommended)
5. Update the "Unreleased" section if using one
6. Include links to issues/PRs when relevant

## Template for Future Releases

```markdown
## [X.Y.Z] – YYYY-MM-DD

### ✨ Added

- New features or functionality

### 🔧 Changed

- Changes to existing functionality

### 🐛 Fixed

- Bug fixes

### 🗑️ Removed

- Features removed or deprecated

### 🚦 Migration Notes

- Instructions for upgrading from previous versions

### ✅ Known Issues

- Any known bugs or limitations in this release
```

---

**Maintained by:** The Charcole Team  
**Last Updated:** 2026-01-29
