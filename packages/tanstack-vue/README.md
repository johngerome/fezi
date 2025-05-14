# @fezi/tanstack-vue

TanStack Query (Vue Query) integration for fezi.

## Installation

```bash
# Using npm
npm install @tanstack/vue-query @fezi/client @fezi/tanstack-vue

# Using yarn
yarn add @tanstack/vue-query @fezi/client @fezi/tanstack-vue

# Using pnpm
pnpm add @tanstack/vue-query @fezi/client @fezi/tanstack-vue
```

## Usage

```typescript
import { APIClient } from '@fezi/client'; // Assuming createClientAPI is not needed for this example based on react version
import { createTanStackAPI } from '@fezi/tanstack-vue';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { z } from 'zod'; // Added import for zod
import { defineComponent, computed } from 'vue'; // Added imports for Vue

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
      create: client.route({ path: '/users', method: 'POST' }).input(userSchema.omit({ id: true })).output(userSchema), // Assuming create also returns the created user
    },
  },
};

// Create a TanStack Query API
const api = createTanStackAPI(routes);

// Use in a Vue component
export default defineComponent({
  setup() {
    // For queries (GET)
    const queryResult = useQuery(api.v1.users.get.queryOptions());

    // For mutations (POST, PUT, DELETE)
    const mutationResult = useMutation(api.v1.users.create.mutationOptions());

    const users = computed(() => queryResult.data.value || []);
    const isLoading = computed(() => queryResult.isLoading.value);
    const isError = computed(() => queryResult.isError.value);
    const error = computed(() => queryResult.error.value);

    const addUser = () => {
      // @ts-expect-error //FIXME: need to check correct type for omit
      mutationResult.mutate({ name: 'New User', email: 'newuser@example.com' }); // Added email to match schema
    };

    return {
      users,
      isLoading,
      isError,
      error,
      addUser,
      isAddingUser: computed(() => mutationResult.isPending.value),
    };
  },
  template: `
    <div>
      <div v-if="isLoading">
        <p>Loading...</p>
      </div>
      <div v-else-if="isError">
        <p>Error: {{ error?.message }}</p>
      </div>
      <ul v-else>
        <li v-for="user in users" :key="user.id">{{ user.name }}</li>
      </ul>
      <button @click="addUser" :disabled="isAddingUser">
        {{ isAddingUser ? 'Adding...' : 'Add User' }}
      </button>
    </div>
  `
});

```

## License

MIT
