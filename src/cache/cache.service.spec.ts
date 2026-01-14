import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value', async () => {
      const mockValue = { data: 'test' };
      cacheManager.get.mockResolvedValue(mockValue);

      const result = await service.get<typeof mockValue>('test-key');

      expect(result).toEqual(mockValue);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return undefined when key not found', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('missing-key');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const mockValue = { data: 'test' };

      await service.set('test-key', mockValue);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockValue, undefined);
    });

    it('should set value with custom ttl', async () => {
      const mockValue = { data: 'test' };

      await service.set('test-key', mockValue, 5000);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockValue, 5000);
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      await service.del('test-key');

      expect(cacheManager.del).toHaveBeenCalledWith('test-key');
    });
  });
});
