import type { UseMutationOptions, MutationFunction } from '@tanstack/react-query';
import { Endpoint } from '@fezi/client';
import type { EndpointResponse, RouterDefinition as FeziRouterDefinition } from '@fezi/client';
import type {
  MutationOptionsConfig,
  RecursiveRouterStructure,
  TanStackMutationEndpoint,
  TanStackMutationRouter,
} from './types';

/**
 * Enhances a Fezi endpoint with TanStack Mutation integration, adding `mutationOptions`.
 *
 * @template TInput The type of the input variables for the mutation.
 * @template TOutput The type of the data returned by the mutation.
 * @param endpoint The Fezi endpoint to enhance.
 * @param path The path segments identifying this endpoint, primarily for context or potential future use (e.g. logging).
 * @returns An object containing `mutationOptions` for use with `useMutation`.
 */
export function enhanceEndpointWithMutation<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>,
  path: string[]
): TanStackMutationEndpoint<TInput, TOutput> {
  const enhancedEndpoint = { ...endpoint } as TanStackMutationEndpoint<TInput, TOutput>;

  enhancedEndpoint.mutationOptions = <TContext = unknown>(
    config?: MutationOptionsConfig<TOutput, Error, TInput, TContext>
  ): UseMutationOptions<TOutput, Error, TInput, TContext> => {
    const { urlParams, ...tanstackMutationOptions } = config || {};

    const mutationFn: MutationFunction<TOutput, TInput> = async (variables) => {
      const feziResponse = await endpoint.execute(variables, urlParams);
      if (feziResponse.error) {
        if (feziResponse.error instanceof Error) {
          throw feziResponse.error;
        }
        let message = 'Unknown mutation error';
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

    return {
      ...tanstackMutationOptions,
      mutationFn,
    };
  };
  return enhancedEndpoint;
}

/**
 * Recursively transforms a Fezi router definition object into a TanStackMutationRouter,
 * enhancing each endpoint with TanStack Mutation capabilities (`mutationOptions`).
 *
 * @template T The type of the Fezi router definition, constrained to RecursiveRouterStructure.
 * @param router The Fezi router definition object.
 * @param basePath Internal parameter for tracking the path during recursion.
 * @returns A new router object where endpoints are enhanced for mutations.
 */
export function createTanStackMutationAPI<T extends RecursiveRouterStructure>(
  router: T,
  basePath: string[] = []
): TanStackMutationRouter<T> {
  const api = {} as any;

  for (const key in router) {
    if (Object.prototype.hasOwnProperty.call(router, key)) {
      const entity = router[key];
      const currentPath = [...basePath, key];
      if (entity instanceof Endpoint) {
        api[key] = enhanceEndpointWithMutation(entity, currentPath);
      } else if (typeof entity === 'object' && entity !== null) {
        api[key] = createTanStackMutationAPI(entity as RecursiveRouterStructure, currentPath);
      }
    }
  }
  return api as TanStackMutationRouter<T>;
}
