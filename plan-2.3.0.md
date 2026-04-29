# Charcole Version 2.3.0 UPDATE Plan

## Overview (Core Concept)

- Add an independent package `@charcoles/payments`, which will handle all payments end-to-end using Stripe or regional payment methods.
- Make a built-in optional module inside both Charcole TS & Charcole JS templates. Users will just have to add Stripe keys or regional payment method keys inside their ENV file.
- Since Stripe doesn't work in Pakistan, we will be using LemonSqueezy for regional payments, so Pakistani developers can enjoy this feature as well.

## Context: Project Analysis

### Project Structure Overview

Charcole is a Node.js backend starter CLI that scaffolds production-ready Express APIs. The repository structure is:

- **Root Level**:
  - `package.json`: Main CLI package with dependencies like `prompts`.
  - `README.md`: Project documentation and usage guide.
  - `CHANGELOG.md`: Version history and release notes.
  - `bin/index.js`: Main CLI entry point that handles user prompts and project generation.
  - `lib/templateHandler.js`: Utility for copying template files and merging package.json.

- **template/**: Contains two subdirectories for language variants.
  - `template/js/`: JavaScript template with ES modules.
  - `template/ts/`: TypeScript template with full type safety.

- **packages/**: Independent packages that can be used outside Charcole.
  - `packages/swagger/`: `@charcoles/swagger` package for auto-generated API docs.

- **tests/**: Test suite for CLI and modules.

### How Things Work Currently

1. **CLI Flow** (`bin/index.js`):
   - Prompts user for language (TS/JS), auth (yes/no), swagger (yes/no).
   - Copies base template from `template/[lang]/` to target directory.
   - Conditionally copies optional modules (auth, swagger) from `template/[lang]/src/modules/`.
   - Merges dependencies from module `package.json` files into base `package.json`.
   - Handles special cases like swagger tarball copying.

2. **Template Structure** (both JS and TS):
   - `basePackage.json`: Base dependencies (express, zod, etc.).
   - `.env.example`: Environment variable examples.
   - `src/app.[js|ts]`: Express app setup with middleware.
   - `src/config/env.[js|ts]`: Zod-based environment validation.
   - `src/middlewares/`: Error handling, validation, logging.
   - `src/modules/`: Optional feature modules (auth, swagger).
   - `src/repositories/`: In-memory data layer (user repo).
   - `src/routes/`: Route definitions, conditionally loading modules.
   - `src/utils/`: Response helpers, logger.

3. **Module System**:
   - Optional modules are in `src/modules/[module]/`.
   - Each has `package.json` for dependencies, routes, controllers, services.
   - Routes are conditionally imported in `src/routes/index.[js|ts]` based on file existence.
   - Swagger integration auto-generates docs from Zod schemas.

4. **Independent Packages**:
   - `@charcoles/swagger` is a standalone npm package.
   - Can be installed in any Express app: `npm install @charcoles/swagger`.
   - Provides `setupSwagger()` function for auto-docs.

5. **Current Optional Modules**:
   - **Auth**: JWT-based authentication with register/login/logout.
   - **Swagger**: Auto-generated API documentation.

### Code Style Analysis

- Uses ES modules (`import/export`).
- Async/await for all async operations.
- Zod for validation (schemas, env).
- Centralized error handling with custom error classes.
- Minimal comments; code is self-documenting.
- Consistent naming: camelCase for variables, PascalCase for classes/types.
- Functional programming style where possible.
- No semicolons in JS template, semicolons in TS.

## How It Will Work

The payments module will provide a complete payment processing system:

1. **Adapter Pattern**: Common interface for different payment providers (Stripe, LemonSqueezy).
2. **API Endpoints**: `/api/payments/create-intent`, `/refund`, `/status`, `/webhook`.
3. **Environment-Driven**: Provider selected via `PAYMENT_PROVIDER` env var.
4. **Validation**: All inputs validated with Zod schemas.
5. **Error Handling**: Consistent error responses.
6. **Swagger Integration**: Auto-documented endpoints.
7. **Independent Usage**: Can be used in any Express app via `@charcoles/payments`.

Users add env vars like `STRIPE_SECRET_KEY` or `LEMONSQUEEZY_API_KEY`, and get working payment APIs instantly.

## Implementation Plan (Step by Step)

### Phase 1: Core Package Development

1. Create `packages/payments/` directory structure mirroring `packages/swagger/`.
2. Implement adapter pattern with interfaces for payment providers.
3. Build Stripe adapter with payment intents, refunds, webhooks.
4. Build LemonSqueezy adapter for regional payments.
5. Create main `setupPayments()` function for easy integration.
6. Add Zod schemas for request/response validation.
7. Implement error handling and logging.
8. Create package.json with dependencies (stripe, zod, etc.).
9. Build and test the standalone package.

### Phase 2: Template Integration

1. Add payments module to both `template/js/src/modules/payments/` and `template/ts/src/modules/payments/`.
2. Update CLI prompts in `bin/index.js` to include payments option.
3. Modify module copying logic to include payments when selected.
4. Update route registration in `template/*/src/routes/index.*` to conditionally load payments routes.
5. Extend env validation in `template/*/src/config/env.*` with payment provider configs.
6. Update `.env.example` files with payment variables.
7. Merge payments dependencies in CLI generation.

### Phase 3: Testing and Documentation

1. Add comprehensive unit tests for adapters, services, controllers.
2. Add integration tests for CLI generation.
3. Update Swagger guides with payment examples.
4. Update README files with payment setup instructions.
5. Add migration guide for existing projects.

### Phase 4: Verification and Release

1. Test end-to-end in generated projects.
2. Verify independent package works in non-Charcole apps.
3. Update CHANGELOG.md and version numbers.
4. Publish `@charcoles/payments` to npm.
5. Release Charcole v2.3.0.

## Independence: Working in Non-Charcole Projects

Like `@charcoles/swagger`, the payments package will be framework-agnostic:

1. **Installation**: `npm install @charcoles/payments`
2. **Setup**: Import and call `setupPayments(app, options)` in Express app.
3. **Configuration**: Pass provider config via options or env vars.
4. **Routes**: Automatically mounts `/payments/*` routes.
5. **Swagger**: Integrates with existing swagger setup for auto-docs.

Example usage:

```javascript
import { setupPayments } from "@charcoles/payments";

const app = express();
setupPayments(app, {
  provider: "lemonsqueezy",
  lemonSqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY,
});
```

This ensures the package works independently of Charcole scaffolding.

## Testing Strategy

### Unit Tests

- Test each adapter (Stripe, LemonSqueezy) with mocked HTTP calls.
- Test service layer with adapter mocks.
- Test controller validation and error handling.
- Test CLI prompts and file generation.

### Integration Tests

- Generate full Charcole project with payments enabled.
- Start server and test payment endpoints with real requests.
- Verify env validation blocks invalid configs.
- Test webhook handling with mock payloads.

### End-to-End Tests

- Complete payment flow: create intent → process payment → webhook → status check.
- Test provider switching via env var changes.
- Verify generated Swagger docs include payment endpoints.

### Test Framework

- Use Vitest for all tests.
- Mock external APIs (Stripe, LemonSqueezy).
- Run tests in CI with `npm run test:run`.

## Done Criteria

### Package Level

- [ ] `@charcoles/payments` published to npm
- [ ] All unit tests pass (100% coverage target)
- [ ] Works in independent Express apps
- [ ] Documentation complete with examples

### CLI Level

- [ ] Payments prompt appears in CLI flow
- [ ] Generated projects include payments module when selected
- [ ] Env validation works for all providers
- [ ] Routes conditionally load based on module presence

### Integration Level

- [ ] Generated apps start without errors
- [ ] Payment endpoints return expected responses
- [ ] Swagger UI shows payment docs
- [ ] Webhook endpoints process mock data correctly

### Release Ready

- [ ] CHANGELOG.md updated
- [ ] Version bumped to 2.3.0
- [ ] All tests pass in CI
- [ ] Manual testing confirms end-to-end flows

## AI Agent Guidelines

### General Instructions

- Follow the established code style: ES modules, async/await, Zod validation, minimal comments.
- Use functional programming where possible.
- Ensure all async operations are properly handled.
- Test every change immediately.
- Keep code DRY (Don't Repeat Yourself).

### Implementation Rules

- Always check file existence before importing optional modules.
- Use environment variables for all configuration.
- Implement proper error handling with custom error classes.
- Follow the adapter pattern strictly for provider abstraction.
- Ensure TypeScript types are accurate and complete.

### Testing Rules

- Write tests before implementation where possible (TDD).
- Mock all external dependencies.
- Test both success and error paths.
- Use descriptive test names.

### File Organization

- Keep related code together.
- Use consistent directory structure.
- Follow existing naming conventions.

## Code Style Instructions

- **Imports**: Group by external libraries, then internal modules. Use absolute paths where possible.
- **Functions**: Use arrow functions for callbacks, regular functions for exports.
- **Async**: Always use async/await, never promises directly.
- **Validation**: Use Zod for all input validation.
- **Errors**: Throw custom error classes, handle in middleware.
- **Comments**: Only add comments for complex business logic or non-obvious code.
- **Naming**: camelCase for variables/functions, PascalCase for classes/types, UPPER_CASE for constants.
- **Formatting**: 2 spaces indentation, no semicolons in JS, semicolons in TS.

## Task Checklist

### Core Package Development

- [ ] Create `packages/payments/` directory structure
  - Check: Directory exists with `src/`, `package.json`, `README.md`
- [ ] Implement adapter interfaces
  - Check: `PaymentAdapter` interface defined with all methods
- [ ] Build Stripe adapter
  - Check: Handles createPaymentIntent, refundPayment, getPaymentStatus, verifyWebhook
- [ ] Build LemonSqueezy adapter
  - Check: Handles checkout creation, order retrieval, webhook verification
- [ ] Create setupPayments function
  - Check: Function mounts routes and configures adapters
- [ ] Add Zod schemas
  - Check: All request/response schemas defined and validated
- [ ] Implement error handling
  - Check: Custom errors thrown and handled consistently
- [ ] Create package.json
  - Check: Dependencies include stripe, zod, express types
- [ ] Build and test package
  - Check: `npm run build` succeeds, basic tests pass

### Template Integration

- [ ] Add payments module to templates
  - Check: Both JS and TS templates have `src/modules/payments/` with all files
- [ ] Update CLI prompts
  - Check: `bin/index.js` includes payments question and provider selection
- [ ] Modify module copying
  - Check: Payments module copied when selected in CLI
- [ ] Update route registration
  - Check: `src/routes/index.*` conditionally imports payments routes
- [ ] Extend env validation
  - Check: Payment provider configs added to env schemas
- [ ] Update .env.example
  - Check: Payment variables documented in example files
- [ ] Merge dependencies
  - Check: CLI merges payments package.json correctly

### Testing and Documentation

- [ ] Add unit tests
  - Check: Tests for adapters, services, controllers exist and pass
- [ ] Add integration tests
  - Check: CLI generation tests verify file copying and env setup
- [ ] Update Swagger guides
  - Check: Payment endpoints documented in SWAGGER_GUIDE.md
- [ ] Update README files
  - Check: Payment setup instructions added to template READMEs
- [ ] Add migration guide
  - Check: Guide for adding payments to existing Charcole projects

### Verification and Release

- [ ] Test end-to-end
  - Check: Generated projects start and payment endpoints work
- [ ] Verify independence
  - Check: Package works in non-Charcole Express apps
- [ ] Update CHANGELOG.md
  - Check: v2.3.0 changes documented
- [ ] Bump version
  - Check: package.json versions updated to 2.3.0
- [ ] Publish package
  - Check: `@charcoles/payments` available on npm
- [ ] Release Charcole
  - Check: v2.3.0 tagged and published

## Summary

Charcole v2.3.0 adds a powerful, optional payments module that solves real backend developer pain points. By providing pre-built payment APIs with regional provider support, developers can focus on business logic instead of payment integration. The adapter pattern ensures flexibility, and the independent package design allows usage beyond Charcole projects. Comprehensive testing and clear documentation ensure reliability and ease of use.

## Dependencies

- **Runtime**: express, zod, stripe, https (built-in)
- **Dev**: @types/express, @types/node, vitest, typescript
- **Peer**: @charcoles/swagger (optional for docs)

## Migration Guide

For existing Charcole projects:

1. Install `@charcoles/payments`: `npm install @charcoles/payments`
2. Add payment env vars to `.env`
3. Import and setup in `src/app.js`: `setupPayments(app, { provider: 'lemonsqueezy' })`
4. Routes available at `/payments/*`

For new projects: Select payments during CLI setup.
