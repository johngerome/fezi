import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient } from '../client';
import { createClientAPI } from '../router';
import { Schema } from '../schema';

describe('Input Schema Inference', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient({
      url: 'https://api.example.com',
    });

    // Mock fetch to avoid actual network requests
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ id: 1 }),
      text: vi.fn().mockResolvedValue('{"id": 1}'),
    });
  });

  it('should infer input schema types when using client.route().input(schema)', async () => {
    // Define a type for our user input
    type UserInput = {
      name: string;
      email: string;
      age: number;
    };

    // Create a schema for validation
    const userInputSchema: Schema<UserInput> = {
      parse: (data: unknown) => {
        // In a real app, this would validate the data
        // For test purposes, we just cast and return
        return data as UserInput;
      },
    };

    // Create an endpoint with the input schema
    const createUser = client.route({ method: 'POST', path: '/users' }).input(userInputSchema);

    // Create a client API with the endpoint
    const api = createClientAPI({
      users: {
        create: createUser,
      },
    });

    // This should have proper type inference and autocomplete
    const result = await api.users.create({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    });

    // Verify the call was made correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: expect.any(String),
        body: expect.stringContaining('John Doe'),
      })
    );
  });

  it('should support nested objects in schema with proper type inference', async () => {
    // Define a more complex type with nested objects
    type ComplexUserInput = {
      name: string;
      contact: {
        email: string;
        phone?: string;
        address?: {
          street: string;
          city: string;
          zipCode: string;
          country: string;
        };
      };
      preferences: {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
      };
    };

    // Create a schema for validation
    const complexUserInputSchema: Schema<ComplexUserInput> = {
      parse: (data: unknown) => {
        // In a real app, this would validate the data
        return data as ComplexUserInput;
      },
    };

    // Create an endpoint with the input schema
    const updateUserProfile = client
      .route({ method: 'PUT', path: '/users/profile' })
      .input(complexUserInputSchema);

    // Create a client API with the endpoint
    const api = createClientAPI({
      users: {
        updateProfile: updateUserProfile,
      },
    });

    // This should have proper type inference and autocomplete for nested objects
    await api.users.updateProfile({
      name: 'John Doe',
      contact: {
        email: 'john@example.com',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          zipCode: '94105',
          country: 'USA',
        },
      },
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    });

    // Verify the call was made with the complex object
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: expect.any(String),
        body: expect.stringContaining('John Doe'),
      })
    );
  });

  it('should demonstrate client API creation with multiple endpoints', async () => {
    // Define product input type
    type ProductInput = {
      name: string;
      price: number;
      category: 'electronics' | 'clothing' | 'food';
      tags: string[];
    };

    // Create a schema for validation
    const productInputSchema: Schema<ProductInput> = {
      parse: (data: unknown) => {
        // In a real app, this would validate the data
        return data as ProductInput;
      },
    };

    // Create an endpoint with route and input schema
    const createProduct = client
      .route({ method: 'POST', path: '/products' })
      .input(productInputSchema);

    // This should have proper type inference and autocomplete
    await createProduct.execute({
      name: 'Smartphone',
      price: 999.99,
      category: 'electronics',
      tags: ['tech', 'mobile', 'new'],
    });

    // Verify the call was made correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: expect.any(String),
        body: expect.stringContaining('Smartphone'),
      })
    );
  });
});
