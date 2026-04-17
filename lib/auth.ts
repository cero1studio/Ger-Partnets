import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const COOKIE  = "ger_token"

export interface JWTPayload {
  userId: string
  email: string
  etiqueta: string
  nombre: string
  apellido: string
  role: "admin" | "aliado"
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET no definida")
  return secret
}

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function cookieName() {
  return COOKIE
}
