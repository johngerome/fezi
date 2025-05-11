import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient } from '../client';
import { Endpoint } from '../endpoint';

// Mock the APIClient's execute method
vi.mock('../client', () => {
  return {
    APIClient: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Test' }, status: 200 }),
    })),
  };
});

describe('Endpoint', () => {
  let client: APIClient;
  let endpoint: Endpoint;

  beforeEach(() => {
    client = new APIClient({ url: 'https://api.example.com' });
    endpoint = new Endpoint(client);
  });

  describe('configuration methods', () => {
    it('should set path correctly', () => {
      const result = endpoint.path('/users');
      expect(result).toBe(endpoint); // Should return this for chaining
    });

    it('should set method correctly', () => {
      const result = endpoint.method('POST');
      expect(result).toBe(endpoint); // Should return this for chaining
    });

    it('should set headers correctly', () => {
      const result = endpoint.headers({ 'X-Custom': 'value' });
      expect(result).toBe(endpoint); // Should return this for chaining
    });

    it('should set timeout correctly', () => {
      const result = endpoint.timeout(5000);
      expect(result).toBe(endpoint); // Should return this for chaining
    });

    it('should allow method chaining', () => {
      const result = endpoint
        .path('/users')
        .method('POST')
        .headers({ 'X-Custom': 'value' })
        .timeout(5000);

      expect(result).toBe(endpoint);
    });
  });

  describe('schema validation', () => {
    it('should set input schema correctly', () => {
      const schema = {
        parse: vi.fn().mockImplementation((data) => data),
      };

      const result = endpoint.input(schema);
      expect(result).toBe(endpoint); // Should return this for chaining
    });

    it('should set output schema correctly', () => {
      const schema = {
        parse: vi.fn().mockImplementation((data) => data),
      };

      const result = endpoint.output(schema);
      expect(result).toBe(endpoint); // Should return this for chaining
    });
  });

  describe('execute', () => {
    it('should call client.execute with the correct parameters', async () => {
      // Setup
      const mockExecute = vi.fn().mockResolvedValue({ data: { id: 1 }, status: 200 });
      client.execute = mockExecute;

      endpoint.path('/users').method('POST').headers({ 'X-Custom': 'value' });

      const input = { name: 'Test User' };
      const params = { filter: 'active' };

      // Execute
      const result = await endpoint.execute(input, params);

      // Assert
      expect(result).toEqual({
        data: { id: 1 },
        error: null,
        status: 200,
      });
      expect(mockExecute).toHaveBeenCalledWith({
        path: '/users',
        method: 'POST',
        headers: { 'X-Custom': 'value' },
        body: input,
        params,
      });
    });

    it('should validate input data if input schema is provided', async () => {
      // Setup
      const mockExecute = vi.fn().mockResolvedValue({ data: { id: 1 }, status: 200 });
      client.execute = mockExecute;

      const mockParse = vi.fn().mockImplementation((data) => ({ ...data, validated: true }));
      const inputSchema = { parse: mockParse };

      endpoint.path('/users').method('POST').input(inputSchema);

      const input = { name: 'Test User' };

      // Execute
      const result = await endpoint.execute(input);

      // Assert
      expect(result).toEqual({
        data: { id: 1 },
        error: null,
        status: 200,
      });
      expect(mockParse).toHaveBeenCalledWith(input);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { ...input, validated: true },
        })
      );
    });

    it('should validate output data if output schema is provided', async () => {
      // Setup
      const responseData = { id: 1, name: 'Test User' };
      const mockExecute = vi.fn().mockResolvedValue({ data: responseData, status: 200 });
      client.execute = mockExecute;

      const mockParse = vi.fn().mockImplementation((data) => ({ ...data, validated: true }));
      const outputSchema = { parse: mockParse };

      endpoint.path('/users').method('GET').output(outputSchema);

      // Execute
      const result = await endpoint.execute();

      // Assert
      expect(mockParse).toHaveBeenCalledWith(responseData);
      expect(result).toEqual({
        data: { ...responseData, validated: true },
        error: null,
        status: 200,
      });
    });

    it('should return raw data if no output schema is provided', async () => {
      // Setup
      const responseData = { id: 1, name: 'Test User' };
      const mockExecute = vi.fn().mockResolvedValue({ data: responseData, status: 200 });
      client.execute = mockExecute;

      endpoint.path('/users').method('GET');

      // Execute
      const result = await endpoint.execute();

      // Assert
      expect(result).toEqual({
        data: responseData,
        error: null,
        status: 200,
      });
    });

    it('should handle undefined input correctly', async () => {
      // Setup
      const mockExecute = vi.fn().mockResolvedValue({ data: { id: 1 }, status: 200 });
      client.execute = mockExecute;

      endpoint.path('/users').method('GET');

      // Execute
      const result = await endpoint.execute();

      // Assert
      expect(result).toEqual({
        data: { id: 1 },
        error: null,
        status: 200,
      });
      expect(mockExecute).toHaveBeenCalledWith({
        path: '/users',
        method: 'GET',
        body: undefined,
        params: undefined,
      });
    });

    it('should handle errors correctly', async () => {
      // Setup
      const mockError = new Error('Network error');
      const mockExecute = vi.fn().mockRejectedValue(mockError);
      client.execute = mockExecute;

      endpoint.path('/users').method('GET');

      // Execute
      const result = await endpoint.execute();

      // Assert
      expect(result.data).toBeNull();
      expect(result.status).toBe(500);
      expect(result.error).toBeDefined();
      expect(result.error).not.toBeNull();

      if (result.error) {
        expect(result.error.name).toBe('FeziError');
        expect(result.error.message).toBe('Network error');
      }
    });
  });
});
