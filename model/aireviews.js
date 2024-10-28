const mongoose = require("mongoose");

const aireviewsSchema = new mongoose.Schema({
    merchantInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'merchantsinfos', required: true, index: true },  
    generateAIReview: { type: String, required: true, trim: true },  
    ratings: { type: Number, min: 1, max: 5, required: true }, 
    question1: { type: String, required: true, trim: true },
    q1SelectedKeywords: { type: [String], required: true },
    question2: { type: String, required: true, trim: true },  
    q2SelectedKeywords: { type: [String], required: true },
    noOfCharsOfReview: { type: Number, required: true }, 
}, { 
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model("aireviews", aireviewsSchema);
