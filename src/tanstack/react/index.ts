/**
 * TanStack Query (React Query) integration for zimfetch
 *
 * This module provides utilities to convert zimfetch endpoints into
 * TanStack Query hooks for React applications.
 */

import { QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { Endpoint } from '../../lib/client';
import { RouterDefinition } from '../../lib/router';
import { EndpointResponse } from '../../lib/types';

/**
 * Options for creating a query with TanStack Query
 */
export interface QueryOptionsConfig<
  TData = unknown,
  TError = unknown,
  TQueryKey extends QueryKey = QueryKey,
> extends Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> {
  /**
   * Query parameters to be passed to the endpoint
   */
  params?: Record<string, string | number | boolean | null | undefined>;

  /**
   * Custom query key to use instead of the default
   */
  queryKey?: TQueryKey;
}

/**
 * Type for an enhanced endpoint with TanStack Query capabilities
 */
export type EnhancedEndpoint<TInput, TOutput> = Endpoint<TInput, TOutput> & {
  queryOptions: <TQueryKey extends QueryKey = [string]>(
    config?: QueryOptionsConfig<TOutput, unknown, TQueryKey>
  ) => UseQueryOptions<TOutput, unknown, TOutput, TQueryKey>;
  mutationOptions: <TContext = unknown>(
    options?: Omit<UseMutationOptions<TOutput, Error, TInput, TContext>, 'mutationFn'>
  ) => UseMutationOptions<TOutput, Error, TInput, TContext>;
};

/**
 * Type for a router with TanStack Query capabilities
 */
export type TanStackRouter<T extends RouterDefinition> = {
  [K in keyof T]: T[K] extends Endpoint<infer TInput, infer TOutput>
    ? EnhancedEndpoint<TInput, TOutput>
    : T[K] extends RouterDefinition
      ? TanStackRouter<T[K]>
      : T[K];
};

/**
 * Creates a TanStack Query API from a zimfetch router
 *
 * This function enhances each endpoint in the router with both
 * query and mutation capabilities for TanStack Query.
 *
 * @example
 * ```typescript
 * // Create a zimfetch router
 * const router = {
 *   users: {
 *     get: client.route({ method: 'GET', path: '/users' }),
 *     post: client.route({ method: 'POST', path: '/users' })
 *   }
 * };
 *
 * // Create a TanStack Query API
 * const api = createTanStackAPI(router);
 *
 * // Use in a React component
 * function UsersList() {
 *   // For queries (GET)
 *   const query = useQuery(api.users.get.queryOptions());
 *
 *   // For mutations (POST, PUT, DELETE)
 *   const mutation = useMutation(api.users.post.mutationOptions());
 *
 *   // Use the query and mutation as needed
 * }
 * ```
 *
 * @param router The zimfetch router to enhance
 * @returns A router with TanStack Query capabilities
 */

/**
 * Helper function to enhance an endpoint with TanStack Query capabilities
 *
 * @param endpoint The endpoint to enhance
 * @param key The key of the endpoint in the router
 * @returns The enhanced endpoint
 */
function enhanceEndpoint<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>,
  key: string
): EnhancedEndpoint<TInput, TOutput> {
  // Create a direct copy with all properties
  const enhanced = { ...endpoint } as Endpoint<TInput, TOutput> &
    Partial<EnhancedEndpoint<TInput, TOutput>>;

  // Define the queryOptions method using Object.defineProperty to ensure it's properly attached
  Object.defineProperty(enhanced, 'queryOptions', {
    enumerable: true,
    configurable: true,
    writable: true,
    value: function <TQueryKey extends QueryKey = [string]>(
      config?: QueryOptionsConfig<TOutput, unknown, TQueryKey>
    ) {
      return {
        ...config,
        queryKey: config?.queryKey || [key],
        queryFn: async () => {
          const result = await endpoint.execute(undefined, config?.params);
          if (result.error) {
            throw result.error;
          }
          return result.data as TOutput;
        },
      } as UseQueryOptions<TOutput, unknown, TOutput, TQueryKey>;
    },
  });

  // Define the mutationOptions method using Object.defineProperty to ensure it's properly attached
  Object.defineProperty(enhanced, 'mutationOptions', {
    enumerable: true,
    configurable: true,
    writable: true,
    value: function <TContext = unknown>(
      options?: Omit<UseMutationOptions<TOutput, Error, TInput, TContext>, 'mutationFn'>
    ) {
      return {
        ...options,
        mutationFn: async (variables: TInput) => {
          const result = await endpoint.execute(variables);
          if (result.error) {
            throw result.error;
          }
          return result.data as TOutput;
        },
      } as UseMutationOptions<TOutput, Error, TInput, TContext>;
    },
  });

  // Add debug log
  console.log('Enhanced endpoint created:', {
    hasQueryOptions: typeof enhanced.queryOptions === 'function',
    hasMutationOptions: typeof enhanced.mutationOptions === 'function',
    methods: Object.keys(enhanced),
  });

  return enhanced as EnhancedEndpoint<TInput, TOutput>;
}

export function createTanStackAPI<T extends RouterDefinition>(router: T): TanStackRouter<T> {
  // Create a new object to hold our enhanced API
  const api = {} as Record<string, any>;

  // Process each key in the router
  for (const key in router) {
    const value = router[key];

    if (value instanceof Endpoint) {
      // Create a direct enhanced copy with explicit methods
      const enhanced = enhanceEndpoint(value, key);

      // Verify the methods are properly attached
      if (typeof enhanced.queryOptions !== 'function') {
        console.warn(`Failed to attach queryOptions to ${key}`);
      }

      if (typeof enhanced.mutationOptions !== 'function') {
        console.warn(`Failed to attach mutationOptions to ${key}`);
      }

      // Assign the enhanced endpoint to the API
      api[key] = enhanced;

      // Debug log in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`Enhanced endpoint ${key}:`, {
          hasQueryOptions: typeof api[key].queryOptions === 'function',
          hasMutationOptions: typeof api[key].mutationOptions === 'function',
          methods: Object.keys(api[key]),
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively enhance nested router
      api[key] = createTanStackAPI(value as RouterDefinition);
    } else {
      // Copy other properties as-is
      api[key] = value;
    }
  }

  // For nested routers, ensure methods are non-enumerable so they don't get lost in serialization
  // This is a defensive measure to ensure methods are preserved
  const makeMethodsNonEnumerable = (obj: Record<string, unknown>) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        const value = obj[key] as unknown;
        if (value && typeof value === 'object') {
          // Check if it's an endpoint-like object
          const endpointLike = value as {
            execute?: Function;
            mutationOptions?: Function;
            queryOptions?: Function;
          };

          if (value instanceof Endpoint || typeof endpointLike.execute === 'function') {
            // This is an endpoint, ensure its methods are properly defined
            if (typeof endpointLike.mutationOptions === 'function') {
              Object.defineProperty(endpointLike, 'mutationOptions', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: endpointLike.mutationOptions,
              });
            }
            if (typeof endpointLike.queryOptions === 'function') {
              Object.defineProperty(endpointLike, 'queryOptions', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: endpointLike.queryOptions,
              });
            }
          }
          // Recursively process nested objects
          makeMethodsNonEnumerable(value as Record<string, unknown>);
        }
      }
    }
  };

  // Apply the defensive measure to the entire API
  makeMethodsNonEnumerable(api);

  return api as TanStackRouter<T>;
}
