import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Endpoint } from '@fezi/client';
import { asTanStackEndpoint, createTanStackAPI } from './adapter';

// Define a minimal APIClient interface for testing
interface MockAPIClient {
  options: Record<string, any>;
  route: () => any;
  execute: () => any;
  buildUrl: () => any;
  getHeaders: () => any;
  getRequestInit: () => any;
}

// Mock Endpoint class and dependencies
vi.mock('@fezi/client', () => {
  const MockAPIClient = vi.fn().mockImplementation(() => ({
    options: {},
    route: vi.fn(),
    execute: vi.fn(),
    buildUrl: vi.fn(),
    getHeaders: vi.fn(),
    getRequestInit: vi.fn(),
  }));

  return {
    Endpoint: class MockEndpoint {
      execute = vi.fn();
      constructor(apiClient: MockAPIClient) {
        // Default mock implementation
        this.execute.mockResolvedValue({ data: 'test-data', error: null });
      }
    },
    APIClient: MockAPIClient,
  };
});

// Create mock API client
const mockApiClient = {
  options: {},
  route: vi.fn(),
  execute: vi.fn(),
  buildUrl: vi.fn(),
  getHeaders: vi.fn(),
  getRequestInit: vi.fn(),
};

describe('asTanStackEndpoint', () => {
  let endpoint: Endpoint<any, any>;
  let enhancedEndpoint: ReturnType<typeof asTanStackEndpoint>;

  beforeEach(() => {
    endpoint = new Endpoint(mockApiClient as any);
    enhancedEndpoint = asTanStackEndpoint(endpoint, ['users', 'getAll']);
  });

  it('should enhance an endpoint with queryOptions, mutationOptions, and getKey methods', () => {
    expect(enhancedEndpoint.queryOptions).toBeDefined();
    expect(enhancedEndpoint.mutationOptions).toBeDefined();
    expect(enhancedEndpoint.getKey).toBeDefined();
    expect(typeof enhancedEndpoint.queryOptions).toBe('function');
    expect(typeof enhancedEndpoint.mutationOptions).toBe('function');
    expect(typeof enhancedEndpoint.getKey).toBe('function');
  });

  it('should generate correct query key using getKey method with sorted params', () => {
    const keyWithoutParams = enhancedEndpoint.getKey();
    expect(keyWithoutParams).toEqual(['users', 'getAll']);

    const keyWithParams = enhancedEndpoint.getKey({ id: 123, name: 'test' });
    const expectedParams = { id: 123, name: 'test' };
    expect(keyWithParams).toEqual(['users', 'getAll', expectedParams]);

    // Test sorting - order of properties shouldn't matter
    const keyWithDifferentOrder = enhancedEndpoint.getKey({ name: 'test', id: 123 });
    expect(keyWithDifferentOrder).toEqual(['users', 'getAll', expectedParams]);
  });

  it('should return queryOptions with correct structure', () => {
    // @ts-ignore - Vue types don't match runtime objects
    const options = enhancedEndpoint.queryOptions();

    // @ts-ignore - Accessing properties directly for testing
    expect(options.queryKey).toEqual(['users', 'getAll']);
    // @ts-ignore
    expect(options.queryFn).toBeDefined();
    // @ts-ignore
    expect(typeof options.queryFn).toBe('function');
  });

  it('should throw an error when endpoint.execute returns an error', async () => {
    // @ts-ignore - Vue types don't match runtime objects
    endpoint.execute.mockResolvedValue({ data: null, error: { message: 'Test error' } });

    // @ts-ignore - Vue types don't match runtime objects
    const options = enhancedEndpoint.queryOptions();

    // @ts-ignore - Accessing properties directly for testing
    await expect(options.queryFn()).rejects.toThrow();
  });

  it('should return mutationOptions with correct structure', () => {
    // @ts-ignore - Vue types don't match runtime objects
    const options = enhancedEndpoint.mutationOptions();

    // @ts-ignore - Accessing properties directly for testing
    expect(options.mutationFn).toBeDefined();
    // @ts-ignore
    expect(typeof options.mutationFn).toBe('function');
  });

  it('should pass URL params and input to endpoint.execute in query function', async () => {
    // @ts-ignore - Vue types don't match runtime objects
    const options = enhancedEndpoint.queryOptions({
      input: { filter: 'active' },
      urlParams: { page: '1' },
    });

    // @ts-ignore - Accessing properties directly for testing
    await options.queryFn();

    expect(endpoint.execute).toHaveBeenCalledWith({ filter: 'active' }, { page: '1' });
  });

  it('should pass variables and URL params to endpoint.execute in mutation function', async () => {
    const variables = { name: 'New User' };
    // @ts-ignore - Vue types don't match runtime objects
    const options = enhancedEndpoint.mutationOptions({
      urlParams: { department: 'engineering' },
    });

    // @ts-ignore - Accessing properties directly for testing
    await options.mutationFn(variables);

    expect(endpoint.execute).toHaveBeenCalledWith(variables, { department: 'engineering' });
  });
});

describe('createTanStackAPI', () => {
  it('should transform a router object into a TanStackRouter with both query and mutation capabilities', () => {
    const mockEndpoint = new Endpoint(mockApiClient as any);
    const router = {
      users: {
        getAll: mockEndpoint,
        getById: mockEndpoint,
        create: mockEndpoint,
        update: mockEndpoint,
      },
      posts: {
        recent: {
          get: mockEndpoint,
        },
      },
    };

    // Store reference to original endpoint
    const originalEndpoint = router.users.getAll;

    const api = createTanStackAPI(router);

    // Check structure for query capabilities
    expect(api.users.getAll.queryOptions).toBeDefined();
    expect(api.users.getById.queryOptions).toBeDefined();
    expect(api.posts.recent.get.queryOptions).toBeDefined();

    // Check structure for mutation capabilities
    expect(api.users.create.mutationOptions).toBeDefined();
    expect(api.users.update.mutationOptions).toBeDefined();

    // Check keys
    expect(api.users.getAll.getKey()).toEqual(['users', 'getAll']);
    expect(api.posts.recent.get.getKey()).toEqual(['posts', 'recent', 'get']);

    // Verify original endpoint hasn't been modified
    expect(originalEndpoint).not.toHaveProperty('queryOptions');
    expect(originalEndpoint).not.toHaveProperty('mutationOptions');
    expect(originalEndpoint).not.toHaveProperty('getKey');

    // Verify original router hasn't been modified
    expect(router.users.getAll).toBe(originalEndpoint);
  });

  it('should handle nested non-Endpoint objects correctly', () => {
    const mockEndpoint = new Endpoint(mockApiClient as any);
    const router = {
      users: {
        getAll: mockEndpoint,
        meta: {
          counts: {
            active: mockEndpoint,
            total: mockEndpoint,
          },
        },
      },
    };

    const api = createTanStackAPI(router);

    expect(api.users.getAll.queryOptions).toBeDefined();
    expect(api.users.meta.counts.active.queryOptions).toBeDefined();
    expect(api.users.meta.counts.total.queryOptions).toBeDefined();

    // Check nested keys
    expect(api.users.meta.counts.active.getKey()).toEqual(['users', 'meta', 'counts', 'active']);
  });

  it('should handle empty objects', () => {
    const api = createTanStackAPI({});
    expect(api).toEqual({});
  });
});
