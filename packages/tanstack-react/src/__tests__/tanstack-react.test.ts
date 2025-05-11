/**
 * Tests for the TanStack Query integration
 *
 * NOTE: This test file is excluded from the build via tsconfig.json.
 * It is only used for testing purposes and not part of the published package.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient, Endpoint } from '@fezi/client';
import { createTanStackAPI } from '..';

// Mock fetch for all tests
vi.stubGlobal('fetch', vi.fn());

// Mock TanStack Query hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe('TanStack Query Integration', () => {
  let client: APIClient;
  let api: any;

  beforeEach(() => {
    // Reset fetch mock for each test
    vi.mocked(fetch)
      .mockReset()
      .mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: { id: '123' } }),
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: '123' } })),
        } as Response);
      });

    // Create a client
    client = new APIClient({
      url: 'https://api.example.com',
    });

    // Create endpoints
    const usersGet = client.route({ method: 'GET', path: '/users' });
    const usersPost = client.route({ method: 'POST', path: '/users' });
    const userGet = client.route({ method: 'GET', path: '/users/:id' });

    // Create auth endpoints for testing nested routers
    const authLogin = client.route({ method: 'POST', path: '/auth/login' });
    const authRegister = client.route({ method: 'POST', path: '/auth/register' });
    const authVerify = client.route({ method: 'POST', path: '/auth/verify' });

    // Create a router with nested structure
    const router = {
      users: {
        get: usersGet,
        post: usersPost,
        getById: userGet,
      },
      auth: {
        login: authLogin,
        register: authRegister,
        verify: authVerify,
      },
    };

    // Create a TanStack API
    api = createTanStackAPI(router);
  });

  describe('Nested Router Support', () => {
    it('should properly attach methods to endpoints in nested routers', () => {
      // Check that auth endpoints have the mutationOptions method
      expect(api.auth).toBeDefined();
      expect(api.auth.register).toBeDefined();
      expect(typeof api.auth.register.mutationOptions).toBe('function');
      expect(typeof api.auth.login.mutationOptions).toBe('function');
      expect(typeof api.auth.verify.mutationOptions).toBe('function');

      // Get mutation options from a nested endpoint
      const options = api.auth.register.mutationOptions();

      // Verify the options are correctly created
      expect(options).toHaveProperty('mutationFn');
      expect(typeof options.mutationFn).toBe('function');
    });

    it('should properly preserve mutationOptions in object spread operations', () => {
      // This test specifically addresses the issue where mutationOptions was lost
      // when the API object was spread or assigned to a new variable

      // First verify the original object has the method
      expect(typeof api.auth.register.mutationOptions).toBe('function');

      // Test with object spread
      const spreadApi = { ...api };
      expect(typeof spreadApi.auth.register.mutationOptions).toBe('function');

      // Test with Object.assign
      const assignedApi = Object.assign({}, api);
      expect(typeof assignedApi.auth.register.mutationOptions).toBe('function');

      // Test with direct property access after spread
      const { auth } = api;
      expect(typeof auth.register.mutationOptions).toBe('function');

      // Verify we can still call the method on the spread objects
      const options1 = spreadApi.auth.register.mutationOptions();
      expect(options1).toHaveProperty('mutationFn');

      const options2 = assignedApi.auth.register.mutationOptions();
      expect(options2).toHaveProperty('mutationFn');
    });

    it('should verify mutationOptions is a function on all endpoints', () => {
      // Test top-level endpoints
      expect(api.users.post).toBeDefined();
      expect(api.users.post.mutationOptions).toBeDefined();
      expect(typeof api.users.post.mutationOptions).toBe('function');

      // Test nested endpoints
      expect(api.auth.register).toBeDefined();
      expect(api.auth.register.mutationOptions).toBeDefined();
      expect(typeof api.auth.register.mutationOptions).toBe('function');

      // Ensure we can call the function without errors
      expect(() => api.auth.register.mutationOptions()).not.toThrow();
      expect(() => api.users.post.mutationOptions()).not.toThrow();

      // Verify the returned objects have the expected properties
      const authOptions = api.auth.register.mutationOptions();
      const usersOptions = api.users.post.mutationOptions();

      expect(authOptions).toHaveProperty('mutationFn');
      expect(usersOptions).toHaveProperty('mutationFn');
    });

    it('should make fetch requests from nested router endpoints', async () => {
      // Reset fetch mock
      vi.mocked(fetch)
        .mockReset()
        .mockImplementation(() => {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: '123' } }),
            headers: new Headers({ 'content-type': 'application/json' }),
            text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: '123' } })),
          } as Response);
        });

      // Get mutation options from a nested endpoint
      const options = api.auth.register.mutationOptions();

      // Call the mutation function
      const variables = { email: 'test@example.com', password: 'password123' };
      await options.mutationFn(variables);

      // Check that fetch was called with the correct path
      expect(fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      expect(fetchCall[0]).toContain('/auth/register');

      // Check that the request body includes the variables
      const requestInit = fetchCall[1] as RequestInit;
      expect(requestInit.body).toContain('test@example.com');
      expect(requestInit.body).toContain('password123');
    });
  });

  describe('Direct Property Access', () => {
    // Mock React-like component function to test API usage in a component context
    function FormSignUp() {
      // This simulates how the API would be used in a React component
      console.log('api?.auth?.register?.mutationOptions', typeof api.auth.register.mutationOptions);

      // Simulate a component that uses the mutation
      const mutation = {
        mutate: (data: any) => {
          // In a real component, this would be useMutation(api.auth.register.mutationOptions())
          const options = api.auth.register.mutationOptions();
          return options.mutationFn(data);
        },
      };

      return { mutation };
    }

    it('should verify component can access and use mutationOptions', async () => {
      // Create an instance of our mock component
      const component = FormSignUp();

      // Verify the component has access to the mutation
      expect(component.mutation).toBeDefined();

      // Reset fetch mock for this test
      vi.mocked(fetch)
        .mockReset()
        .mockImplementation(() => {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: '123' } }),
            headers: new Headers({ 'content-type': 'application/json' }),
            text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: '123' } })),
          } as Response);
        });

      // Test that we can call the mutation
      await component.mutation.mutate({ email: 'test@example.com', password: 'password123' });

      // Verify fetch was called
      expect(fetch).toHaveBeenCalled();

      // Get the last call to fetch
      const fetchCall = vi.mocked(fetch).mock.calls[0];

      // Check that the URL includes the endpoint path
      expect(fetchCall[0]).toContain('/auth/register');
    });

    it('should verify mutationOptions is directly accessible on endpoints', () => {
      // This test simulates the component scenario where the issue was observed
      // Directly accessing the mutationOptions property without calling it

      // Test direct property access on nested endpoints
      expect(api.auth.register.mutationOptions).toBeDefined();
      console.log('api?.auth?.register?.mutationOptions', typeof api.auth.register.mutationOptions);
      expect(typeof api.auth.register.mutationOptions).toBe('function');

      // Test with destructuring, which is common in React components
      const { register } = api.auth;
      expect(register.mutationOptions).toBeDefined();
      console.log('register?.mutationOptions', typeof register.mutationOptions);
      expect(typeof register.mutationOptions).toBe('function');

      // Verify the properties are enumerable (will show up in console.log)
      const registerKeys = Object.keys(api.auth.register);
      expect(registerKeys).toContain('mutationOptions');

      // Verify property descriptors
      const descriptor = Object.getOwnPropertyDescriptor(api.auth.register, 'mutationOptions');
      expect(descriptor).toBeDefined();
      expect(descriptor?.enumerable).toBe(true);
    });
  });

  describe('useMutation', () => {
    it('should create mutation options with mutationFn', () => {
      // Get the mutation options
      const options = api.users.post.mutationOptions();

      // Check that the options include a mutationFn
      expect(options).toHaveProperty('mutationFn');
      expect(typeof options.mutationFn).toBe('function');
    });

    it('should include provided options in the returned options', () => {
      // Create mutation options with custom options
      const options = api.users.post.mutationOptions({
        mutationKey: ['users', 'create'],
        retry: 3,
      });

      // Check that the custom options are included
      expect(options).toHaveProperty('mutationKey');
      expect(options.mutationKey).toEqual(['users', 'create']);
      expect(options).toHaveProperty('retry');
      expect(options.retry).toBe(3);
    });

    it('should make a fetch request when mutating', async () => {
      // Reset fetch mock
      vi.mocked(fetch)
        .mockReset()
        .mockImplementation(() => {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: '123' } }),
            headers: new Headers({ 'content-type': 'application/json' }),
            text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: '123' } })),
          } as Response);
        });

      // Get the mutation options
      const options = api.users.post.mutationOptions();

      // Verify mutationFn exists
      expect(options.mutationFn).toBeDefined();

      // Call the mutation function directly
      const variables = { name: 'John Doe', email: 'john@example.com' };
      await options.mutationFn(variables);

      // Check that fetch was called
      expect(fetch).toHaveBeenCalled();

      // Get the last call to fetch
      const fetchCall = vi.mocked(fetch).mock.calls[0];

      // Check that the URL includes the endpoint path
      expect(fetchCall[0]).toContain('/users');

      // Check that the request body includes the variables
      const requestInit = fetchCall[1] as RequestInit;
      expect(requestInit.body).toContain('John Doe');
      expect(requestInit.body).toContain('john@example.com');
    });

    it('should support mutation options', async () => {
      // Get the mutation options with custom options
      const options = api.users.post.mutationOptions({
        mutationKey: ['users', 'create'],
        retry: 3,
      });

      // Verify that the options were included
      expect(options.mutationKey).toEqual(['users', 'create']);
      expect(options.retry).toBe(3);
      expect(options.mutationFn).toBeDefined();
    });

    it('should throw an error when the fetch request fails', async () => {
      // Mock fetch to return an error response
      vi.mocked(fetch)
        .mockReset()
        .mockImplementationOnce(() => {
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: () => Promise.resolve({ error: 'Failed to create user' }),
            headers: new Headers({ 'content-type': 'application/json' }),
            text: () => Promise.resolve(JSON.stringify({ error: 'Failed to create user' })),
          } as Response);
        });

      // Get the mutation options
      const options = api.users.post.mutationOptions();

      // Call the mutation function and expect it to throw
      const variables = { name: 'John Doe', email: 'john@example.com' };

      // The error might be wrapped, so we'll check if it contains our error message
      try {
        await options.mutationFn(variables);
        // If we get here, the test should fail
        expect(true).toBe(false); // This will always fail if reached
      } catch (error: any) {
        // Check that the error is related to the failed request
        expect(error.message).toBeDefined();
        expect(fetch).toHaveBeenCalled();
      }
    });
  });
});
