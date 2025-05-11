import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient } from '../client';
import { createClientAPI } from '../router';
import { Schema } from '../schema';

describe('Client Input Schema Autocomplete', () => {
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

  it('should provide autocomplete for input schema when using createClientAPI', async () => {
    // Define a schema for user creation
    type CreateUserInput = {
      username: string;
      email: string;
      password: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      settings: {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        language: string;
      };
    };

    // Create a schema that validates CreateUserInput
    const createUserSchema: Schema<CreateUserInput> = {
      parse: (data: unknown) => {
        // In a real app, this would validate the data
        return data as CreateUserInput;
      },
    };

    // Create an endpoint with the input schema
    const createUser = client.route({ method: 'POST', path: '/users' }).input(createUserSchema);

    // Create a client API with the endpoint
    const api = createClientAPI({
      users: {
        create: createUser,
      },
    });

    // When using api.users.create(), TypeScript should provide autocomplete
    // for all properties defined in CreateUserInput type
    await api.users.create({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'securepassword',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        // avatar is optional
      },
      settings: {
        theme: 'dark', // autocomplete should show 'light', 'dark', 'system'
        notifications: true,
        language: 'en-US',
      },
    });

    // Verify the call was made with the correct data
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('johndoe'),
      })
    );
  });

  it('should demonstrate nested API structure with schema inference', async () => {
    // Define schemas for different API endpoints
    type CreatePostInput = {
      title: string;
      content: string;
      tags: string[];
      status: 'draft' | 'published';
    };

    type UpdatePostInput = {
      id: number;
      title?: string;
      content?: string;
      tags?: string[];
      status?: 'draft' | 'published';
    };

    // Create schemas
    const createPostSchema: Schema<CreatePostInput> = {
      parse: (data: unknown) => data as CreatePostInput,
    };

    const updatePostSchema: Schema<UpdatePostInput> = {
      parse: (data: unknown) => data as UpdatePostInput,
    };

    // Create endpoints with input schemas
    const createPost = client.route({ method: 'POST', path: '/posts' }).input(createPostSchema);

    const updatePost = client.route({ method: 'PUT', path: '/posts/{id}' }).input(updatePostSchema);

    // Create a nested API structure
    const api = createClientAPI({
      blog: {
        posts: {
          create: createPost,
          update: updatePost,
        },
      },
    });

    // When using api.blog.posts.create(), TypeScript should provide autocomplete
    // for all properties defined in CreatePostInput
    await api.blog.posts.create({
      title: 'Getting Started with TypeScript',
      content: 'TypeScript is a typed superset of JavaScript...',
      tags: ['typescript', 'javascript', 'programming'],
      status: 'published', // autocomplete should show 'draft' or 'published'
    });

    // When using api.blog.posts.update(), TypeScript should provide autocomplete
    // for all properties defined in UpdatePostInput
    await api.blog.posts.update({
      id: 123,
      title: 'Updated Title',
      // Other fields are optional
      status: 'draft', // autocomplete should show 'draft' or 'published'
    });

    // Verify the calls were made correctly
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should support multiple input schemas in a complex API structure', async () => {
    // Define multiple schemas for a more complex API
    type UserCredentials = {
      email: string;
      password: string;
    };

    type UserProfile = {
      userId: number;
      displayName: string;
      bio?: string;
      socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
    };

    type CommentInput = {
      postId: number;
      content: string;
      replyTo?: number;
    };

    // Create schemas
    const loginSchema: Schema<UserCredentials> = {
      parse: (data: unknown) => data as UserCredentials,
    };

    const updateProfileSchema: Schema<UserProfile> = {
      parse: (data: unknown) => data as UserProfile,
    };

    const commentSchema: Schema<CommentInput> = {
      parse: (data: unknown) => data as CommentInput,
    };

    // Create endpoints with input schemas
    const login = client.route({ method: 'POST', path: '/auth/login' }).input(loginSchema);

    const updateProfile = client
      .route({ method: 'PUT', path: '/users/{userId}/profile' })
      .input(updateProfileSchema);

    const addComment = client
      .route({ method: 'POST', path: '/posts/{postId}/comments' })
      .input(commentSchema);

    // Create a complex API structure
    const api = createClientAPI({
      auth: {
        login,
      },
      users: {
        updateProfile,
      },
      comments: {
        add: addComment,
      },
    });

    // Each endpoint should have proper type inference and autocomplete
    await api.auth.login({
      email: 'user@example.com',
      password: 'password123',
    });

    await api.users.updateProfile({
      userId: 42,
      displayName: 'JohnDoe',
      bio: 'TypeScript enthusiast',
      socialLinks: {
        github: 'github.com/johndoe',
        twitter: 'twitter.com/johndoe',
      },
    });

    await api.comments.add({
      postId: 123,
      content: 'Great article!',
      replyTo: 456, // Optional
    });

    // Verify all calls were made
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
