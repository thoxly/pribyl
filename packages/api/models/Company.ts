import { Schema, model, models } from 'mongoose';

const companySchema = new Schema({
  name: { type: String, required: true },
  inn: { type: String },
  kpp: { type: String },
  ogrn: { type: String },
  users: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
}, { timestamps: true });

export default models.Company || model('Company', companySchema);
