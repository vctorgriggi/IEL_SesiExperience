export type RateLimitResult = {
  isRateLimited: boolean;
  requestLimit: number;
  remaining: number;
};

export type RateLimiter = {
  check(
    requestLimit: number,
    uniqueIdentifier: string
  ): Promise<RateLimitResult>;
};
