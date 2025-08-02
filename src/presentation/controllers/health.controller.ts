import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Public } from '../decorators/public.decorator';

@Controller('health')
@Public() // Make entire health controller public
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.getSystemInfo(),
    ]);
  }

  private getSystemInfo(): HealthIndicatorResult {
    return {
      system: {
        status: 'up',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.configService.get('app.nodeEnv'),
        version: this.configService.get('app.version'),
        name: this.configService.get('app.name'),
        node_version: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      },
    };
  }
}
