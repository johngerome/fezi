import { Schema, validateWithSchema, createZodSchema, ZodLike, InferZod } from './schema';
import { APIClient } from './client';
import { FeziError, EndpointResponse } from './types';

/**
 * Request configuration
 */
export interface RequestConfig {
  /**
   * Request path (appended to base URL)
   */
  path?: string;

  /**
   * Request method
   * @default 'GET'
   */
  method?: string;

  /**
   * Additional headers for this request
   */
  headers?: Record<string, string>;
}

/**
 * Endpoint definition with input and output schemas
 */
export class Endpoint<TInput = any, TOutput = any> {
  private client: APIClient;
  private config: RequestConfig = {};
  private inputSchema?: Schema<TInput>;
  private outputSchema?: Schema<TOutput>;

  constructor(client: APIClient) {
    this.client = client;
  }

  /**
   * Set the input schema for validation
   * Supports both Schema objects and Zod schemas
   */
  input<S extends Schema<any> | ZodLike<any>>(
    schema: S
  ): Endpoint<
    S extends Schema<infer T> ? T : S extends ZodLike<any> ? InferZod<S> : never,
    TOutput
  > {
    if (
      'parse' in schema &&
      !('validate' in schema) &&
      !('validateSync' in schema) &&
      !('cast' in schema)
    ) {
      this.inputSchema = createZodSchema(schema as ZodLike<any>);
    } else {
      this.inputSchema = schema as Schema<any>;
    }
    return this as any;
  }

  /**
   * Set the output schema for validation
   * Supports both Schema objects and Zod schemas
   */
  output<S extends Schema<any> | ZodLike<any>>(
    schema: S
  ): Endpoint<
    TInput,
    S extends Schema<infer T> ? T : S extends ZodLike<any> ? InferZod<S> : never
  > {
    if (
      'parse' in schema &&
      !('validate' in schema) &&
      !('validateSync' in schema) &&
      !('cast' in schema)
    ) {
      this.outputSchema = createZodSchema(schema as ZodLike<any>);
    } else {
      this.outputSchema = schema as Schema<any>;
    }
    return this as any;
  }

  /**
   * Set the request path
   */
  path(path: string): Endpoint<TInput, TOutput> {
    this.config.path = path;
    return this;
  }

  /**
   * Set the request method
   */
  method(method: string): Endpoint<TInput, TOutput> {
    this.config.method = method;
    return this;
  }

  /**
   * Set additional headers for this request
   */
  headers(headers: Record<string, string>): Endpoint<TInput, TOutput> {
    this.config.headers = headers;
    return this;
  }

  /**
   * Execute the request with the provided input data
   */
  async execute(
    input?: TInput,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<EndpointResponse<TOutput>> {
    let validatedInput: TInput | undefined = input;

    if (input && this.inputSchema) {
      validatedInput = validateWithSchema(input, this.inputSchema, true);
    }

    try {
      const response = await this.client.execute<TInput, TOutput>({
        ...this.config,
        body: validatedInput,
        params,
      });

      const data = this.outputSchema
        ? validateWithSchema(response.data, this.outputSchema, true)
        : response.data;

      return { data, error: null, status: response.status };
    } catch (error) {
      const feziError =
        error instanceof FeziError
          ? error
          : new FeziError(
              error instanceof Error ? error.message : String(error),
              this.config.path || '',
              this.config
            );
      const errorStatus = typeof feziError.status === 'number' ? feziError.status : 500;
      return { data: null, error: feziError, status: errorStatus };
    }
  }
}
