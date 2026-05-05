# Changelog

All notable changes to Charcole will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] – 2026-05-05

### Added

- **Payments module** — optional, production-ready payment processing for scaffolded projects
- `@charcoles/payments` standalone npm package — drop-in payment support for any Express app
- **Stripe adapter** — full payment intent lifecycle: create, refund, status check, webhook verification
- **LemonSqueezy adapter** — checkout sessions, order retrieval, refunds, and webhook HMAC verification
  - Added specifically for Pakistani developers: Stripe does not support PKR payouts; LemonSqueezy provides merchant-of-record payments with full Pakistani bank payout support
- Adapter pattern for provider abstraction — switch between Stripe and LemonSqueezy via `PAYMENT_PROVIDER` env var
- New CLI prompt: "Include payments module?" with provider selection (Stripe / LemonSqueezy / Both)
- `src/modules/payments/` module in both JS and TS templates with:
  - `payments.adapter.js/ts` — provider factory with singleton caching
  - `payments.service.js/ts` — service layer with in-memory webhook deduplication
  - `payments.controller.js/ts` — request handlers for all 4 endpoints
  - `payments.routes.js/ts` — Express router with Swagger JSDoc comments
  - `payments.schemas.js/ts` — Zod validation schemas for all request bodies
  - `payments.constants.js/ts` — provider names, event names, webhook header names
- Four new API endpoints in scaffolded projects:
  - `POST /payments/create-intent` — create Stripe PaymentIntent or LemonSqueezy checkout session
  - `POST /payments/refund` — full or partial refunds
  - `GET /payments/status/:paymentId` — normalized payment status across providers
  - `POST /payments/webhook` — secure webhook event handling with signature verification
- Webhook raw body middleware auto-configured in `app.js` when payments module is selected
- Conditional route loading for payments (same `existsSync` pattern as auth and swagger)
- Payment env vars added to Zod env schema in both templates (all optional)
- Payment section added to `.env.example` in both templates with inline documentation
- Swagger JSDoc comments on all 4 payment endpoints
- `## Payments Module` section added to `SWAGGER_GUIDE.md` in both templates
- Payments section added to root `README.md` including migration guide for existing projects
- Integration tests for payments controller, service, schemas, and routes in both JS and TS templates
- `PaymentError` custom error class with `code` and `statusCode` fields, compatible with existing error handler

## [2.2.2] – 2026-02-06

#### ✨ **New Features**

- **🎯 @charcoles/swagger Package** – Effortless API documentation with automatic Zod-to-OpenAPI conversion
- **📚 Zero Schema Duplication** – Define schemas once in Zod, auto-generate OpenAPI specs
- **🎁 Built-in Response Templates** – Common responses (Success, ValidationError, Unauthorized, Forbidden, NotFound, InternalError) included
- **🔄 Always in Sync** – Impossible for documentation to drift from validation schemas
- **📦 Optional Module** – Include/exclude Swagger during project creation
- **🌍 Framework Agnostic** – Works with any Express.js project via `npm install @charcoles/swagger`

#### 🚀 **Swagger Features**

- **Automatic Schema Conversion**: Zod schemas automatically converted to OpenAPI JSON Schema
- **Response Templates**: 6 common response schemas included by default
- **Helper Functions**: Export utilities for advanced usage (`convertZodToOpenAPI`, `registerSchemas`, etc.)
- **Full TypeScript Support**: Complete type definitions for all functions
- **JavaScript Support**: Works perfectly with JavaScript projects too
- **100% Backward Compatible**: Old JSDoc approach still works

#### 📊 **Impact**

- **60-80% less documentation** per endpoint
- **0% schema duplication** (Zod → OpenAPI automatic)
- **Impossible to get out of sync** (single source of truth)
- **76 lines → 20 lines** for typical endpoint documentation

#### 📁 **New Files**

- `packages/swagger/src/helpers.js` - All helper utilities
- `packages/swagger/src/setup.js` - Enhanced setup with schema registration
- `packages/swagger/README.md` - Comprehensive package documentation
- `packages/swagger/CHANGELOG.md` - Package changelog
- `packages/swagger/BACKWARD_COMPATIBILITY.md` - Migration guide
- `template/*/src/lib/swagger/SWAGGER_GUIDE.md` - Complete usage guide

#### 🔧 **Technical Improvements**

- **Fixed Zod-to-OpenAPI conversion**: Properly handles internal `$ref` with `definitions`
- **Schema extraction**: Automatically extracts body schemas from nested Zod objects
- **Clean OpenAPI output**: Removes `$schema` and `definitions` for clean components

#### 📝 **Documentation Updates**

- All templates updated to demonstrate new approach
- Comprehensive guide in `SWAGGER_GUIDE.md`
- README with before/after comparisons
- Full API reference documentation

#### 🔐 **Auth Integration**

- Auth schemas (registerSchema, loginSchema) auto-documented when Swagger enabled
- Protected routes automatically show security requirements in Swagger UI
- Zero additional work for auth documentation

#### 🎯 **Developer Experience**

Before:

```typescript
// Define Zod schema (6 lines)
// Manually duplicate in Swagger (76 lines!)
// Update both when changes happen
```

After:

```typescript
// Define Zod schema (6 lines)
// Register once in config (1 line)
// Reference everywhere with $ref (1 line)
// Done! Auto-synced forever!
```

### 🚦 **Migration Notes from v2.1**

- Existing v2.1 projects remain fully compatible
- No breaking changes to any core features
- New projects get optional Swagger module
- Swagger is opt-in for existing codebases
- Old JSDoc approach still works (100% backward compatible)

### ✅ **Known Issues**

- None reported

---

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
