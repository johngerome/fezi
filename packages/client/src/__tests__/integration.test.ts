import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient } from '../client';
import { createClientAPI } from '../router';
import { Endpoint } from '../endpoint';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock response
const mockResponse = (
  status = 200,
  data = {},
  headers = { 'content-type': 'application/json' }
) => {
  const headersObj = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headersObj.append(key, value as string);
  });

  return {
    status,
    ok: status >= 200 && status < 300,
    headers: headersObj,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  };
};

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete API flow', () => {
    it('should create and use a complete API client with router', async () => {
      // Setup mock responses
      const getUserResponse = { id: 1, name: 'John Doe', email: 'john@example.com' };
      const createUserResponse = { id: 2, name: 'Jane Smith', email: 'jane@example.com' };
      const updateUserResponse = { id: 1, name: 'John Updated', email: 'john@example.com' };

      // Setup fetch mock to return different responses based on URL and method
      mockFetch.mockImplementation((url, options) => {
        if (url.includes('/users/1') && options.method === 'GET') {
          return Promise.resolve(mockResponse(200, getUserResponse));
        } else if (url.includes('/users') && options.method === 'POST') {
          return Promise.resolve(mockResponse(201, createUserResponse));
        } else if (url.includes('/users/1') && options.method === 'PUT') {
          return Promise.resolve(mockResponse(200, updateUserResponse));
        }
        return Promise.resolve(mockResponse(404, { error: 'Not found' }));
      });

      // Create API client
      const client = new APIClient({
        url: 'https://api.example.com/v1',
        headers: { 'X-API-Key': 'test-key' },
      });

      // Create endpoints
      const getUser = client.route({ method: 'GET', path: '/users/{id}' }).path('/users/1');

      const createUser = client.route({ method: 'POST', path: '/users' });

      const updateUser = client.route({ method: 'PUT', path: '/users/{id}' }).path('/users/1');

      // Create router
      const router = {
        users: {
          get: getUser,
          create: createUser,
          update: updateUser,
        },
      };

      // Create API from router
      const api = createClientAPI(router);

      // Test get user
      const { data: user, error: userError, status: userStatus } = await api.users.get();
      expect(user).toEqual(getUserResponse);
      expect(userStatus).toBe(200);
      expect(userError).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users/1',
        expect.objectContaining({ method: 'GET' })
      );

      // Test create user
      const {
        data: newUser,
        error: createError,
        status: createStatus,
      } = await api.users.create({ name: 'Jane Smith', email: 'jane@example.com' });
      expect(newUser).toEqual(createUserResponse);
      expect(createStatus).toBe(201);
      expect(createError).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Jane Smith', email: 'jane@example.com' }),
        })
      );

      // Test update user
      const {
        data: updatedUser,
        error: updateError,
        status: updateStatus,
      } = await api.users.update({ name: 'John Updated' });
      expect(updatedUser).toEqual(updateUserResponse);
      expect(updateStatus).toBe(200);
      expect(updateError).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'John Updated' }),
        })
      );
    });
  });

  describe('Schema validation', () => {
    it('should validate input and output with schemas', async () => {
      // Setup mock response
      const responseData = { id: 1, name: 'John Doe', email: 'john@example.com' };
      mockFetch.mockResolvedValue(mockResponse(200, responseData));

      // Create a mock schema
      const inputSchema = {
        parse: vi.fn().mockImplementation((data) => {
          // Simple validation - ensure name is present
          if (!data.name) {
            throw new Error('Name is required');
          }
          return data;
        }),
      };

      const outputSchema = {
        parse: vi.fn().mockImplementation((data) => {
          // Add a computed property
          return {
            ...data,
            displayName: `${data.name} <${data.email}>`,
          };
        }),
      };

      // Create client and endpoint
      const client = new APIClient({ url: 'https://api.example.com' });
      const createUser = client
        .route({ method: 'POST', path: '/users' })
        .input(inputSchema)
        .output(outputSchema);

      // Execute with valid input
      const {
        data: result,
        error,
        status,
      } = await createUser.execute({ name: 'John Doe', email: 'john@example.com' });

      // Verify schema validation was called
      expect(inputSchema.parse).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(outputSchema.parse).toHaveBeenCalledWith(responseData);

      // Verify result includes the computed property from output schema
      expect(result).toEqual({
        ...responseData,
        displayName: 'John Doe <john@example.com>',
      });
      expect(status).toBe(200);
      expect(error).toBeNull();

      // Test with invalid input
      try {
        inputSchema.parse.mockImplementationOnce(() => {
          throw new Error('Name is required');
        });

        await createUser.execute({ email: 'invalid@example.com' });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Name is required');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle API errors correctly', async () => {
      // Setup mock error response
      const errorData = { error: 'Not found', code: 'RESOURCE_NOT_FOUND' };
      mockFetch.mockResolvedValue(mockResponse(404, errorData));

      // Create client and endpoint
      const client = new APIClient({ url: 'https://api.example.com' });
      const getUser = client.route({ method: 'GET', path: '/users/999' });

      // Execute - this should not throw since we don't have output validation
      const { data, error, status } = await getUser.execute();

      // Verify we get the error data
      expect(data).toEqual(errorData);
      expect(status).toBe(404);
      expect(error).toBeNull(); // Since we're handling the error as data

      // Now add an output schema that will throw on error
      const outputSchema = {
        parse: vi.fn().mockImplementation((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          return data;
        }),
      };

      const getUserWithSchema = client
        .route({ method: 'GET', path: '/users/999' })
        .output(outputSchema);

      // Execute with schema validation
      const {
        data: schemaData,
        error: schemaError,
        status: schemaStatus,
      } = await getUserWithSchema.execute();

      // With our new structure, we should get the error in the response
      expect(schemaData).toBeNull();
      expect(schemaStatus).toBe(500); // Our implementation returns 500 for all errors
      expect(schemaError).toBeTruthy();
      expect(schemaError!.message).toBe('Not found');
    });

    it('should handle network errors correctly', async () => {
      // Setup mock network error
      const fetchError = new Error('Network error');
      mockFetch.mockRejectedValue(fetchError);

      // Create client and endpoint
      const client = new APIClient({ url: 'https://api.example.com' });
      const getUser = client.route({ method: 'GET', path: '/users/1' });

      // Execute
      const {
        data: networkData,
        error: networkError,
        status: networkStatus,
      } = await getUser.execute();

      // With our new structure, we should get the error in the response
      expect(networkData).toBeNull();
      expect(networkStatus).toBe(500);
      expect(networkError).toHaveProperty('message', 'Network error');
      expect(networkError).toHaveProperty('url', 'https://api.example.com/users/1');
    });
  });
});
