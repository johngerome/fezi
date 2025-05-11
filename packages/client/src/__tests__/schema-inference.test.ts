import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient } from '../client';
import { createClientAPI } from '../router';
import { Schema } from '../schema';

// This test file focuses on demonstrating and testing the type inference
// capabilities of the zimfetch library, particularly how input schemas
// are properly inferred in the API client

describe('Schema Type Inference', () => {
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

  it('should properly infer input schema types in the API client', async () => {
    // Define a type for our user input
    type UserInput = {
      name: string;
      email: string;
      age: number;
    };

    // Create a schema that validates UserInput
    const userInputSchema: Schema<UserInput> = {
      parse: (data: unknown) => {
        // In a real app, this would do actual validation
        // For test purposes, we just cast and return
        return data as UserInput;
      },
    };

    // Create an endpoint with the input schema
    const createUser = client.route({ method: 'POST', path: '/users' }).input(userInputSchema);

    // Create a router with the endpoint
    const router = {
      users: {
        create: createUser,
      },
    };

    // Create the API client from the router
    const api = createClientAPI(router);

    // This is where type inference happens
    // TypeScript should infer that the input to api.users.create
    // must match the UserInput type
    const result = await api.users.create({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });

    // Verify the call was made correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        }),
      })
    );

    // The following would cause a TypeScript error if uncommented
    // because it doesn't match the UserInput type
    /*
    await api.users.create({
      name: 'John Doe',
      // missing email field
      age: '30' // wrong type, should be number
    });
    */
  });

  it('should properly infer nested router endpoint schema types', async () => {
    // Define types for our API
    type CreateUserInput = { name: string; email: string };
    type UpdateUserInput = { id: number; name?: string; email?: string };
    type UserOutput = { id: number; name: string; email: string; createdAt: string };

    // Create schemas
    const createUserSchema: Schema<CreateUserInput> = {
      parse: (data: unknown) => data as CreateUserInput,
    };

    const updateUserSchema: Schema<UpdateUserInput> = {
      parse: (data: unknown) => data as UpdateUserInput,
    };

    const userOutputSchema: Schema<UserOutput> = {
      parse: (data: unknown) => data as UserOutput,
    };

    // Create endpoints with schemas
    const createUser = client
      .route({ method: 'POST', path: '/users' })
      .input(createUserSchema)
      .output(userOutputSchema);

    const updateUser = client
      .route({ method: 'PUT', path: '/users/{id}' })
      .input(updateUserSchema)
      .output(userOutputSchema);

    const getUser = client.route({ method: 'GET', path: '/users/{id}' }).output(userOutputSchema);

    // Create a nested router
    const router = {
      api: {
        v1: {
          users: {
            create: createUser,
            update: updateUser,
            get: getUser,
          },
        },
      },
    };

    // Create the API client
    const api = createClientAPI(router);

    // Type inference for create (requires name and email)
    await api.api.v1.users.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    // Type inference for update (requires id, optional name and email)
    await api.api.v1.users.update({
      id: 1,
      name: 'John Updated',
    });

    // Type inference for get (no input required)
    await api.api.v1.users.get();

    // Verify the calls were made correctly
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should demonstrate autocomplete capabilities with complex schemas', async () => {
    // Define a more complex type with nested objects
    type ComplexUserInput = {
      profile: {
        firstName: string;
        lastName: string;
        displayName?: string;
      };
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
        language: string;
      };
    };

    // Create a schema for the complex type
    const complexUserSchema: Schema<ComplexUserInput> = {
      parse: (data: unknown) => data as ComplexUserInput,
    };

    // Create an endpoint with the complex schema
    const updateUserProfile = client
      .route({ method: 'PUT', path: '/users/profile' })
      .input(complexUserSchema);

    // Create a router with the endpoint
    const router = {
      users: {
        updateProfile: updateUserProfile,
      },
    };

    // Create the API client
    const api = createClientAPI(router);

    // Use the API with the complex type
    // This demonstrates how autocomplete would work with nested objects
    await api.users.updateProfile({
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'JohnD',
      },
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
        language: 'en-US',
      },
    });

    // Verify the call was made with the complex object
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users/profile',
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(String),
      })
    );

    // The following would cause TypeScript errors if uncommented
    /*
    await api.users.updateProfile({
      profile: {
        firstName: 'John',
        // missing lastName
      },
      contact: {
        email: 'john@example.com'
      },
      preferences: {
        theme: 'invalid-theme', // not in union type
        notifications: true,
        language: 'en-US'
      }
    });
    */
  });
});
