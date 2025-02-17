export const PORT = process.env.PORT || 3002;

// Redis Config
export const RedisUrl = process.env.UPSTASH_REDIS_REST_URL;
export const RedisPassword = process.env.UPSTASH_REDIS_PASSWORD

// R2 Config
export const R2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
export const R2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
export const R2AccessKeyID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
export const R2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
export const R2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME