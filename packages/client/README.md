# @fezi/client

Type-Safe Fetching Made Easy

## Installation

```bash
npm install @fezi/client
# or
yarn add @fezi/client
# or
pnpm add @fezi/client
```

## Basic Usage

```typescript
import { createClientAPI, APIClient } from '@fezi/client';
import { z } from 'zod';

// Create a client
const client = new APIClient({
  baseURL: 'https://api.example.com',
  headers() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  },
});

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// Define routes
const routes = {
  v1: {
    users: {
      get: client.route({ path: '/users' }).output(z.array(userSchema)),
      getById: client.route({ path: '/users/:id' }).output(userSchema),
      create: client.route({ path: '/users', method: 'POST' }).input(userSchema.omit({ id: true })),
    },
  },
};

// Create a router
const api = createClientAPI(client, routes);

// Use the API
const getUsers = await api.v1.users.get.execute();
// getUsers.data
// getUsers.error

const getById = await api.v1.users.getById.execute({ id: 1 });
// getById.data
// getById.error

const createUser = await api.v1.users.create.execute({
  name: 'John Doe',
  email: 'john.doe@example.com',
});
// createUser.data
// createUser.error
```

## License

MIT
