import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { HeartRateService } from './heart-rate.service';
import { AnalyticsRangeQueryDto } from './dto/analytics-range-query.dto';
import { HeartRateEventsQueryDto } from './dto/heart-rate-events-query.dto';
import { RequestTrackingInterceptor } from '../common/interceptors/request-tracking.interceptor';

@Controller('patients/:id/heart-rate')
@UseInterceptors(RequestTrackingInterceptor)
export class HeartRateController {
  constructor(private readonly heartRateService: HeartRateService) {}

  @Get('events')
  getEvents(@Param('id') id: string, @Query() query: HeartRateEventsQueryDto) {
    if (!!query.from !== !!query.to) {
      throw new BadRequestException(
        "Both 'from' and 'to' must be provided together, or neither",
      );
    }
    return this.heartRateService.getEvents(id, query);
  }

  @Get('analytics')
  getAnalytics(
    @Param('id') id: string,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.heartRateService.getAnalytics(id, query);
  }
}
