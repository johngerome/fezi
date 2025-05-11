import { describe, it, expect, vi } from 'vitest';
import { validateWithSchema, Schema } from '../schema';

describe('Schema Validation', () => {
  describe('validateWithSchema', () => {
    it('should use parse method if available (Zod-like)', () => {
      const data = { name: 'Test' };
      const transformedData = { name: 'Test', id: 1 };

      const schema: Schema = {
        parse: vi.fn().mockReturnValue(transformedData),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.parse).toHaveBeenCalledWith(data);
      expect(result).toEqual(transformedData);
    });

    it('should use validate method if available (Joi-like)', () => {
      const data = { name: 'Test' };
      const transformedData = { name: 'Test', id: 1 };

      const schema: Schema = {
        validate: vi.fn().mockReturnValue({ value: transformedData }),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.validate).toHaveBeenCalledWith(data);
      expect(result).toEqual(transformedData);
    });

    it('should use validateSync method if available (Yup-like)', () => {
      const data = { name: 'Test' };
      const transformedData = { name: 'Test', id: 1 };

      const schema: Schema = {
        validateSync: vi.fn().mockReturnValue({ value: transformedData }),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.validateSync).toHaveBeenCalledWith(data);
      expect(result).toEqual(transformedData);
    });

    it('should use cast method if available', () => {
      const data = { name: 'Test' };
      const transformedData = { name: 'Test', id: 1 };

      const schema: Schema = {
        cast: vi.fn().mockReturnValue(transformedData),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.cast).toHaveBeenCalledWith(data);
      expect(result).toEqual(transformedData);
    });

    it('should return data as is if no validation method is found', () => {
      const data = { name: 'Test' };
      const schema: Schema = {};

      const result = validateWithSchema(data, schema);

      expect(result).toEqual(data);
    });

    it('should prioritize parse over other methods if multiple are available', () => {
      const data = { name: 'Test' };

      const schema: Schema = {
        parse: vi.fn().mockReturnValue({ name: 'Test', fromParse: true }),
        validate: vi.fn().mockReturnValue({ value: { name: 'Test', fromValidate: true } }),
        validateSync: vi.fn().mockReturnValue({ value: { name: 'Test', fromValidateSync: true } }),
        cast: vi.fn().mockReturnValue({ name: 'Test', fromCast: true }),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.parse).toHaveBeenCalledWith(data);
      expect(schema.validate).not.toHaveBeenCalled();
      expect(schema.validateSync).not.toHaveBeenCalled();
      expect(schema.cast).not.toHaveBeenCalled();
      expect(result).toEqual({ name: 'Test', fromParse: true });
    });

    it('should prioritize validate over validateSync and cast if parse is not available', () => {
      const data = { name: 'Test' };

      const schema: Schema = {
        validate: vi.fn().mockReturnValue({ value: { name: 'Test', fromValidate: true } }),
        validateSync: vi.fn().mockReturnValue({ value: { name: 'Test', fromValidateSync: true } }),
        cast: vi.fn().mockReturnValue({ name: 'Test', fromCast: true }),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.validate).toHaveBeenCalledWith(data);
      expect(schema.validateSync).not.toHaveBeenCalled();
      expect(schema.cast).not.toHaveBeenCalled();
      expect(result).toEqual({ name: 'Test', fromValidate: true });
    });

    it('should prioritize validateSync over cast if parse and validate are not available', () => {
      const data = { name: 'Test' };

      const schema: Schema = {
        validateSync: vi.fn().mockReturnValue({ value: { name: 'Test', fromValidateSync: true } }),
        cast: vi.fn().mockReturnValue({ name: 'Test', fromCast: true }),
      };

      const result = validateWithSchema(data, schema, true);

      expect(schema.validateSync).toHaveBeenCalledWith(data);
      expect(schema.cast).not.toHaveBeenCalled();
      expect(result).toEqual({ name: 'Test', fromValidateSync: true });
    });
  });
});
