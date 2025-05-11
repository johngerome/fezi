import { Endpoint } from './endpoint';
import { EndpointResponse } from './types';

/**
 * Type for router structure
 */
export type RouterDefinition = {
  [key: string]: Endpoint<any, any> | RouterDefinition;
};

/**
 * Type for the client API generated from a router
 */
export type ClientAPI<T extends RouterDefinition> = {
  [K in keyof T]: T[K] extends Endpoint<infer I, infer O>
    ? (
        input?: I,
        params?: Record<string, string | number | boolean | null | undefined>
      ) => Promise<EndpointResponse<O>>
    : T[K] extends RouterDefinition
      ? ClientAPI<T[K]>
      : never;
};

/**
 * Create a client API from a router definition
 *
 * @example
 * ```typescript
 * const router = {
 *   users: {
 *     create: createUserEndpoint,
 *     getById: getUserEndpoint
 *   },
 *   posts: {
 *     list: listPostsEndpoint
 *   }
 * };
 *
 * const api = createClientAPI(router);
 *
 * // Now you can use it like:
 * await api.users.create({ name: 'John' });
 * await api.posts.list();
 * ```
 */
export function createClientAPI<T extends RouterDefinition>(router: T): ClientAPI<T> {
  const api = {} as ClientAPI<T>;

  for (const key in router) {
    const value = router[key];

    if (value instanceof Endpoint) {
      // Create a function that calls the endpoint's execute method
      api[key as keyof T] = ((input?: any, params?: any) => {
        return value.execute(input, params);
      }) as any;
    } else if (typeof value === 'object') {
      // Recursively create nested API
      api[key as keyof T] = createClientAPI(value as RouterDefinition) as any;
    }
  }

  return api;
}
