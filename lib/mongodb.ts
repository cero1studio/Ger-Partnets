import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error("MONGODB_URI no definida en .env.local")

// Cachear la conexión entre hot-reloads en dev
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

const cache = globalThis._mongooseCache ?? { conn: null, promise: null }
globalThis._mongooseCache = cache

export async function connectDB() {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  cache.conn = await cache.promise
  return cache.conn
}
