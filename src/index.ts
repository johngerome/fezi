// Export from types.ts
export { ZimFetchOptions, ZimFetchResponse, ZimFetchError, EndpointResponse } from './lib/types';

// Export from client.ts
export {
  APIClient,
  APIClientOptions,
  Endpoint,
  RequestConfig,
  createClientAPI,
} from './lib/client';
export type { RouterDefinition, ClientAPI } from './lib/router';

// Export from schema.ts
export { Schema, validateWithSchema, createZodSchema } from './lib/schema';
export type { ZodLike, InferZod } from './lib/schema';

// Export TanStack Query (React) integration
export * as tanstackReact from './tanstack/react';
