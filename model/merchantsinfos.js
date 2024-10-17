const mongoose = require("mongoose");

const merchantsinfoSchema = new mongoose.Schema({
   name: { type: String, required: true, trim: true, index: true },  // trim added
   businessCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'businesscategorys', required: true, index: true },
   brandColor: { type: String, required: true, trim: true },  // trim added
   googlereviewURL: { type: String, required: true, unique: true, trim: true },  // trim added
   physicalAddress: { type: String, required: true, trim: true },  // trim added
   isActiveSubscription: { type: Boolean, default: true },
   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
   modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { 
   timestamps: true  // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model("merchantsinfos", merchantsinfoSchema);
