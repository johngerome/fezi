/**
 * Basic usage examples for zimfetch
 *
 * This file demonstrates various ways to use the zimfetch library
 * including APIClient and type-safe router APIs.
 */
import { z } from 'zod';
import { APIClient, createClientAPI } from '../src';

// ===== PART 1: Basic APIClient usage =====

// Basic GET request
async function basicGet() {
  const client = new APIClient({
    url: 'https://jsonplaceholder.typicode.com',
  });

  const { data, error, status } = await client.execute({
    path: '/posts/1',
  });

  if (error) {
    console.error('Error in basic GET:', error);
    return;
  }

  console.log('Basic GET response:', data);
  console.log('Status code:', status);
}

// POST request with JSON body
async function postWithJson() {
  const client = new APIClient({
    url: 'https://jsonplaceholder.typicode.com',
  });

  const { data, error, status } = await client.execute({
    path: '/posts',
    method: 'POST',
    body: {
      title: 'foo',
      body: 'bar',
      userId: 1,
    },
  });

  if (error) {
    console.error('Error in POST:', error);
    return;
  }

  console.log('POST response:', data);
  console.log('Status code:', status);
}

// Request with custom headers
async function requestWithHeaders() {
  const client = new APIClient({
    url: 'https://jsonplaceholder.typicode.com',
  });

  const { data, error, status } = await client.execute({
    path: '/posts/1',
    headers: {
      'X-Custom-Header': 'custom-value',
      Authorization: 'Bearer token123',
    },
  });

  if (error) {
    console.error('Error in request with headers:', error);
    return;
  }

  console.log('Response with custom headers:', data);
  console.log('Status code:', status);
}

// Request with timeout
async function requestWithTimeout() {
  const client = new APIClient({
    url: 'https://jsonplaceholder.typicode.com',
  });

  const { data, error, status } = await client.execute({
    path: '/posts/1',
    timeout: 3000, // 3 seconds
  });

  if (error) {
    console.error('Error in request with timeout:', error);
    return;
  }

  console.log('Response with timeout:', data);
  console.log('Status code:', status);
}

// ===== PART 2: APIClient usage =====

// Simple schema validation example (using plain objects for simplicity)
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

async function apiClientExample() {
  console.log('\n===== APIClient Example =====');

  // Create a client instance
  const client = new APIClient({
    url: 'https://jsonplaceholder.typicode.com',
    headers: {
      'X-API-Key': 'demo-key',
    },
    timeout: 5000,
  });

  const getUserEndpoint = client.route({ method: 'GET', path: '/users/1' }).output(userSchema);

  const { data, error, status } = await getUserEndpoint.execute();

  if (error) {
    console.error('Error in APIClient example:', error);
    return;
  }

  console.log('User from validated endpoint:', data);
  console.log('Status code:', status);
}

// ===== PART 3: Router API usage =====

async function routerExample() {
  console.log('\n===== Router API Example =====');

  // Define input schema for creating posts
  const createPostSchema = z.object({
    title: z.string(),
    body: z.string(),
    userId: z.number(),
  });

  // Define output schema for post responses
  const postResponseSchema = z.object({
    id: z.number(),
    title: z.string(),
    body: z.string(),
    userId: z.number(),
  });

  // Create a client instance
  const client = new APIClient({
    url: 'https://jsonplaceholder.typicode.com',
    timeout: 5000,
  });

  // Define endpoints
  const getUser = client.route({ method: 'GET', path: '/users/1' }).output(userSchema);

  const createPost = client
    .route({
      method: 'POST',
      path: '/posts',
    })
    .input(createPostSchema)
    .output(postResponseSchema);

  // Create a router
  const router = {
    users: {
      get: getUser,
    },
    posts: {
      create: createPost,
    },
  };

  // Create a type-safe API client
  const api = createClientAPI(router);

  const { data: user, error: userError, status: userStatus } = await api.users.get();

  if (userError) {
    console.error('Error in router example:', userError);
    return;
  }

  console.log('User from router API:', user);
  console.log('Status code:', userStatus);

  // The newPost variable will have its type inferred from the postResponseSchema
  // TypeScript knows it has id, title, body, and userId properties
  const response = await api.posts.create({
    title: 'foo',
    body: 'bar',
    userId: 1,
  });

  const { data: newPost, error: postError, status: postStatus } = response;

  // We can access the properties directly because TypeScript knows the type
  console.log('New post from router API:', {
    id: newPost?.id, // TypeScript knows this is a number
    title: newPost?.title, // TypeScript knows this is a string
    body: newPost?.body, // TypeScript knows this is a string
    userId: newPost?.userId, // TypeScript knows this is a number
  });

  if (postError) {
    console.error('Error in router example:', postError);
    return;
  }

  console.log('New post from router API:', {
    id: newPost?.id, // TypeScript knows this is a number
    title: newPost?.title, // TypeScript knows this is a string
    body: newPost?.body, // TypeScript knows this is a string
    userId: newPost?.userId, // TypeScript knows this is a number
  });
  console.log('Status code:', postStatus);
}

// Run all examples
async function runExamples() {
  console.log('Running zimfetch examples...\n');

  // Part 1: Basic fetch wrapper
  console.log('===== Basic Fetch Wrapper Examples =====');
  await basicGet();
  console.log('\n---\n');

  await postWithJson();
  console.log('\n---\n');

  await requestWithHeaders();
  console.log('\n---\n');

  await requestWithTimeout();

  // Part 2: APIClient
  await apiClientExample();

  // Part 3: Router API
  await routerExample();

  console.log('\n===== All examples completed =====');
}

// Run all examples
runExamples().catch(console.error);
