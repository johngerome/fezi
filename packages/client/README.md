# @fezi/client

![GitHub Release](https://img.shields.io/github/v/release/johngerome/fezi)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/johngerome/fezi/publish.yml)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/%40fezi%2Fclient)

## Installation

```bash
npm i @fezi/client
```

## Basic Usage

```typescript
import { createClientAPI, APIClient } from '@fezi/client';
import { z } from 'zod';

// Create a client
const client = new APIClient({
  url: 'https://api.example.com',
  headers() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`,
    };
  },
});

// Define schema using Zod
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
