import mongoose, { Schema, Document, Model } from "mongoose"

export interface IInvitation extends Document {
  nombre: string
  email: string
  token: string
  usada: boolean
  createdAt: Date
  updatedAt: Date
}

const InvitationSchema = new Schema<IInvitation>(
  {
    nombre: { type: String, required: true, trim: true },
    email:  { type: String, required: true, lowercase: true, trim: true },
    token:  { type: String, required: true, unique: true },
    usada:  { type: Boolean, default: false },
  },
  { timestamps: true }
)

const Invitation: Model<IInvitation> =
  (mongoose.models.Invitation as Model<IInvitation>) ?? mongoose.model<IInvitation>("Invitation", InvitationSchema)

export default Invitation
