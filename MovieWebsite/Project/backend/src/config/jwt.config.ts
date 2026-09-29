/**
 * JWT Configuration — đọc từ env vars.
 * Dùng cho JwtModule.register() trong AuthModule.
 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  signOptions: {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  },
};

export const refreshTokenConfig = {
  expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};