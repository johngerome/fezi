/**
 * TanStack Query (React Query) integration for fezi
 *
 * This module provides utilities to convert fezi endpoints into
 * TanStack Query hooks for React applications.
 */

import './query';
import './mutation';

import { QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { Endpoint } from '@fezi/client';

import { toError } from './utils';

import type {
  QueryOptionsConfig,
  MutationOptionsConfig,
  TanStackEndpoint,
  RecursiveRouterStructure,
  TanStackRouter,
} from './types';

/**
 * Enhances a Fezi endpoint with TanStack Query capabilities, including methods for
 * `queryOptions`, `mutationOptions`, and `getKey`.
 *
 * @param endpoint The original Fezi endpoint.
 * @param path An array of strings representing the path to this endpoint, used for generating default query keys.
 * @returns An enhanced endpoint (`TanStackEndpoint`) compatible with TanStack Query.
 */
function enhanceEndpoint<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>,
  path: string[]
): TanStackEndpoint<TInput, TOutput> {
  const enhancedEndpoint = { ...endpoint } as TanStackEndpoint<TInput, TOutput>;

  enhancedEndpoint.queryOptions = function <
    TQueryKey extends QueryKey = readonly [string, ...unknown[]],
  >(
    config?: QueryOptionsConfig<TOutput, Error, TQueryKey, TInput>
  ): UseQueryOptions<TOutput, Error, TOutput, TQueryKey> {
    const { input, urlParams, queryKey: customQueryKey, ...restOfConfig } = config || {};
    return {
      ...restOfConfig,
      queryKey: customQueryKey ?? (path as QueryKey as TQueryKey),
      queryFn: async (): Promise<TOutput> => {
        const result = await endpoint.execute(input, urlParams);
        if (result.error) throw toError(result.error);
        return result.data as TOutput;
      },
    };
  };

  enhancedEndpoint.mutationOptions = function <TContext = unknown>(
    config?: MutationOptionsConfig<TOutput, Error, TInput, TContext>
  ): UseMutationOptions<TOutput, Error, TInput, TContext> {
    const { urlParams, ...tanstackMutationOptions } = config || {};
    return {
      ...tanstackMutationOptions,
      mutationFn: async (variables: TInput): Promise<TOutput> => {
        const result = await endpoint.execute(variables, urlParams);
        if (result.error) throw toError(result.error);
        return result.data as TOutput;
      },
    };
  };

  enhancedEndpoint.getKey = (params?: Record<string, any>): QueryKey => {
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .reduce(
          (acc, paramKey) => {
            acc[paramKey] = params[paramKey];
            return acc;
          },
          {} as Record<string, any>
        );
      return [...path, sortedParams];
    }
    return path;
  };

  return enhancedEndpoint;
}

/**
 * Creates a TanStack Query API from a Fezi router definition.
 * This function enhances each endpoint in the router with both query and mutation capabilities.
 * The input router must conform to the RecursiveRouterStructure type.
 *
 * @example
 * // Create a fezi router
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
 *
 * @param router The Fezi router definition (must be a RecursiveRouterStructure).
 * @returns A TanStackRouter with enhanced endpoints.
 */
export function createTanStackAPI<T extends RecursiveRouterStructure>(
  router: T,
  basePath: string[] = []
): TanStackRouter<T> {
  const result = {} as any;

  for (const iterKey in router) {
    if (Object.prototype.hasOwnProperty.call(router, iterKey)) {
      const item = router[iterKey];
      const currentPath = [...basePath, iterKey];

      if (item instanceof Endpoint) {
        result[iterKey] = enhanceEndpoint(item, currentPath);
      } else if (typeof item === 'object' && item !== null) {
        result[iterKey] = createTanStackAPI(item as RecursiveRouterStructure, currentPath);
      }
    }
  }
  return result as TanStackRouter<T>;
}

export * from './query';
export * from './mutation';
export * from './types';
