# @fezi/client

A lightweight fetch wrapper for browser and Node.js.

## Installation

```bash
npm install @fezi/client
# or
yarn add @fezi/client
# or
pnpm add @fezi/client
```

## Usage

```typescript
import { createClientAPI, APIClient } from '@fezi/client';

// Create a client
const client = new APIClient({
  baseURL: 'https://api.example.com',
});

// Create a router
const api = createClientAPI(client, {
  users: {
    get: { method: 'GET', path: '/users' },
    getById: { method: 'GET', path: '/users/:id' },
    create: { method: 'POST', path: '/users' },
  },
});

// Use the API
const getUsers = async () => {
  const response = await api.users.get.execute();
  return response.data;
};

const createUser = async (userData) => {
  const response = await api.users.create.execute(userData);
  return response.data;
};
```

## License

MIT
