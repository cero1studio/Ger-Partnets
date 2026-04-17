import mongoose from "mongoose"

// Cachear la conexión entre hot-reloads en dev
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

const cache = globalThis._mongooseCache ?? { conn: null, promise: null }
globalThis._mongooseCache = cache

function getMongoUri() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI no definida")
  return uri
}

export async function connectDB() {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), { bufferCommands: false })
  }

  cache.conn = await cache.promise
  return cache.conn
}
