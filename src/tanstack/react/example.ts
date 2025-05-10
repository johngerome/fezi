/**
 * Example usage of zimfetch with TanStack Query
 *
 * This file demonstrates how to use the TanStack Query integration
 * with zimfetch in a React application.
 */

import { APIClient } from '../../lib/client';
import { createTanStackAPI } from './index';
// Note: These imports are only for example purposes
// The actual implementation would require the user to install @tanstack/react-query
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Create a QueryClient for examples
const queryClient = new QueryClient();

// Step 1: Create a zimfetch client
const client = new APIClient({
  url: 'https://api.example.com',
});

// Step 2: Define your API endpoints with types
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

const usersGet = client.route<void, User[]>({ method: 'GET', path: '/users' });
const usersPost = client.route<CreateUserInput, User>({ method: 'POST', path: '/users' }).input(
  z.object({
    name: z.string(),
    email: z.string().email(),
  })
);
const userGet = client.route<void, User>({ method: 'GET', path: '/users/:id' });

// Step 3: Create a router with your endpoints
const router = {
  users: {
    get: usersGet,
    post: usersPost,
    getById: userGet,
  },
};

// Step 4: Create a TanStack Query API from your router
const api = createTanStackAPI(router);

// Step 5: Use in React components

/**
 * Example React component using TanStack Query with zimfetch
 */
export function UsersExample() {
  // Example 1: Basic query
  const usersQuery = useQuery(api.users.get.queryOptions());

  // Example 2: Query with parameters
  const userQuery = useQuery(
    api.users.getById.queryOptions({
      params: { id: '123' },
      // You can also provide custom query key
      queryKey: ['users', '123'],
      // Other TanStack Query options
      enabled: true,
      staleTime: 5 * 60 * 1000,
    })
  );

  // Example 3: Basic Mutation
  const createUserMutation = useMutation<User, Error, CreateUserInput>(
    api.users.post.mutationOptions()
  );

  // Example 4: Mutation with options
  const createUserWithOptions = useMutation<User, Error, CreateUserInput>(
    api.users.post.mutationOptions({
      mutationKey: ['users', 'create'],
      onSuccess: (data: User) => {
        console.log('User created:', data);
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    })
  );

  // Example 5: Destructuring the mutate function
  const { mutate: createUser } = useMutation<User, Error, CreateUserInput>(
    api.users.post.mutationOptions({
      onSuccess: (data: User) => {
        console.log('User created:', data);
      },
    })
  );

  // Example 6: Mutation with retry and other options
  const { mutate: createUserWithRetry } = useMutation<User, Error, CreateUserInput>(
    api.users.post.mutationOptions({
      retry: 3,
      retryDelay: 1000,
      onError: (error: Error) => {
        console.error('Failed to create user:', error);
      },
    })
  );

  // Use the queries and mutations in your component
  const handleCreateUser = () => {
    const johnData: CreateUserInput = { name: 'John Doe', email: 'john@example.com' };
    const janeData: CreateUserInput = { name: 'Jane Doe', email: 'jane@example.com' };
    const aliceData: CreateUserInput = { name: 'Alice', email: 'alice@example.com' };
    const bobData: CreateUserInput = { name: 'Bob', email: 'bob@example.com' };

    // Basic usage
    createUserMutation.mutate(johnData);

    // Using the mutation with options
    createUserWithOptions.mutate(janeData);

    // Using the destructured mutate function
    createUser(aliceData);

    // Using the mutation with retry
    createUserWithRetry(bobData);
  };

  return null; // Replace with your actual component JSX
}
