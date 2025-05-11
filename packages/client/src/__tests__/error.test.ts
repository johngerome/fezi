import { describe, it, expect, vi } from 'vitest';
import { FeziError } from '../types';

describe('FeziError', () => {
  it('should create an error with the correct properties', () => {
    // Setup
    const message = 'Request failed';
    const url = 'https://api.example.com/users';
    const options = { method: 'GET', timeout: 5000 };

    // Execute
    const error = new FeziError(message, url, options);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FeziError);
    expect(error.message).toBe(message);
    expect(error.name).toBe('FeziError');
    expect(error.url).toBe(url);
    expect(error.options).toBe(options);
  });

  it('should include response properties if provided', () => {
    // Setup
    const message = 'Request failed';
    const url = 'https://api.example.com/users';
    const options = { method: 'GET', timeout: 5000 };
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const response = {
      status: 404,
      headers,
    } as Response;

    // Execute
    const error = new FeziError(message, url, options, response);

    // Assert
    expect(error.status).toBe(404);
    expect(error.headers).toBe(headers);
    expect(error.response).toBe(response);
  });

  it('should include data if provided', () => {
    // Setup
    const message = 'Request failed';
    const url = 'https://api.example.com/users';
    const options = { method: 'GET', timeout: 5000 };
    const data = { error: 'Not found', code: 'RESOURCE_NOT_FOUND' };

    // Execute
    const error = new FeziError(message, url, options, undefined, data);

    // Assert
    expect(error.data).toEqual(data);
  });

  it('should include both response and data if provided', () => {
    // Setup
    const message = 'Request failed';
    const url = 'https://api.example.com/users';
    const options = { method: 'GET', timeout: 5000 };
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const response = {
      status: 400,
      headers,
    } as Response;

    const data = { error: 'Bad request', code: 'INVALID_PARAMETERS' };

    // Execute
    const error = new FeziError(message, url, options, response, data);

    // Assert
    expect(error.status).toBe(400);
    expect(error.headers).toBe(headers);
    expect(error.response).toBe(response);
    expect(error.data).toEqual(data);
  });
});
