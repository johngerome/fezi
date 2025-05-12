# Fezi

![GitHub Release](https://img.shields.io/github/v/release/johngerome/fezi)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/johngerome/fezi/publish.yml)

Fezi is a light and flexible fetch wrapper for both browser and Node.js environments, offering a clean and easy-to-use API for all your HTTP requirements. With a TypeScript-first philosophy, Fezi provides complete type definitions for improved safety and autocompletion.

## Features

- **TypeScript-first**: Complete type definitions for safety and autocompletion.
- **Universal**: Compatible with both browser and Node.js environments.
- **Simple API**: Simple, intuitive API for standard HTTP operations.
- **Automatic JSON parsing**: Parsed JSON responses automatically when possible.
- **Schema validation**: Input/output validation optionally using Zod, Yup, Joi, or custom schemas.
- **Error handling**: Uniform error objects with HTTP status, response data, and request information.
- **Manual cancellation**: Supports AbortController for manual termination.
- **Composable routers and endpoints**: Create type-safe API clients using endpoint and router definitions.
- **Extensible**: Simple integration with validation libraries and bespoke logic.

## Installation

```bash
# Core client
npm i @fezi/client

# TanStack Query (React) integration
npm i @fezi/tanstack-react @tanstack/react-query
```

## Basic Usage

```typescript
import { APIClient, createClientAPI } from '@fezi/client';
import { z } from 'zod';

const client = new APIClient({
  url: 'https://api.example.com',
});

const routes = {
  users: {
    get: client
      .route({ method: 'GET', path: '/users/1' })
      .output(z.object({ id: z.number(), name: z.string() })),
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

const api = createClientAPI(routes);

const user = await api.users.get();
const newPost = await api.posts.create({ title: 'foo', body: 'bar', userId: 1 });
```

For more advanced examples, see the `examples/` directory in the repo.

## API Reference

### `APIClient(options?)`

#### Options

- `url` - The URL to make the request to
- `headers` - Request headers

#### Returns

Promise that resolves to a response object with:

- `data` - Parsed response data
- `error` - Error object if request failed, null otherwise
- `status` - HTTP status code
- `headers` - Response headers

## Inspiration

Fezi draws inspiration from these excellent projects:

- [oRPC](https://github.com/unnoq/orpc) - Type-safe RPC framework for TypeScript
- [Hyper Fetch](https://hyperfetch.bettertyped.com/) - Modern data fetching library for TypeScript

## License

MIT
