import { UseQueryOptions, QueryKey, QueryFunctionContext } from '@tanstack/react-query';
import { Endpoint } from '@fezi/client';
import type { EndpointResponse, RouterDefinition as FeziRouterDefinition } from '@fezi/client';
import type {
  QueryOptionsConfig,
  RecursiveRouterStructure,
  TanStackQueryEndpoint,
  TanStackQueryRouter,
} from './types';

/**
 * Enhances a Fezi endpoint with TanStack Query integration, adding `queryOptions`
 * and `getKey` methods.
 *
 * @param endpoint The original Fezi endpoint.
 * @param path An array of strings representing the path to this endpoint, used for generating default query keys.
 * @returns An enhanced endpoint compatible with TanStack Query.
 */
export function enhanceEndpointWithQuery<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>,
  path: string[]
): TanStackQueryEndpoint<TInput, TOutput> {
  const enhancedEndpoint = { ...endpoint } as TanStackQueryEndpoint<TInput, TOutput>;

  enhancedEndpoint.queryOptions = function <TQueryKey extends QueryKey = readonly [string, ...unknown[]]>(
    config?: QueryOptionsConfig<TOutput, Error, TQueryKey, TInput>
  ): UseQueryOptions<TOutput, Error, TOutput, TQueryKey> {
    const { input, urlParams, queryKey: customQueryKey, ...rest } = config || {};

    const queryKey = customQueryKey || (path as QueryKey as TQueryKey);

    const queryFn = async (_context: QueryFunctionContext<TQueryKey>): Promise<TOutput> => {
      const feziResponse = await endpoint.execute(input, urlParams);
      if (feziResponse.error) {
        if (feziResponse.error instanceof Error) {
          throw feziResponse.error;
        }
        let message = 'Unknown query error';
        if (typeof feziResponse.error === 'string') {
          message = feziResponse.error;
        } else if (
          feziResponse.error &&
          typeof (feziResponse.error as Record<string, unknown>).message === 'string'
        ) {
          message = (feziResponse.error as Record<string, unknown>).message as string;
        }
        throw new Error(message);
      }
      return feziResponse.data as TOutput;
    };

    return { queryKey, queryFn, ...rest } as UseQueryOptions<TOutput, Error, TOutput, TQueryKey>;
  };

  enhancedEndpoint.getKey = (params?: Record<string, any>): QueryKey => {
    return params && Object.keys(params).length > 0 ? [...path, params] : path;
  };
  return enhancedEndpoint;
}

/**
 * Recursively transforms a Fezi router definition object into a TanStackQueryRouter,
 * enhancing each endpoint with TanStack Query capabilities (`queryOptions` and `getKey`).
 *
 * @template T The type of the Fezi router definition.
 * @param {T} router The Fezi router definition object.
 * @param {string[]} [basePath=[]] Internal parameter for tracking the path during recursion.
 * @returns {TanStackQueryRouter<T>} A new router object where endpoints are enhanced.
 */
export function createTanStackQueryAPI<T extends RecursiveRouterStructure>(
  router: T,
  basePath: string[] = []
): TanStackQueryRouter<T> {
  const api = {} as any;

  for (const key in router) {
    if (Object.prototype.hasOwnProperty.call(router, key)) {
      const entity = router[key];
      const currentPath = [...basePath, key];
      if (entity instanceof Endpoint) {
        api[key] = enhanceEndpointWithQuery(entity, currentPath);
      } else if (typeof entity === 'object' && entity !== null) {
        api[key] = createTanStackQueryAPI(entity as RecursiveRouterStructure, currentPath);
      }
    }
  }
  return api as TanStackQueryRouter<T>;
}
