# @fezi/tanstack-react

![GitHub Release](https://img.shields.io/github/v/release/johngerome/fezi)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/johngerome/fezi/publish.yml)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/%40fezi%2Ftanstack-react)

TanStack Query (React Query) integration for fezi.

## Installation

```bash
npm i @tanstack/react-query @fezi/client @fezi/tanstack-react
```

## Usage

```typescript
import { APIClient, createClientAPI } from '@fezi/client';
import { createTanStackAPI } from '@fezi/tanstack-react';
import { useQuery, useMutation } from '@tanstack/react-query';

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

// Create a TanStack Query API
const api = createTanStackAPI(client, routes);

// Use in a React component
function App() {
  // For queries (GET)
  const query = useQuery(api.v1.users.get.queryOptions());

  // For mutations (POST, PUT, DELETE)
  const mutation = useMutation(api.v1.users.create.mutationOptions());

  // Use the query and mutation as needed
  return (
    <div>
      {query.isLoading ? (
        <p>Loading...</p>
      ) : query.isError ? (
        <p>Error: {query.error.message}</p>
      ) : (
        <ul>
          {query.data.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
      <button
        onClick={() => mutation.mutate({ name: 'New User' })}
        disabled={mutation.isPending}
      >
        Add User
      </button>
    </div>
  );
}
```

## License

MIT
