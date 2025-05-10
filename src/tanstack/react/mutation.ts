import { UseMutationOptions } from '@tanstack/react-query';
import { EndpointResponse } from '../../lib/types';
import { Endpoint } from '../../lib/client';
import { RouterDefinition } from '../../lib/router';
import { MutationOptionsConfig, TanStackAPI } from './types';

/**
 * Enhances an endpoint with TanStack Mutation capabilities
 *
 * @param endpoint The zimfetch endpoint to enhance
 * @returns The enhanced endpoint with TanStack Mutation methods
 */
export function enhanceEndpointWithMutation<TInput, TOutput>(
  endpoint: Endpoint<TInput, TOutput>
): Endpoint<TInput, TOutput> & {
  mutationOptions: <TContext = unknown>(
    options?: Omit<UseMutationOptions<TOutput, Error, TInput, TContext>, 'mutationFn'>
  ) => UseMutationOptions<TOutput, Error, TInput, TContext>;
} {
  // Create a direct copy with all properties
  const enhancedEndpoint = { ...endpoint } as Endpoint<TInput, TOutput> & {
    mutationOptions: <TContext = unknown>(
      options?: Omit<UseMutationOptions<TOutput, Error, TInput, TContext>, 'mutationFn'>
    ) => UseMutationOptions<TOutput, Error, TInput, TContext>;
  };

  // Define the mutationOptions method using Object.defineProperty to ensure it's properly attached
  Object.defineProperty(enhancedEndpoint, 'mutationOptions', {
    enumerable: true,
    configurable: true,
    writable: true,
    value: function <TContext = unknown>(
      options?: Omit<UseMutationOptions<TOutput, Error, TInput, TContext>, 'mutationFn'>
    ) {
      // Create the mutation function
      const mutationFn = async (variables: TInput) => {
        const result = await endpoint.execute(variables);

        // Handle errors
        if (result.error) {
          throw result.error;
        }

        return result.data as TOutput;
      };

      // Return the complete mutation options with our mutation function
      return {
        ...options,
        mutationFn,
      } as UseMutationOptions<TOutput, Error, TInput, TContext>;
    },
  });

  return enhancedEndpoint;
}

/**
 * Creates a TanStack Mutation API from a zimfetch router
 *
 * @param router The zimfetch router to enhance
 * @returns A router with TanStack Mutation capabilities
 */
export function createTanStackMutationAPI<T extends RouterDefinition>(router: T): TanStackAPI<T> {
  const api = {} as TanStackAPI<T>;

  for (const key in router) {
    const value = router[key];

    if (value instanceof Endpoint) {
      // Enhance endpoint with TanStack Mutation capabilities
      const enhanced = enhanceEndpointWithMutation(value);

      // Verify the method is properly attached
      if (typeof enhanced.mutationOptions !== 'function') {
        console.warn(`Failed to attach mutationOptions to ${key}`);
      }

      // Assign the enhanced endpoint to the API
      api[key as keyof T] = enhanced as unknown as TanStackAPI<T>[keyof T];

      // Debug log
      console.debug(`Enhanced endpoint ${key}:`, {
        hasMutationOptions: typeof enhanced.mutationOptions === 'function',
        methods: Object.keys(enhanced),
      });
    } else if (typeof value === 'object') {
      // Recursively enhance nested router
      api[key as keyof T] = createTanStackMutationAPI(value as RouterDefinition) as any;
    }
  }

  // For nested routers, ensure methods are preserved
  const ensureMethodsArePreserved = (obj: Record<string, unknown>) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        const value = obj[key] as unknown;
        if (value && typeof value === 'object') {
          // Check if it's an endpoint-like object
          const endpointLike = value as { execute?: Function; mutationOptions?: Function };

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
          }
          // Recursively process nested objects
          ensureMethodsArePreserved(value as Record<string, unknown>);
        }
      }
    }
  };

  // Apply the defensive measure to the entire API
  ensureMethodsArePreserved(api);

  return api;
}
