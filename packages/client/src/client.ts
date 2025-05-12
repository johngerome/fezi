import { FeziOptions, FeziResponse, FeziError, StandardHeaders } from './types';
import { Endpoint, RequestConfig } from './endpoint';

const DEFAULT_CONTENT_TYPE = 'application/json';
const DEFAULT_HTTP_METHOD = 'GET';

/**
 * APIClient configuration options
 */
export interface APIClientOptions {
  /**
   * URL for all API requests
   */
  url: string;

  /**
   * Default headers for all requests
   * Can be a static object or a function that returns headers
   */
  headers?: StandardHeaders | (() => StandardHeaders) | (() => Promise<StandardHeaders>);
}

/**
 * APIClient for making HTTP requests with schema validation
 *
 * Example usage:
 * ```typescript
 * const client = new APIClient({
 *   url: 'http://localhost:3000'
 * });
 *
 * // Define schemas (using Zod as an example)
 * const userInputSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const userOutputSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   createdAt: z.string().datetime()
 * });
 *
 * // Create endpoints
 * const createUser = client
 *   .route({ method: 'POST', path: '/users' })
 *   .input(userInputSchema)
 *   .output(userOutputSchema);
 *
 * // Create a router
 * const router = {
 *   users: {
 *     create: createUser
 *   }
 * };
 *
 * // Create a type-safe API client
 * const api = createClientAPI(router);
 *
 * // Use the API
 * const newUser = await api.users.create({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
export class APIClient {
  private options: APIClientOptions;

  /**
   * Create a new APIClient instance
   */
  constructor(options: APIClientOptions) {
    this.options = {
      ...options,
    };
  }

  /**
   * Create a new route with the given configuration
   * @param config Route configuration including method and path
   */
  route<TInput = unknown, TOutput = unknown>(config: RequestConfig): Endpoint<TInput, TOutput> {
    const endpoint = new Endpoint<TInput, TOutput>(this);

    if (config.path) {
      endpoint.path(config.path);
    }

    if (config.method) {
      endpoint.method(config.method);
    }

    if (config.headers) {
      endpoint.headers(config.headers);
    }

    return endpoint;
  }

  /**
   * Execute a request using the provided config
   * @internal This is used by Endpoint and shouldn't be called directly
   */
  async execute<TInput, TOutput>(
    config: RequestConfig & {
      body?: TInput;
      params?: Record<PropertyKey, string | number | boolean | null | undefined>;
    }
  ): Promise<FeziResponse<TOutput>> {
    const url = this.buildUrl(config);
    const options = await this.buildOptions(config);

    try {
      return await this.fetchRequest<TOutput>(url, options);
    } catch (error) {
      if (error instanceof FeziError) {
        throw error;
      }
      throw new FeziError(error instanceof Error ? error.message : String(error), url, options);
    }
  }

  /**
   * Build the full URL for a request
   */
  private buildUrl(
    config: RequestConfig & {
      params?: Record<PropertyKey, string | number | boolean | null | undefined>;
    }
  ): string {
    const normalizedUrl = this.options.url.endsWith('/')
      ? this.options.url.slice(0, -1)
      : this.options.url;

    let url = normalizedUrl;

    if (config.path) {
      const path = config.path.startsWith('/') ? config.path : `/${config.path}`;
      url += path;
    }

    if (config.params && Object.keys(config.params).length > 0) {
      const searchParams = new URLSearchParams();

      for (const [key, value] of Object.entries(config.params)) {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      }

      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Build request options by merging defaults with request-specific options
   */
  private async buildOptions(config: RequestConfig & { body?: any }): Promise<FeziOptions> {
    const options: FeziOptions = {
      method: config.method || DEFAULT_HTTP_METHOD,
      headers: await this.mergeHeaders(config.headers),
    };

    if (config.body && !['GET', 'HEAD'].includes(options.method || '')) {
      options.body = JSON.stringify(config.body);
    }

    return options;
  }

  /**
   * Merge default headers with request-specific headers
   */
  private async mergeHeaders(
    requestHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const defaultHeaders =
      typeof this.options.headers === 'function'
        ? await this.options.headers()
        : this.options.headers || {};

    return {
      'Content-Type': DEFAULT_CONTENT_TYPE,
      ...defaultHeaders,
      ...requestHeaders,
    };
  }

  /**
   * Perform a fetch request
   */
  private async fetchRequest<TOutput>(
    url: string,
    options: FeziOptions
  ): Promise<FeziResponse<TOutput>> {
    try {
      const fetchOptions: RequestInit = {
        ...options,
      };

      const response = await fetch(url, fetchOptions);
      const parseJson = options.parseJson !== false;

      const data =
        parseJson && response.headers.get('content-type')?.includes('application/json')
          ? await response.json()
          : await response.text();

      return {
        data,
        error: null,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      throw new FeziError(error instanceof Error ? error.message : String(error), url, options);
    }
  }
}
