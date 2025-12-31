import {
  HttpException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter, ErrorResponse } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
  };
  let mockHost: {
    switchToHttp: jest.Mock;
  };
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test/path',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };

    // Spy on logger to verify logging behavior
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('HttpException handling (4xx errors)', () => {
    it('should handle NotFoundException with standard format', () => {
      const exception = new NotFoundException('Entity not found');

      filter.catch(exception, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Entity not found');
      expect(response.error).toBe('Not Found');
      expect(response.path).toBe('/test/path');
      expect(response.timestamp).toBeDefined();
    });

    it('should handle BadRequestException with standard format', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Invalid input');
      expect(response.error).toBe('Bad Request');
    });

    it('should handle validation errors with array of messages', () => {
      const validationMessages = ['name should not be empty', 'email must be an email'];
      const exception = new BadRequestException(validationMessages);

      filter.catch(exception, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(response.message).toEqual(validationMessages);
      expect(response.error).toBe('Bad Request');
    });

    it('should log 4xx errors at WARN level', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, mockHost as never);

      expect(loggerWarnSpy).toHaveBeenCalled();
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp in ISO format', () => {
      const exception = new NotFoundException('Not found');
      const beforeTime = new Date().toISOString();

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      const afterTime = new Date().toISOString();

      // Timestamp should be between before and after
      expect(response.timestamp >= beforeTime).toBe(true);
      expect(response.timestamp <= afterTime).toBe(true);
    });

    it('should include request path in response', () => {
      mockRequest.url = '/api/users/123';
      const exception = new NotFoundException('User not found');

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.path).toBe('/api/users/123');
    });
  });

  describe('HttpException handling (5xx errors)', () => {
    it('should handle InternalServerErrorException', () => {
      const exception = new InternalServerErrorException('Database error');

      filter.catch(exception, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('Database error');
      expect(response.error).toBe('Internal Server Error');
    });

    it('should log 5xx errors at ERROR level', () => {
      const exception = new InternalServerErrorException('Server error');

      filter.catch(exception, mockHost as never);

      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Unknown exception handling (unhandled errors)', () => {
    it('should return generic message for unknown exceptions', () => {
      const exception = new Error('Database connection failed');

      filter.catch(exception, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('An unexpected error occurred. Please try again later.');
      expect(response.error).toBe('Internal Server Error');
    });

    it('should NOT expose internal error message to client', () => {
      const exception = new Error('SQL syntax error near SELECT');

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      // Should NOT contain the actual error message
      expect(response.message).not.toContain('SQL');
      expect(response.message).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should NOT expose stack trace to client', () => {
      const exception = new Error('Internal error');
      exception.stack = 'Error: at Database.query (db.ts:123)';

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      // Response should not contain stack trace
      expect(JSON.stringify(response)).not.toContain('db.ts');
      expect(JSON.stringify(response)).not.toContain('Database.query');
    });

    it('should log full error with stack trace server-side', () => {
      const exception = new Error('Database error');
      exception.stack = 'Error: Database error\n    at query (db.ts:50)';

      filter.catch(exception, mockHost as never);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled exception'),
        expect.stringContaining('Database error'),
      );
    });

    it('should handle non-Error thrown values', () => {
      const exception = 'String error thrown';

      filter.catch(exception, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should handle null/undefined thrown values', () => {
      filter.catch(null, mockHost as never);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('An unexpected error occurred. Please try again later.');
    });
  });

  describe('ErrorResponse structure', () => {
    it('should always include all required fields', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('path');
    });

    it('should have correct types for all fields', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;

      expect(typeof response.statusCode).toBe('number');
      expect(typeof response.message === 'string' || Array.isArray(response.message)).toBe(true);
      expect(typeof response.error).toBe('string');
      expect(typeof response.timestamp).toBe('string');
      expect(typeof response.path).toBe('string');
    });
  });

  describe('HTTP status text mapping', () => {
    it.each([
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [409, 'Conflict'],
      [500, 'Internal Server Error'],
    ])('should map status %d to "%s"', (statusCode, expectedText) => {
      const exception = new HttpException('Test', statusCode);

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.error).toBe(expectedText);
    });

    it('should return "Error" for unmapped status codes', () => {
      const exception = new HttpException('Test', 418); // I'm a teapot

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.error).toBe('Error');
    });
  });

  describe('Message extraction', () => {
    it('should handle string exception response', () => {
      const exception = new HttpException('Simple message', 400);

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.message).toBe('Simple message');
    });

    it('should handle object exception response with message property', () => {
      const exception = new HttpException({ message: 'Object message', statusCode: 400 }, 400);

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.message).toBe('Object message');
    });

    it('should handle object exception response with message array', () => {
      const messages = ['Error 1', 'Error 2'];
      const exception = new HttpException(
        { message: messages, error: 'Validation Error', statusCode: 400 },
        400,
      );

      filter.catch(exception, mockHost as never);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.message).toEqual(messages);
    });
  });
});
