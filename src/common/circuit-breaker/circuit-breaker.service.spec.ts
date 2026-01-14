import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { CircuitBreakerService, CircuitState } from './circuit-breaker.service';
import { CircuitBreakerOpenException } from '../exceptions/circuit-breaker.exception';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await service.execute('test-circuit', fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
      expect(service.getState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after reaching failure threshold', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const options = { failureThreshold: 3, successThreshold: 2, timeout: 30000 };

      for (let i = 0; i < 3; i++) {
        await expect(service.execute('fail-circuit', fn, options)).rejects.toThrow('fail');
      }

      expect(service.getState('fail-circuit')).toBe(CircuitState.OPEN);
    });

    it('should reject immediately when circuit is open', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const options = { failureThreshold: 2, successThreshold: 2, timeout: 60000 };

      for (let i = 0; i < 2; i++) {
        await expect(service.execute('open-circuit', fn, options)).rejects.toThrow('fail');
      }

      expect(service.getState('open-circuit')).toBe(CircuitState.OPEN);

      fn.mockClear();
      await expect(service.execute('open-circuit', fn, options)).rejects.toThrow(
        CircuitBreakerOpenException,
      );
      expect(fn).not.toHaveBeenCalled();
    });

    it('should reset failure count on success', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'));

      const options = { failureThreshold: 3, successThreshold: 2, timeout: 30000 };

      await expect(service.execute('reset-circuit', fn, options)).rejects.toThrow();
      await expect(service.execute('reset-circuit', fn, options)).rejects.toThrow();

      await service.execute('reset-circuit', fn, options);

      await expect(service.execute('reset-circuit', fn, options)).rejects.toThrow();
      await expect(service.execute('reset-circuit', fn, options)).rejects.toThrow();

      expect(service.getState('reset-circuit')).toBe(CircuitState.CLOSED);
    });

    it('should transition to half-open after timeout', async () => {
      jest.useFakeTimers();

      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const options = { failureThreshold: 2, successThreshold: 2, timeout: 1000 };

      for (let i = 0; i < 2; i++) {
        await expect(service.execute('timeout-circuit', fn, options)).rejects.toThrow('fail');
      }

      expect(service.getState('timeout-circuit')).toBe(CircuitState.OPEN);

      jest.advanceTimersByTime(1001);

      fn.mockResolvedValueOnce('success');
      await service.execute('timeout-circuit', fn, options);

      expect(service.getState('timeout-circuit')).toBe(CircuitState.HALF_OPEN);

      jest.useRealTimers();
    });

    it('should close circuit after success threshold in half-open state', async () => {
      jest.useFakeTimers();

      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const options = { failureThreshold: 2, successThreshold: 2, timeout: 1000 };

      for (let i = 0; i < 2; i++) {
        await expect(service.execute('close-circuit', fn, options)).rejects.toThrow('fail');
      }

      jest.advanceTimersByTime(1001);

      fn.mockResolvedValue('success');
      await service.execute('close-circuit', fn, options);
      await service.execute('close-circuit', fn, options);

      expect(service.getState('close-circuit')).toBe(CircuitState.CLOSED);

      jest.useRealTimers();
    });

    it('should reopen circuit on failure in half-open state', async () => {
      jest.useFakeTimers();

      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const options = { failureThreshold: 2, successThreshold: 2, timeout: 1000 };

      for (let i = 0; i < 2; i++) {
        await expect(service.execute('reopen-circuit', fn, options)).rejects.toThrow('fail');
      }

      jest.advanceTimersByTime(1001);

      fn.mockResolvedValueOnce('success');
      await service.execute('reopen-circuit', fn, options);

      expect(service.getState('reopen-circuit')).toBe(CircuitState.HALF_OPEN);

      fn.mockRejectedValueOnce(new Error('fail again'));
      await expect(service.execute('reopen-circuit', fn, options)).rejects.toThrow('fail again');

      expect(service.getState('reopen-circuit')).toBe(CircuitState.OPEN);

      jest.useRealTimers();
    });
  });

  describe('getState', () => {
    it('should return CLOSED for unknown circuit', () => {
      expect(service.getState('unknown')).toBe(CircuitState.CLOSED);
    });
  });
});
