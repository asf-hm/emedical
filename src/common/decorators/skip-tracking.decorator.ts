import { SetMetadata } from '@nestjs/common';

export const SKIP_TRACKING_KEY = 'skipTracking';
export const SkipTracking = () => SetMetadata(SKIP_TRACKING_KEY, true);
