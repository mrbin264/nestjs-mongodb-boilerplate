import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService, MongooseHealthIndicator, HealthCheckStatus } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: MongooseHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'app.nodeEnv': 'test',
                'app.version': '1.0.0',
                'app.name': 'Boilerplate Backend Test',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should check health', async () => {
    const mockHealthResult = {
      status: 'ok' as HealthCheckStatus,
      info: {},
      error: {},
      details: {},
    };

    jest.spyOn(healthService, 'check').mockResolvedValue(mockHealthResult);

    const result = await controller.check();
    expect(result).toEqual(mockHealthResult);
    expect(healthService.check).toHaveBeenCalled();
  });
});
