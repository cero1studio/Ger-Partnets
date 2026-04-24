import mongoose, { Schema, Document, Model } from "mongoose"

export type UserRole = "admin" | "aliado"

export interface IUser extends Document {
  nombre: string
  apellido: string
  email: string
  telefono?: string
  password: string
  etiqueta: string
  hubspotTagId?: string
  role: UserRole
  activo: boolean
  resetToken?: string
  resetTokenExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    nombre:        { type: String, required: true, trim: true },
    apellido:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    telefono:      { type: String, trim: true, default: "" },
    password:      { type: String, required: true },
    etiqueta:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    hubspotTagId:  { type: String, default: null },
    role:          { type: String, enum: ["admin", "aliado"], default: "aliado" },
    activo:        { type: Boolean, default: true },
    resetToken:    { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
)

// Evitar recompilar el modelo en hot-reload
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema)

export default User
