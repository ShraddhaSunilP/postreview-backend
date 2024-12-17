const mongoose = require('mongoose');

const questionsSchema = new mongoose.Schema({
    merchantInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'merchantsinfos', required: true, index: true },  
    question1: { type: String, required: true, trim: true },
    question1Keywords: { type: [String], required: true }, 
    question2: { type: String, required: true, trim: true },  
    question2Keywords: { type: [String], required: true }, 
},{ 
    timestamps: true  // Automatically adds createdAt and updatedAt fields
 });
    module.exports = mongoose.model('questionforms', questionsSchema);