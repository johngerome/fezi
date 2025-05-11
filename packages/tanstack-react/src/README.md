# TanStack Query Integration for Fezi

This module provides integration between Fezi and [TanStack Query](https://tanstack.com/query/latest) (formerly React Query), allowing you to easily create query and mutation hooks from your Fezi endpoints.

## Installation

This feature requires TanStack Query as a peer dependency:

```bash
# Using npm
npm install @fezi/client @fezi/tanstack-react

# Using yarn
yarn add @fezi/client @fezi/tanstack-react

# Using pnpm
pnpm add @fezi/client @fezi/tanstack-react
```

## Usage

### Basic Usage

```typescript
import { APIClient } from '@fezi/client';
import { createTanStackAPI } from '@fezi/tanstack-react';
import { useQueryClient } from '@tanstack/react-query'; 

const queryClient = useQueryClient();  

// Create a Fezi client
const client = new APIClient({
  url: 'https://api.example.com',
});

// Define your API endpoints
const usersGet = client.route({ method: 'GET', path: '/users' });
const usersPost = client.route({ method: 'POST', path: '/users' });

// Create a router with your endpoints
const router = {
  users: {
    get: usersGet,
    post: usersPost,
  },
};

// Create a TanStack Query API from your router
const api = createTanStackAPI(router);

// Use in React components
function UsersComponent() {
  // For queries (GET)
  const usersQuery = useQuery(api.users.get.queryOptions());

  // For mutations (POST, PUT, DELETE)
  const createUserMutation = useMutation(api.users.post.mutationOptions({
    // Mutation options go here
    mutationKey: ['users', 'create'],
    onSuccess: (data) => {
      console.log('User created:', data);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  }));

  // Then use the mutate function with your payload
  createUserMutation.mutate({ name: 'john' });

  if (usersQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (usersQuery.isError) {
    return <div>Error: {usersQuery.error.message}</div>;
  }

  return (
    <div>
      <ul>
        {usersQuery.data.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button
        onClick={() => createUserMutation.mutate({ name: 'New User' })}
        disabled={createUserMutation.isPending}
      >
        Add User
      </button>
    </div>
  );
}
```

### Advanced Usage

#### Custom Query Keys

```typescript
const userQuery = useQuery(
  api.users.getById.queryOptions({
    params: { id: '123' },
    queryKey: ['users', '123'],
    staleTime: 5 * 60 * 1000,
  })
);
```

#### Mutation Options

```typescript
// 1. Basic usage
const createUserMutation = useMutation(api.users.post.mutationOptions());

createUserMutation.mutate({ name: 'John Doe' });

// 2. With mutation options
const createUserMutation = useMutation(
  api.users.post.mutationOptions({
    mutationKey: ['users', 'create'],
    onSuccess: (data) => {
      console.log('User created:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  })
);

createUserMutation.mutate({ name: 'John Doe' });

// 3. Destructuring the mutate function (recommended)
const { mutate: createUser } = useMutation(
  api.users.post.mutationOptions({
    mutationKey: ['users', 'create'],
    onSuccess: (data) => {
      console.log('User created:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  })
);

// Then use the mutate function directly
createUser({ name: 'John Doe' });
```

## API Reference

### `createTanStackAPI(router, path?)`

Creates a TanStack Query API from a Fezi router.

- `router`: The Fezi router to enhance
- `path` (optional): Base path for query keys (default: `[]`)

Returns a router with TanStack Query capabilities.

### Enhanced Endpoint Methods

Each endpoint in the router is enhanced with the following methods:

#### `queryOptions(config?)`

Get query options for this endpoint.

- `config`: Configuration options
  - `params`: Query parameters to be passed to the endpoint
  - `queryKey`: Custom query key to use instead of the default
  - ...other TanStack Query options

Returns `UseQueryOptions` that can be passed to `useQuery`.

#### `mutationOptions(options?)`

Get mutation options for this endpoint.

- `options`: TanStack Query mutation options (except mutationFn which is provided automatically)

Returns complete mutation options that can be passed directly to `useMutation`.

```typescript
// Basic usage
const { mutate } = useMutation(
  api.users.post.mutationOptions({
    // Mutation options
    mutationKey: ['users', 'create'],
    onSuccess: (data) => {
      // Handle success
    },
  })
);

// Then use it with your payload
mutate({ name: 'john' });
```
