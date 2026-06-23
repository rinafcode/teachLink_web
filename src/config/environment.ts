export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging' || nodeEnv === 'test') return 'staging';
  return 'development';
};
