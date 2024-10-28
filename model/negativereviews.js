const mongoose = require('mongoose');

const negativereviewsSchema = new mongoose.Schema({
    merchantInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'merchantsinfos', required: true },  // Adjusted ref to 'merchantsinfos'
    name: { type: String, required: true, trim: true, index: true },  // trim added
    mobileNo: { type: String, required: true, unique: true, index: true },
    status: { type: String, required: true, trim: true },  // trim added
    resolutionComment: { type: String, trim: true, required: false },  // trim added
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { 
    timestamps: true  // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model("negativereviews", negativereviewsSchema);
