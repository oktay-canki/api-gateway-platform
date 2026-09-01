# API Gateway Platform

A small-scale API gateway platform built with Node.js and TypeScript. Clients can register upstream APIs and configure API-level and route-level policies that the gateway enforces before forwarding requests to the upstream service.

The project focuses on demonstrating backend engineering concepts and commonly used infrastructure patterns such as API gateway routing, Redis-backed rate limiting, request proxying, timeouts, retries, and configuration management.

## Overview

The platform consists of two main applications:

- **Gateway API** — receives incoming requests, authenticates API keys, resolves API and route configuration, applies configured policies, and proxies requests to the registered upstream API.
- **Dashboard** — manages registered APIs and their route configurations.

MongoDB acts as the source of truth for API configuration. The gateway loads this configuration into an in-memory cache at startup so request processing does not require a database lookup for every incoming request.

Redis is used specifically for maintaining rate-limiting state.

## Gateway Request Flow

Requests pass through a series of dedicated middleware responsible for individual gateway concerns:

```text
Incoming Request
       │
       ▼
 X-API-Key Authentication
       │
       ▼
 API Configuration
 + Route Rules
       │
       ▼
    Resolve Route
       │
       ▼
 Resolved Route Config
       │
       ▼
   Rate Limiting
       │
       ▼
 Retry Enforcement
       │
       ▼
 Proxy Request
       │
       ├── Timeout
       │
       └── Upstream API
```

### 1. API Key Authentication

The gateway receives an `X-API-Key` with the incoming request.

The key is used to identify the registered API configuration from the gateway's local configuration cache. The corresponding API configuration and route rules are attached to the Express request for subsequent middleware.

### 2. Route Resolution

The gateway attempts to match the incoming request path against the registered route rules.

A `ResolvedRouteConfig` is created from the API configuration and the matching route rule. Route-specific configuration overrides the API-level configuration where applicable.

This gives the gateway a single configuration object describing the policies that should apply to the current request.

### 3. Rate Limiting

Rate limiting is implemented using Redis and atomic Lua scripts.

Two algorithms are supported:

- **Sliding Window**
- **Token Bucket**

Rate limits can be configured at either:

- **API scope** — requests share a rate-limit pool for the API.
- **Route scope** — a specific route has its own rate-limit configuration.

The rate-limiting state is kept in Redis rather than MongoDB because it is request-time operational state rather than persistent API configuration.

### 4. Retry Enforcement

Requests can be configured with a retry policy containing a maximum retry count and retry delay.

Retries are intentionally restricted to methods considered safe to retry by this implementation:

```text
GET
HEAD
OPTIONS
```

This avoids automatically repeating operations such as `POST` requests where repeating the operation could have unintended side effects.

### 5. Proxying and Timeout

Requests that pass the gateway policies are forwarded to their registered upstream API.

The gateway preserves the request path and query string when constructing the upstream request.

Upstream requests can also have a configured timeout. If the upstream does not respond within the configured period, the gateway treats the request as a proxy failure.

## Configuration Model

MongoDB is the source of truth for registered APIs and their configuration.

The gateway currently loads this configuration into an in-memory cache at startup:

```text
                 MongoDB
                    │
                    │ configuration
                    ▼
             Gateway Cache
                    │
                    ▼
             Gateway Request
```

This avoids querying MongoDB during normal request processing and allows API configuration to be resolved through fast in-memory lookups.

Redis is separate from this configuration path:

```text
MongoDB ──────► Gateway Configuration Cache
                         │
                         ▼
                    Request Flow
                         │
                         ▼
                   Rate Limiting
                         │
                         ▼
                       Redis
```

MongoDB therefore remains responsible for persistent configuration while Redis handles the high-frequency state required by rate limiting.

## Technology Stack

### Gateway

- Node.js
- TypeScript
- Express.js
- MongoDB
- Redis
- Docker
- `http-proxy`
- `path-to-regexp`

### Dashboard

- Next.js
- React
- TypeScript

### Testing

- Vitest
- Supertest

## Running the Project

The project is structured as a small monorepo containing the gateway, dashboard, and mock upstream backend.

The development environment can be started from the repository root with:

```bash
docker compose up
```

Docker Compose provides the required MongoDB, Redis, gateway, dashboard, and mock backend services.

Environment-specific values should be configured using the provided `.env.example` files.

## Testing

The project uses both unit and integration testing.

### Unit Tests

Unit tests cover isolated gateway behaviour including:

- route matching
- route resolution
- rate-limit middleware
- request forwarding and retry orchestration

### Integration Tests

Integration tests exercise real infrastructure where appropriate.

Examples include:

- loading API configuration from MongoDB
- executing the Redis Lua scripts for sliding-window rate limiting
- executing the Redis Lua scripts for token-bucket rate limiting
- forwarding requests through the gateway to the mock upstream
- path and query-string forwarding
- upstream timeout handling
- retry behaviour
- upstream error responses

The rate-limiter integration tests use an actual Redis instance rather than mocking Redis so that the atomic Lua scripts are tested against the system they are designed to operate on.

## Design Decisions and Scope

This project intentionally focuses on implementing the core responsibilities of an API gateway without attempting to reproduce the complexity of a production-scale gateway platform.

Some design decisions are therefore deliberately simplified.

### API-scoped rate limiting

Rate limits are associated with a registered API or an individual route rather than with the end users of the upstream API.

This means a configured API-level limit represents a shared request pool for that API.

End-user-specific rate limiting would require the gateway to receive and reliably identify an authenticated end-user identity with each request. That introduces additional authentication and identity-management concerns that are outside the intended scope of this project.

### In-memory configuration cache

The gateway currently builds its configuration cache from MongoDB when it starts.

A production implementation could require more sophisticated configuration distribution and cache invalidation strategies across multiple gateway instances. Those mechanisms are intentionally outside the current scope.

### Retry policy

Retries are deliberately conservative and limited to methods that are generally safe to repeat.

A production gateway could require additional policies around idempotency, upstream error classification, exponential backoff, jitter, circuit breakers, and maximum retry budgets.

### Small-scale architecture

The project is intentionally designed around a single gateway application and a straightforward configuration model rather than attempting to solve every distributed-systems problem associated with a large gateway deployment.

The goal is to demonstrate understanding of the underlying backend patterns and their trade-offs rather than to build a production replacement for established API gateway products.

## Project Structure

```text
api-gateway-platform/
├── dashboard/
├── gateway-api/
├── mock-backend/
├── docker-compose.yml
└── README.md
```

The gateway itself is organized around separate responsibilities:

```text
gateway-api/src/
├── cache/
├── middleware/
├── proxy/
├── rate-limit/
├── routes/
├── types/
└── ...
```

This separation keeps gateway concerns such as authentication, route resolution, rate limiting, proxying, and error handling independently testable and easier to extend.

## Future Improvements

Possible future improvements include:

- configuration cache refresh/invalidation
- more sophisticated retry policies
- exponential backoff and jitter
- circuit breaker behaviour
- improved upstream error classification
- additional rate-limiting strategies
- more extensive gateway integration tests
- dashboard UI for API and route management
- support for distributed gateway instances and coordinated configuration updates

These are intentionally left outside the current implementation so the project can remain focused on its core gateway functionality.
