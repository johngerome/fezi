# Fezi

Fezi is a light and flexible fetch wrapper for both browser and Node.js environments, offering a clean and easy-to-use API for all your HTTP requirements. With a TypeScript-first philosophy, Fezi provides complete type definitions for improved safety and autocompletion, making it the perfect option for developers who value code quality and maintainability.

## Packages

This monorepo contains the following packages:

- [@fezi/client](./packages/client) - Core fetch wrapper library
- [@fezi/tanstack-react](./packages/tanstack-react) - TanStack Query (React) integration

## Installation

```bash
# Core client
npm install @fezi/client

# TanStack Query (React) integration
npm install @fezi/tanstack-react @tanstack/react-query

# Or using yarn/pnpm
yarn add @fezi/client
pnpm add @fezi/client
```

## Features

- **TypeScript-first**: Complete type definitions for safety and autocompletion.
- **Universal**: Compatible with both browser and Node.js environments.
- **Simple API**: Simple, intuitive API for standard HTTP operations.
- **Automatic JSON parsing**: Parsed JSON responses automatically when possible.
- **Schema validation**: Input/output validation optionally using Zod, Yup, Joi, or custom schemas.
- **Error handling**: Uniform error objects with HTTP status, response data, and request information.
- **Request timeouts**: Abort requests after a configurable timeout.
- **Manual cancellation**: Supports AbortController for manual termination.
- **Default headers and base URL**: Simple setting of default headers and a base URL to use across all requests.
- **Composable routers and endpoints**: Create type-safe API clients using endpoint and router definitions.
- **Extensible**: Simple integration with validation libraries and bespoke logic.
- **Promise-based**: Updated async/await support.
- **Lightweight**: Few dependencies and small bundle size.

## Usage

```typescript
import { APIClient } from '@fezi/client';

const router = {
  users: {
    get: client.route({ method: 'GET', path: '/users/1' }).output(userSchema),
  },
  posts: {
    create: client
      .route({ method: 'POST', path: '/posts' })
      .input(z.object({ title: z.string(), body: z.string(), userId: z.number() }))
      .output(
        z.object({ id: z.number(), title: z.string(), body: z.string(), userId: z.number() })
      ),
  },
};

const api = createClientAPI(router);

const user = await api.users.get();
const newPost = await api.posts.create({ title: 'foo', body: 'bar', userId: 1 });
```

// For more advanced examples, see the `examples/` directory in the repo.

## API Reference

### `APIClient(url, options?)`

#### Parameters

- `url` - The URL to make the request to
- `options` - Optional configuration object

#### Options

- `method` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `headers` - Request headers
- `body` - Request body (automatically stringified if object)
- `timeout` - Request timeout in milliseconds
- `retries` - Number of retry attempts for failed requests
- `signal` - AbortSignal to cancel the request

#### Returns

Promise that resolves to a response object with:

- `data` - Parsed response data
- `status` - HTTP status code
- `headers` - Response headers
- `ok` - Boolean indicating if status is in the range 200-299

## Inspiration

Fezi draws inspiration from these excellent projects:

- [oRPC](https://github.com/unnoq/orpc) - Type-safe RPC framework for TypeScript
- [Hyper Fetch](https://hyperfetch.bettertyped.com/) - Modern data fetching library for TypeScript

## License

MIT
