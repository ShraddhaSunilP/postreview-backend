const mongoose = require("mongoose");

const aireviewsSchema = new mongoose.Schema({
    merchantInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'merchantsinfos', required: true, index: true },  // Adjusted ref to 'merchantsinfos'
    generateAIReview: { type: String, required: true, trim: true },  // trim added
    ratings: { type: Number, min: 1, max: 5, required: true }, 
    isNegativeReview: { type: Boolean, required: true }, 
    q1SelectedKeywords: { type: [String], required: true },
    q2SelectedKeywords: { type: [String], required: true },
    noOfCharsOfReview: { type: Number, required: true }, 
}, { 
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model("aireviews", aireviewsSchema);
