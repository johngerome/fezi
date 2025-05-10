# ZimFetch

ZimFetch is a lightweight and versatile fetch wrapper designed for both browser and Node.js environments, providing a simple and intuitive API for all your HTTP needs. With a TypeScript-first approach, ZimFetch ensures full type definitions for enhanced safety and autocompletion, making it an ideal choice for developers who prioritize code quality and maintainability.

## Installation

```bash
# npm
npm install @johngerome/zimfetch

# yarn
yarn add @johngerome/zimfetch

# pnpm
pnpm add @johngerome/zimfetch
```

## Features

- **TypeScript-first**: Full type definitions for safety and autocompletion.
- **Universal**: Works in both browser and Node.js environments.
- **Simple API**: Minimal, intuitive API for common HTTP operations.
- **Automatic JSON parsing**: Automatically parses JSON responses when possible.
- **Schema validation**: Optional input/output validation with Zod, Yup, Joi, or custom schemas.
- **Error handling**: Consistent error objects with HTTP status, response data, and request details.
- **Request timeouts**: Abort requests after a configurable timeout.
- **Request cancellation**: Supports AbortController for manual cancellation.
- **Custom headers and base URL**: Easily set default headers and a base URL for all requests.
- **Composable endpoints and routers**: Build type-safe API clients with endpoint and router definitions.
- **Extensible**: Easily integrate with validation libraries and custom logic.
- **Promise-based**: Modern async/await support.
- **Lightweight**: Minimal dependencies and small bundle size.

## Usage

```typescript
import { createClientAPI } from '@johngerome/zimfetch';

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

### `@johngerome/zimfetch(url, options?)`

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

ZimFetch draws inspiration from these excellent projects:

- [oRPC](https://github.com/unnoq/orpc) - Type-safe RPC framework for TypeScript
- [Hyper Fetch](https://hyperfetch.bettertyped.com/) - Modern data fetching library for TypeScript

## License

MIT
