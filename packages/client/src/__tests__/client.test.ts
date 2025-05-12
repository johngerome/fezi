import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient, FeziError } from '..';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock response
const mockResponse = (status = 200, data = {}, headers = {}) => {
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

describe('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient({
      url: 'https://api.example.com',
      headers: { 'X-API-Key': 'test-key' },
    });

    // Reset mocks
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create a client with default options', () => {
      const client = new APIClient({ url: 'https://api.example.com' });
      expect(client).toBeInstanceOf(APIClient);
    });

    it('should merge default options with provided options', () => {
      const client = new APIClient({
        url: 'https://api.example.com',
        headers: { 'X-Custom': 'value' },
      });
      expect(client).toBeInstanceOf(APIClient);
    });
  });

  describe('route', () => {
    it('should create a new endpoint with the given configuration', () => {
      const endpoint = client.route({
        path: '/users',
        method: 'GET',
        headers: { 'X-Custom': 'value' },
      });

      expect(endpoint).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should make a successful GET request', async () => {
      const responseData = { id: 1, name: 'Test User' };
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = client.route({
        path: '/users/1',
        method: 'GET',
      });

      const { data, error, status } = await endpoint.execute();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          }),
        })
      );
      expect(data).toEqual(responseData);
      expect(status).toBe(200);
      expect(error).toBeNull();
    });

    it('should make a successful POST request with body', async () => {
      const requestBody = { name: 'New User' };
      const responseData = { id: 1, name: 'New User' };

      mockFetch.mockResolvedValueOnce(
        mockResponse(201, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = client.route({
        path: '/users',
        method: 'POST',
      });

      const { data, error, status } = await endpoint.execute(requestBody);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          }),
          body: JSON.stringify(requestBody),
        })
      );
      expect(data).toEqual(responseData);
      expect(status).toBe(201);
      expect(error).toBeNull();
    });

    it('should handle query parameters correctly', async () => {
      const responseData = [{ id: 1, name: 'Test User' }];
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = client.route({
        path: '/users',
        method: 'GET',
      });

      const params = { page: 1, limit: 10, filter: 'active' };
      await endpoint.execute(undefined, params);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&limit=10&filter=active',
        expect.any(Object)
      );
    });

    it('should handle null and undefined query parameters', async () => {
      const responseData = [{ id: 1, name: 'Test User' }];
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = client.route({
        path: '/users',
        method: 'GET',
      });

      const params = { page: 1, filter: null, sort: undefined };
      await endpoint.execute(undefined, params);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1',
        expect.any(Object)
      );
    });

    it('should handle URL with path prefix correctly', async () => {
      const clientWithPathPrefix = new APIClient({
        url: 'https://api.example.com/v1',
      });

      const responseData = { id: 1, name: 'Test User' };
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = clientWithPathPrefix.route({
        path: '/users/1',
        method: 'GET',
      });

      await endpoint.execute();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users/1',
        expect.any(Object)
      );
    });

    it('should return error payload for HTTP errors when no output schema is defined', async () => {
      const errorData = { error: 'Not found' };
      mockFetch.mockResolvedValueOnce(
        mockResponse(404, errorData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = client.route({
        path: '/users/999',
        method: 'GET',
      });

      const { data, error, status } = await endpoint.execute();

      // Since we're not validating the output, we get the error data directly
      expect(data).toEqual(errorData);
      expect(status).toBe(404);
      expect(error).toBeNull();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const endpoint = client.route({
        path: '/users/1',
        method: 'GET',
      });

      const { data, error, status } = await endpoint.execute();

      expect(data).toBeNull();
      expect(status).toBe(500);
      expect(error).toBeInstanceOf(FeziError);
    });
  });

  describe('headers handling', () => {
    it('should support function headers', async () => {
      const clientWithFunctionHeaders = new APIClient({
        url: 'https://api.example.com',
        headers: () => ({ 'X-Dynamic': 'dynamic-value' }),
      });

      const responseData = { id: 1 };
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = clientWithFunctionHeaders.route({
        path: '/test',
        method: 'GET',
      });

      await endpoint.execute();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Dynamic': 'dynamic-value',
          }),
        })
      );
    });

    it('should merge default and request-specific headers', async () => {
      const responseData = { id: 1 };
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, {
          'content-type': 'application/json',
        })
      );

      const endpoint = client.route({
        path: '/test',
        method: 'GET',
        headers: { 'X-Request-Specific': 'value' },
      });

      await endpoint.execute();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-key',
            'X-Request-Specific': 'value',
          }),
        })
      );
    });

    it('should support promise-based headers at client level', async () => {
      const clientWithPromiseHeaders = new APIClient({
        url: 'https://api.example.com',
        headers: async () => {
          await Promise.resolve(); // Simulate async operation
          return { 'X-Async-Client': 'async-client-value' };
        },
      });

      const responseData = { id: 1 };
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, responseData, { 'content-type': 'application/json' })
      );

      const endpoint = clientWithPromiseHeaders.route({
        path: '/test-async-client',
        method: 'GET',
      });

      await endpoint.execute();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test-async-client',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Async-Client': 'async-client-value',
            'Content-Type': 'application/json', // Default from execute
          }),
        })
      );
    });
  });
});
