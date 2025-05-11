// Define base interfaces first to avoid circular references

/**
 * Fezi request options interface
 */
export interface FeziOptions extends RequestInit {
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
 * Fezi error interface
 */
export class FeziError extends Error {
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
  options: FeziOptions;

  constructor(message: string, url: string, options: FeziOptions, response?: Response, data?: any) {
    super(message);
    this.name = 'FeziError';
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
 * Fezi response interface
 */
export interface FeziResponse<T = any> {
  /**
   * Response data (parsed if JSON)
   */
  data: T;

  /**
   * Error object if request failed, null otherwise
   */
  error: FeziError | null;

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
 * Unlike FeziResponse, this is a simpler structure used specifically
 * for endpoint execution results without headers and Response object.
 */
export type EndpointResponse<T> = {
  data: T | null;
  error: FeziError | null;
  status: number;
};
