/**
 * Type for any object with a parse method (like Zod schemas)
 */
export interface ZodLike<T> {
  parse: (data: unknown) => T;
}

/**
 * Infer the output type from a Zod-like schema
 */
export type InferZod<T> = T extends ZodLike<infer U> ? U : never;

/**
 * Generic schema interface that can be used with various validation libraries
 * like Zod, Yup, Joi, etc.
 */
export interface Schema<T = any> {
  /**
   * Zod-like validation method
   */
  parse?: (data: unknown) => T;

  /**
   * Joi-like validation method
   */
  validate?: (data: unknown) => { value: T };

  /**
   * Yup-like validation method
   */
  validateSync?: (data: unknown) => { value: T };

  /**
   * Simple casting method
   */
  cast?: (data: unknown) => T;

  /**
   * Original schema object (for type inference)
   */
  _def?: any;
}

/**
 * Process data with the provided schema
 * @param data Data to process
 * @param schema Schema for type inference
 * @param performValidation If true, performs validation, otherwise just type casting
 * @returns Processed data
 */
export function validateWithSchema<T>(
  data: unknown,
  schema: Schema<T>,
  performValidation = false
): T {
  // By default, just perform type casting without validation
  if (!performValidation) {
    return data as T;
  }

  // Support different validation libraries when validation is requested
  if (schema.parse) {
    // Zod-like validation
    return schema.parse(data);
  } else if (schema.validate) {
    // Joi-like validation
    return schema.validate(data).value;
  } else if (schema.validateSync) {
    // Yup-like validation
    return schema.validateSync(data).value;
  } else if (schema.cast) {
    // Simple casting
    return schema.cast(data);
  }

  // If no validation method is found, return as is
  return data as T;
}

/**
 * Create a Schema from a Zod schema
 * This allows for automatic type inference when using Zod schemas
 *
 * @param zodSchema A Zod schema
 * @returns A Schema that wraps the Zod schema
 */
export function createZodSchema<T extends ZodLike<any>>(zodSchema: T): Schema<InferZod<T>> {
  return {
    parse: (data: unknown) => zodSchema.parse(data),
    _def: zodSchema,
  };
}
