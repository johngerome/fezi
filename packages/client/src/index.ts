// Export from types.ts
export { FeziError } from './types';
export type { FeziOptions, FeziResponse, EndpointResponse } from './types';

// Export from client.ts
export { APIClient } from './client';
export type { APIClientOptions } from './client';

// Export from endpoint.ts
export { Endpoint } from './endpoint';
export type { RequestConfig } from './endpoint';

// Export from router.ts
export { createClientAPI } from './router';
export type { RouterDefinition, ClientAPI } from './router';

// Export from schema.ts
export { validateWithSchema, createZodSchema } from './schema';
export type { Schema, ZodLike, InferZod } from './schema';
