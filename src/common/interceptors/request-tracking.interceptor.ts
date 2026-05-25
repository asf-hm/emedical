import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { PatientsService } from '../../patients/patients.service';
import { SKIP_TRACKING_KEY } from '../decorators/skip-tracking.decorator';

@Injectable()
export class RequestTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTrackingInterceptor.name);

  constructor(
    private readonly patientsService: PatientsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRACKING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const rawPatientId = request.params?.['id'];
    const patientId = Array.isArray(rawPatientId)
      ? rawPatientId[0]
      : rawPatientId;

    if (skip || !patientId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          void this.patientsService
            .incrementRequestCount(patientId)
            .catch((err: unknown) => {
              this.logger.error(
                `Failed to increment requestCount for patient ${patientId}`,
                err instanceof Error ? err.stack : String(err),
              );
            });
        },
      }),
    );
  }
}
