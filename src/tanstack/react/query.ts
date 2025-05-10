import { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { EndpointResponse } from '../../lib/types';
import { Endpoint } from '../../lib/client';
import { RouterDefinition } from '../../lib/router';
import { QueryOptionsConfig, TanStackAPI } from './types';

/**
 * Enhances an endpoint with TanStack Query capabilities
 *
 * @param endpoint The zimfetch endpoint to enhance
 * @returns The enhanced endpoint with TanStack Query methods
 */
export function enhanceEndpointWithQuery<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>,
  path: string[]
): Endpoint<TInput, TOutput> & {
  queryOptions: <TQueryKey extends QueryKey = [string]>(
    config?: QueryOptionsConfig<TOutput, unknown, TQueryKey>
  ) => UseQueryOptions<EndpointResponse<TOutput>, unknown, TOutput, TQueryKey>;
} {
  // Create a new object that extends the original endpoint
  const enhancedEndpoint = Object.create(endpoint);

  // Define the queryOptions method
  enhancedEndpoint.queryOptions = function <TQueryKey extends QueryKey = [string]>(
    config?: QueryOptionsConfig<TOutput, unknown, TQueryKey>
  ): UseQueryOptions<TOutput, unknown, TOutput, TQueryKey> {
    // Default query key is the endpoint path
    const defaultQueryKey = [...path] as unknown as TQueryKey;

    // Create query options
    return {
      ...config,
      queryKey: config?.queryKey || defaultQueryKey,
      queryFn: async () => {
        const result = await endpoint.execute(undefined, config?.params);

        // Handle errors
        if (result.error) {
          throw result.error;
        }

        return result.data as TOutput;
      },
    };
  };

  return enhancedEndpoint;
}

/**
 * Creates a TanStack Query API from a zimfetch router
 *
 * @param router The zimfetch router to enhance
 * @returns A router with TanStack Query capabilities
 */
export function createTanStackQueryAPI<T extends RouterDefinition>(
  router: T,
  path: string[] = []
): TanStackAPI<T> {
  const api = {} as TanStackAPI<T>;

  for (const key in router) {
    const value = router[key];
    const currentPath = [...path, key];

    if (value instanceof Endpoint) {
      // Enhance endpoint with TanStack Query capabilities
      api[key as keyof T] = enhanceEndpointWithQuery(value, currentPath) as any;
    } else if (typeof value === 'object') {
      // Recursively enhance nested router
      api[key as keyof T] = createTanStackQueryAPI(value as RouterDefinition, currentPath) as any;
    }
  }

  return api;
}
