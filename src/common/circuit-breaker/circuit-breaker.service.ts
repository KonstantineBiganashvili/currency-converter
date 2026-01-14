import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { CircuitBreakerOpenException } from '../exceptions/circuit-breaker.exception';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
}

@Injectable()
export class CircuitBreakerService {
  private readonly circuits = new Map<string, CircuitBreakerState>();
  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
  };

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(name);

    if (circuit.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit, opts.timeout)) {
        this.transitionTo(name, circuit, CircuitState.HALF_OPEN);
      } else {
        this.logger.warn(`Circuit breaker ${name} is OPEN, rejecting request`);
        throw new CircuitBreakerOpenException(name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(name, circuit, opts);
      return result;
    } catch (error) {
      this.onFailure(name, circuit, opts);
      throw error;
    }
  }

  getState(name: string): CircuitState {
    return this.circuits.get(name)?.state ?? CircuitState.CLOSED;
  }

  private getOrCreateCircuit(name: string): CircuitBreakerState {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: null,
      });
    }
    return this.circuits.get(name)!;
  }

  private shouldAttemptReset(circuit: CircuitBreakerState, timeout: number): boolean {
    if (!circuit.lastFailureTime) return true;
    return Date.now() - circuit.lastFailureTime >= timeout;
  }

  private onSuccess(name: string, circuit: CircuitBreakerState, opts: CircuitBreakerOptions): void {
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;
      if (circuit.successes >= opts.successThreshold) {
        this.transitionTo(name, circuit, CircuitState.CLOSED);
      }
    } else {
      circuit.failures = 0;
    }
  }

  private onFailure(name: string, circuit: CircuitBreakerState, opts: CircuitBreakerOptions): void {
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionTo(name, circuit, CircuitState.OPEN);
    } else if (circuit.failures >= opts.failureThreshold) {
      this.transitionTo(name, circuit, CircuitState.OPEN);
    }
  }

  private transitionTo(name: string, circuit: CircuitBreakerState, newState: CircuitState): void {
    const oldState = circuit.state;
    circuit.state = newState;

    if (newState === CircuitState.CLOSED) {
      circuit.failures = 0;
      circuit.successes = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      circuit.successes = 0;
    }

    this.logger.info(`Circuit breaker ${name} transitioned from ${oldState} to ${newState}`);
  }
}
