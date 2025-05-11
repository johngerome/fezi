import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient } from '../client';
import { createClientAPI } from '../router';
import { Schema } from '../schema';

describe('Output Schema Inference', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient({
      url: 'https://api.example.com',
    });

    // Mock fetch to avoid actual network requests
    global.fetch = vi.fn();
  });

  it('should infer output schema types when using client.route().output(schema)', async () => {
    // Define a type for our user output
    type UserOutput = {
      id: number;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };

    // Create a schema for validation
    const userOutputSchema: Schema<UserOutput> = {
      parse: (data: unknown) => {
        // In a real app, this would validate the data
        // For test purposes, we just cast and return
        return data as UserOutput;
      },
    };

    // Mock response data that matches our schema
    const mockResponseData: UserOutput = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2025-05-10T05:40:07Z',
      updatedAt: '2025-05-10T05:40:07Z',
    };

    // Setup mock fetch to return our data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockResponseData),
      text: vi.fn().mockResolvedValue(JSON.stringify(mockResponseData)),
    });

    // Create an endpoint with the output schema
    const getUser = client.route({ method: 'GET', path: '/users/{id}' }).output(userOutputSchema);

    // Create a client API with the endpoint
    const api = createClientAPI({
      users: {
        get: getUser,
      },
    });

    // When we call api.users.get(), the response should be typed as UserOutput
    const { data: user, error, status } = await api.users.get();

    // TypeScript should know that user has the UserOutput type
    // We can access properties with autocomplete
    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(user?.id).toBe(1);
    expect(user?.name).toBe('John Doe');
    expect(user?.email).toBe('john@example.com');
    expect(user?.createdAt).toBe('2025-05-10T05:40:07Z');
    expect(user?.updatedAt).toBe('2025-05-10T05:40:07Z');

    // Verify the call was made correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users/{id}',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should support both input and output schema inference', async () => {
    // Define types for our API
    type CreateUserInput = {
      name: string;
      email: string;
      password: string;
    };

    type UserOutput = {
      id: number;
      name: string;
      email: string;
      createdAt: string;
    };

    // Create schemas
    const createUserSchema: Schema<CreateUserInput> = {
      parse: (data: unknown) => data as CreateUserInput,
    };

    const userOutputSchema: Schema<UserOutput> = {
      parse: (data: unknown) => data as UserOutput,
    };

    // Mock response data
    const mockResponseData: UserOutput = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2025-05-10T05:40:07Z',
    };

    // Setup mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockResponseData),
      text: vi.fn().mockResolvedValue(JSON.stringify(mockResponseData)),
    });

    // Create an endpoint with both input and output schemas
    const createUser = client
      .route({ method: 'POST', path: '/users' })
      .input(createUserSchema)
      .output(userOutputSchema);

    // Create a client API
    const api = createClientAPI({
      users: {
        create: createUser,
      },
    });

    // When we call api.users.create():
    // 1. The input parameter should be typed as CreateUserInput
    // 2. The return value should be typed as UserOutput
    const {
      data: newUser,
      error,
      status,
    } = await api.users.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securepassword',
    });

    // TypeScript should know that newUser has the UserOutput type
    expect(status).toBe(201);
    expect(error).toBeNull();
    expect(newUser?.id).toBe(1);
    expect(newUser?.name).toBe('John Doe');
    expect(newUser?.email).toBe('john@example.com');
    expect(newUser?.createdAt).toBe('2025-05-10T05:40:07Z');
    // TypeScript should know that password is not in the output type
    // If uncommented, this would cause a TypeScript error:
    // expect(newUser.password).toBe('securepassword');

    // Verify the call was made correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('securepassword'),
      })
    );
  });

  it('should support complex nested output types', async () => {
    // Define a complex output type with nested objects and arrays
    type PostAuthor = {
      id: number;
      name: string;
      avatarUrl: string;
    };

    type PostComment = {
      id: number;
      author: {
        id: number;
        name: string;
      };
      content: string;
      createdAt: string;
    };

    type PostOutput = {
      id: number;
      title: string;
      content: string;
      author: PostAuthor;
      tags: string[];
      comments: PostComment[];
      stats: {
        views: number;
        likes: number;
        shares: number;
      };
      createdAt: string;
      updatedAt: string;
    };

    // Create a schema for validation
    const postOutputSchema: Schema<PostOutput> = {
      parse: (data: unknown) => data as PostOutput,
    };

    // Mock response data
    const mockResponseData: PostOutput = {
      id: 123,
      title: 'Understanding TypeScript',
      content: 'TypeScript is a typed superset of JavaScript...',
      author: {
        id: 1,
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      tags: ['typescript', 'javascript', 'programming'],
      comments: [
        {
          id: 1,
          author: {
            id: 2,
            name: 'Jane Smith',
          },
          content: 'Great article!',
          createdAt: '2025-05-09T10:30:00Z',
        },
        {
          id: 2,
          author: {
            id: 3,
            name: 'Bob Johnson',
          },
          content: 'Very helpful, thanks!',
          createdAt: '2025-05-09T11:45:00Z',
        },
      ],
      stats: {
        views: 1250,
        likes: 42,
        shares: 15,
      },
      createdAt: '2025-05-08T15:00:00Z',
      updatedAt: '2025-05-09T09:30:00Z',
    };

    // Setup mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockResponseData),
      text: vi.fn().mockResolvedValue(JSON.stringify(mockResponseData)),
    });

    // Create an endpoint with the output schema
    const getPost = client.route({ method: 'GET', path: '/posts/{id}' }).output(postOutputSchema);

    // Create a client API
    const api = createClientAPI({
      posts: {
        get: getPost,
      },
    });

    // When we call api.posts.get(), the response should be typed    // Execute the request
    const { data: post, error, status } = await api.posts.get();

    // TypeScript should know the structure of the complex object
    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(post?.id).toBe(123);
    expect(post?.title).toBe('Understanding TypeScript');
    expect(post?.author.name).toBe('John Doe');
    expect(post?.tags).toContain('typescript');
    expect(post?.comments[0].author.name).toBe('Jane Smith');
    expect(post?.stats.likes).toBe(42);

    // Verify the call was made correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/posts/{id}',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should demonstrate practical API client usage with full type inference', async () => {
    // Define our API types
    type LoginInput = {
      email: string;
      password: string;
    };

    type LoginOutput = {
      token: string;
      user: {
        id: number;
        email: string;
        name: string;
        role: 'admin' | 'user';
      };
    };

    type GetUserOutput = {
      id: number;
      email: string;
      name: string;
      role: 'admin' | 'user';
      profile: {
        bio?: string;
        location?: string;
        website?: string;
        socialLinks?: {
          twitter?: string;
          github?: string;
          linkedin?: string;
        };
      };
      settings: {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        language: string;
      };
      createdAt: string;
    };

    // Create schemas
    const loginInputSchema: Schema<LoginInput> = {
      parse: (data: unknown) => data as LoginInput,
    };

    const loginOutputSchema: Schema<LoginOutput> = {
      parse: (data: unknown) => data as LoginOutput,
    };

    const getUserOutputSchema: Schema<GetUserOutput> = {
      parse: (data: unknown) => data as GetUserOutput,
    };

    // Mock responses
    const loginMockResponse: LoginOutput = {
      token: 'jwt-token-123',
      user: {
        id: 1,
        email: 'john@example.com',
        name: 'John Doe',
        role: 'admin',
      },
    };

    const userMockResponse: GetUserOutput = {
      id: 1,
      email: 'john@example.com',
      name: 'John Doe',
      role: 'admin',
      profile: {
        bio: 'TypeScript enthusiast',
        location: 'San Francisco, CA',
        website: 'https://johndoe.com',
        socialLinks: {
          twitter: 'https://twitter.com/johndoe',
          github: 'https://github.com/johndoe',
        },
      },
      settings: {
        theme: 'dark',
        notifications: true,
        language: 'en-US',
      },
      createdAt: '2025-01-01T00:00:00Z',
    };

    // Create endpoints
    const login = client
      .route({ method: 'POST', path: '/auth/login' })
      .input(loginInputSchema)
      .output(loginOutputSchema);

    const getUser = client
      .route({ method: 'GET', path: '/users/{id}' })
      .output(getUserOutputSchema);

    // Create API client
    const api = createClientAPI({
      auth: {
        login,
      },
      users: {
        get: getUser,
      },
    });

    // First API call - login
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(loginMockResponse),
      text: vi.fn().mockResolvedValue(JSON.stringify(loginMockResponse)),
    });

    const {
      data: loginResult,
      error: loginError,
      status: loginStatus,
    } = await api.auth.login({
      email: 'john@example.com',
      password: 'securepassword',
    });

    // TypeScript should know the structure of loginResult
    expect(loginStatus).toBe(200);
    expect(loginError).toBeNull();
    expect(loginResult?.token).toBe('jwt-token-123');
    expect(loginResult?.user.role).toBe('admin');

    // Second API call - get user
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(userMockResponse),
      text: vi.fn().mockResolvedValue(JSON.stringify(userMockResponse)),
    });

    const { data: user, error: userError, status: userStatus } = await api.users.get();

    // TypeScript should know the structure of user
    expect(userStatus).toBe(200);
    expect(userError).toBeNull();
    expect(user?.name).toBe('John Doe');
    expect(user?.profile.bio).toBe('TypeScript enthusiast');
    expect(user?.settings.theme).toBe('dark');

    // The following would cause TypeScript errors if uncommented
    // If uncommented, this would cause a TypeScript error:
    // expect(user.password).toBe('securepassword');
  });
});
