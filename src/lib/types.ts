// Define base interfaces first to avoid circular references

/**
 * ZimFetch request options interface
 */
export interface ZimFetchOptions extends RequestInit {
  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;

  /**
   * Whether to automatically parse JSON responses
   * @default true
   */
  parseJson?: boolean;
}

/**
 * ZimFetch error interface
 */
export class ZimFetchError extends Error {
  /**
   * HTTP status code
   */
  status?: number;

  /**
   * Response data if available
   */
  data?: any;

  /**
   * Response headers if available
   */
  headers?: Headers;

  /**
   * Original Response object if available
   */
  response?: Response;

  /**
   * Original request URL
   */
  url: string;

  /**
   * Original request options
   */
  options: ZimFetchOptions;

  constructor(
    message: string,
    url: string,
    options: ZimFetchOptions,
    response?: Response,
    data?: any
  ) {
    super(message);
    this.name = 'ZimFetchError';
    this.url = url;
    this.options = options;

    if (response) {
      this.status = response.status;
      this.headers = response.headers;
      this.response = response;
    }

    if (data !== undefined) {
      this.data = data;
    }
  }
}

/**
 * ZimFetch response interface
 */
export interface ZimFetchResponse<T = any> {
  /**
   * Response data (parsed if JSON)
   */
  data: T;

  /**
   * Error object if request failed, null otherwise
   */
  error: ZimFetchError | null;

  /**
   * HTTP status code
   */
  status: number;

  /**
   * Response headers
   */
  headers: Headers;

  /**
   * Whether the request was successful (status in the range 200-299)
   */
  ok: boolean;

  /**
   * Original Response object
   */
  response: Response;
}

/**
 * Response structure returned by endpoint execution
 */
export type EndpointResponse<T> = {
  data: T | null;
  error: ZimFetchError | null;
  status: number;
};
