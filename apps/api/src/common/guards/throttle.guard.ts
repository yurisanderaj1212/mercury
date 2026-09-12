import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class MercuryThrottlerGuard extends ThrottlerGuard {}
