import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  nombre: string
  apellido: string
  email: string
  password: string
  etiqueta: string          // slug único: "carlos.mendoza"
  hubspotTagId?: string     // ID del Deal Tag en HubSpot (se completa al crear el tag)
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    nombre:        { type: String, required: true, trim: true },
    apellido:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true },
    etiqueta:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    hubspotTagId:  { type: String, default: null },
    activo:        { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Evitar recompilar el modelo en hot-reload
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema)

export default User
