import type { QueryKey, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import type { Endpoint, RouterDefinition as FeziRouterDefinition } from '@fezi/client';

/**
 * Configuration options for `queryOptions` method in an enhanced endpoint.
 */
export interface QueryOptionsConfig<
  TQueryFnData = unknown, // Type of data returned by queryFn
  TError = Error,
  TQueryKey extends QueryKey = QueryKey,
  TInput = void, // Type of input data or parameters for the query
> extends Omit<
    UseQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey>,
    'queryKey' | 'queryFn'
  > {
  /**
   * Optional input data for the query, if the endpoint method supports a body (e.g., POST-like queries).
   * For GET requests, this is typically undefined.
   */
  input?: TInput;

  /**
   * Parameters for URL path substitution or query string parameters.
   */
  urlParams?: Record<string, string | number | boolean | null | undefined>;

  /**
   * Optional custom query key. If not provided, a default key based on the endpoint path/key is used.
   */
  queryKey?: TQueryKey;
}

/**
 * Configuration options for `mutationOptions` method in an enhanced endpoint.
 */
export interface MutationOptionsConfig<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /**
   * Parameters for URL path substitution or query string parameters for the mutation endpoint.
   */
  urlParams?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Enhanced endpoint with TanStack Query integration
 */
export interface TanStackEndpoint<TInput, TOutput> extends Endpoint<TInput, TOutput> {
  /**
   * Get query options for this endpoint
   */
  queryOptions: <TQueryKey extends QueryKey = [string]>(
    config?: QueryOptionsConfig<TOutput, Error, TQueryKey, TInput>
  ) => UseQueryOptions<TOutput, Error, TOutput, TQueryKey>;

  /**
   * Get mutation options for this endpoint
   * @param options TanStack Query mutation options (except mutationFn which is provided automatically)
   * @returns Complete mutation options that can be passed directly to useMutation
   */
  mutationOptions: <TContext = unknown>(
    config?: MutationOptionsConfig<TOutput, Error, TInput, TContext>
  ) => UseMutationOptions<TOutput, Error, TInput, TContext>;

  getKey: (params?: Record<string, any>) => QueryKey;
}

/**
 * Enhanced endpoint with TanStack Query integration, specifically for query operations.
 */
export interface TanStackQueryEndpoint<TInput, TOutput> extends Endpoint<TInput, TOutput> {
  queryOptions: <TQueryKey extends QueryKey = [string]>(
    config?: QueryOptionsConfig<TOutput, Error, TQueryKey, TInput>
  ) => UseQueryOptions<TOutput, Error, TOutput, TQueryKey>;
  getKey: (params?: Record<string, any>) => QueryKey;
}

/**
 * Enhanced endpoint with TanStack Query integration, specifically for mutation operations.
 */
export interface TanStackMutationEndpoint<TInput, TOutput> extends Endpoint<TInput, TOutput> {
  mutationOptions: <TContext = unknown>(
    config?: MutationOptionsConfig<TOutput, Error, TInput, TContext>
  ) => UseMutationOptions<TOutput, Error, TInput, TContext>;
}

/**
 * Defines a recursive structure for router definitions, where each key maps to
 * either an Endpoint or another nested RecursiveRouterStructure.
 * This is used as the base for transforming router definitions with TanStack Query capabilities.
 */
export type RecursiveRouterStructure = {
  [key: string]: Endpoint<any, any> | RecursiveRouterStructure;
};

export type TanStackRouter<T extends RecursiveRouterStructure> = {
  [K in keyof T]: T[K] extends Endpoint<infer I, infer O>
    ? TanStackEndpoint<I, O>
    : T[K] extends RecursiveRouterStructure
      ? TanStackRouter<T[K]>
      : never;
};

/**
 * A router where each endpoint is enhanced for TanStack Query (query operations only).
 */
export type TanStackQueryRouter<T extends RecursiveRouterStructure> = {
  [K in keyof T]: T[K] extends Endpoint<infer I, infer O>
    ? TanStackQueryEndpoint<I, O>
    : T[K] extends RecursiveRouterStructure
      ? TanStackQueryRouter<T[K]>
      : never;
};

/**
 * A router where each endpoint is enhanced for TanStack Mutation (mutation operations only).
 */
export type TanStackMutationRouter<T extends RecursiveRouterStructure> = {
  [K in keyof T]: T[K] extends Endpoint<infer I, infer O>
    ? TanStackMutationEndpoint<I, O>
    : T[K] extends RecursiveRouterStructure
      ? TanStackMutationRouter<T[K]>
      : never;
};

// Utility type to extract the input type of an endpoint
export type InferEndpointInput<E> =
  E extends TanStackEndpoint<infer I, any>
    ? I
    : E extends TanStackQueryEndpoint<infer IQ, any>
      ? IQ
      : E extends TanStackMutationEndpoint<infer IM, any>
        ? IM
        : never;

// Utility type to extract the output type of an endpoint
export type InferEndpointOutput<E> =
  E extends TanStackEndpoint<any, infer O>
    ? O
    : E extends TanStackQueryEndpoint<any, infer OQ>
      ? OQ
      : E extends TanStackMutationEndpoint<any, infer OM>
        ? OM
        : never;
