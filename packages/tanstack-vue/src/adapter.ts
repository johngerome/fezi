import { type QueryKey, type UseQueryOptions, type UseMutationOptions } from '@tanstack/vue-query';
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
export function asTanStackEndpoint<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>,
  path: string[]
): TanStackEndpoint<TInput, TOutput> {
  const tanStackEndpoint = { ...endpoint } as TanStackEndpoint<TInput, TOutput>;

  tanStackEndpoint.queryOptions = function <TQueryKey extends QueryKey = QueryKey>(
    config?: QueryOptionsConfig<TOutput, Error, TQueryKey, TInput>
  ): UseQueryOptions<TOutput, Error, TOutput, TQueryKey> {
    const { input, urlParams, queryKey: customQueryKey, ...restOfConfig } = config || {};
    const finalQueryKey = customQueryKey ?? ([...path] as unknown as TQueryKey);

    return {
      ...restOfConfig,
      queryKey: finalQueryKey,
      queryFn: async (): Promise<TOutput> => {
        const result = await endpoint.execute(input, urlParams);
        if (result.error) throw toError(result.error);
        return result.data as TOutput;
      },
    };
  };

  tanStackEndpoint.mutationOptions = function <TContext = unknown>(
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

  tanStackEndpoint.getKey = (params?: Record<string, any>): QueryKey => {
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
    return [...path];
  };

  return tanStackEndpoint;
}

/**
 * Creates a TanStack Query API from a Fezi router definition.
 * This function enhances each endpoint in the router with both query and mutation capabilities.
 * The input router must conform to the RecursiveRouterStructure type.
 *
 * @example
 * // Correct usage:
 * // import { APIClient } from '@fezi/client';
 * // const client = new APIClient({ baseUrl: '...' });
 * // const feziRoutes = {
 * //   users: {
 * //     get: client.route({ method: 'GET', path: '/users' }),
 * //     post: client.route({ method: 'POST', path: '/users' })
 * //   }
 * // };
 * // const api = createTanStackAPI(feziRoutes);
 *
 * @param router The Fezi router definition (must be a RecursiveRouterStructure).
 * @param basePath Internal parameter for recursive calls, users should not set this.
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
        result[iterKey] = asTanStackEndpoint(item, currentPath);
      } else if (typeof item === 'object' && item !== null && !(item instanceof Endpoint)) {
        if (Object.getPrototypeOf(item) === Object.prototype || Array.isArray(item)) {
          result[iterKey] = createTanStackAPI(item as RecursiveRouterStructure, currentPath);
        } else {
          result[iterKey] = item;
        }
      } else {
        result[iterKey] = item;
      }
    }
  }
  return result as TanStackRouter<T>;
}
