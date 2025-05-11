import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { APIClient } from '@fezi/client';
import { createTanStackAPI } from '@fezi/tanstack-react';
import { z } from 'zod';

const todoResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
  userId: z.number(),
});

const todoCreateSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  userId: z.number(),
});

const todoUpdateSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
  userId: z.number(),
});

const client = new APIClient({
  url: 'https://jsonplaceholder.typicode.com',
});

const routerDefinition = {
  todos: {
    get: client.route({ method: 'GET', path: '/todos' }).output(todoResponseSchema.array()),
    getById: client.route({ method: 'GET', path: '/todos/:id' }).output(todoResponseSchema),
    create: client
      .route({ method: 'POST', path: '/todos' })
      .input(todoCreateSchema)
      .output(todoResponseSchema),
    update: client
      .route({ method: 'PUT', path: '/todos/:id' })
      .input(todoUpdateSchema)
      .output(todoResponseSchema),
    delete: client.route({ method: 'DELETE', path: '/todos/:id' }).output(z.object({})),
  },
};

const api = createTanStackAPI(routerDefinition);

function App() {
  const [todoId, setTodoId] = useState(1);

  const todosQuery = useQuery(api.todos.get.queryOptions());
  const todoByIdQuery = useQuery(api.todos.getById.queryOptions({ urlParams: { id: todoId } }));

  const createMutation = useMutation(api.todos.create.mutationOptions());

  const updateMutation = useMutation({
    mutationKey: ['todos', 'update', todoId],
    ...api.todos.update.mutationOptions({ urlParams: { id: todoId } }),
  });

  const deleteMutation = useMutation({
    mutationKey: ['todos', 'delete', todoId],
    ...api.todos.delete.mutationOptions({ urlParams: { id: todoId } }),
  });

  const handleCreateTodo = () => {
    createMutation.mutate({
      title: `New Todo ${Date.now()}`,
      completed: false,
      userId: 1,
    });
  };

  const handleUpdateTodo = () => {
    updateMutation.mutate({
      id: todoId,
      title: `Updated Todo ${todoId}`,
      completed: true,
      userId: 1,
    });
  };

  const handleDeleteTodo = () => {
    deleteMutation.mutate(undefined);
  };

  return (
    <div>
      <h1>FeZI React Demo</h1>

      <div>
        <input
          type="number"
          value={todoId}
          onChange={(e) => setTodoId(parseInt(e.target.value, 10))}
        />
      </div>

      <h2>Todos (First 5)</h2>
      {todosQuery.isLoading && <p>Loading todos...</p>}
      {todosQuery.error && <p>Error loading todos: {todosQuery.error?.message}</p>}
      {todosQuery.data && (
        <>
          <p>Successfully loaded {todosQuery.data?.length} todos</p>
          <pre>{JSON.stringify(todosQuery.data?.slice(0, 5), null, 2)}</pre>
        </>
      )}

      <h2>Todo by ID: {todoId}</h2>
      {todoByIdQuery.isLoading && <p>Loading todo {todoId}...</p>}
      {todoByIdQuery.error && (
        <p>
          Error loading todo {todoId}: {todoByIdQuery.error?.message}
        </p>
      )}

      {todoByIdQuery.data && <pre>{JSON.stringify(todoByIdQuery.data, null, 2)}</pre>}

      <h2>Actions</h2>
      <button onClick={handleCreateTodo} disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Todo'}
      </button>
      <button onClick={handleUpdateTodo} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Updating...' : `Update Todo ${todoId}`}
      </button>
      <button onClick={handleDeleteTodo} disabled={deleteMutation.isPending}>
        {deleteMutation.isPending ? 'Deleting...' : `Delete Todo ${todoId}`}
      </button>

      <h2>Mutation Status</h2>
      {createMutation.isSuccess && <p>Create successful!</p>}
      {createMutation.error && <p>Create error: {createMutation.error?.message}</p>}

      {createMutation.data && <pre>{JSON.stringify(createMutation.data, null, 2)}</pre>}

      {updateMutation.isSuccess && <p>Update successful!</p>}
      {updateMutation.error && <p>Update error: {updateMutation.error?.message}</p>}

      {updateMutation.data && <pre>{JSON.stringify(updateMutation.data, null, 2)}</pre>}

      {deleteMutation.isSuccess && <p>Delete successful!</p>}
      {deleteMutation.error && <p>Delete error: {deleteMutation.error?.message}</p>}

      {deleteMutation.data && Object.keys(deleteMutation.data).length > 0 && (
        <pre>{JSON.stringify(deleteMutation.data, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;
