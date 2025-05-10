import { QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { EndpointResponse } from '../../lib/types';
import { Endpoint } from '../../lib/client';
import { RouterDefinition } from '../../lib/router';

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
 * Options for creating a mutation with TanStack Query
 */
export interface MutationOptionsConfig<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {}

/**
 * Enhanced endpoint with TanStack Query integration
 */
export interface TanStackEndpoint<TInput, TOutput> extends Endpoint<TInput, TOutput> {
  /**
   * Get query options for this endpoint
   */
  queryOptions: <TQueryKey extends QueryKey = [string]>(
    config?: QueryOptionsConfig<TOutput, unknown, TQueryKey>
  ) => UseQueryOptions<TOutput, unknown, TOutput, TQueryKey>;

  /**
   * Get mutation options for this endpoint
   * @param options TanStack Query mutation options (except mutationFn which is provided automatically)
   * @returns Complete mutation options that can be passed directly to useMutation
   */
  mutationOptions: <TContext = unknown>(
    options?: Omit<UseMutationOptions<TOutput, Error, TInput, TContext>, 'mutationFn'>
  ) => UseMutationOptions<TOutput, Error, TInput, TContext>;
}

/**
 * Type for the TanStack Query API generated from a router
 */
export type TanStackAPI<T extends RouterDefinition> = {
  [K in keyof T]: T[K] extends Endpoint<infer I, infer O>
    ? TanStackEndpoint<I, O>
    : T[K] extends RouterDefinition
      ? TanStackAPI<T[K]>
      : never;
};
