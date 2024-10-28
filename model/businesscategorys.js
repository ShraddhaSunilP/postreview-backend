const mongoose = require('mongoose');

const businesscategorysSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true, index: true },  
    code: { type: String, required: true, unique: true, trim: true, index: true },  // trim added
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { 
    timestamps: true  // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('businesscategorys', businesscategorysSchema);
