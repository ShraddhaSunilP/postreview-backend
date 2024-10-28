const mongoose = require("mongoose");

const merchantsinfoSchema = new mongoose.Schema({ 
   name: { type: String, required: true, trim: true, index: true },  // trim added
   businessname :{ type:String, required:true, maxlength:15},
   // email : { type:String, required:true, trim:true, unique:true },
   password: { type: String, required: true, trim:true },
   activationLink : { type:String, required:true, trim:true },
   businessCategory:{ type: String, required:true, trim:true},
   // businessCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'businesscategorys', required: true, index: true },
   logo: { type: String, required: true, unique:true},   
   // mobile: { type: String, required: true, unique: true, trim: true, index: true }, 
   themeColor: { type: String, required: true, trim: true }, 
   textColor:{ type: String, required: true, trim: true},
   negativeReviewProtectiontoggle : { type:Boolean, default: false },
   gstNumber : { type: String},
   // SubscriptionStartDate: { type:Date, require:true },
   // SubscriptionEndDate: { type:Date, require:true },
   googlereviewURL: { type: String, required: true, unique: true, trim: true },  
   // physicalAddress: { type: String, required: true, trim: true },   
   isActiveSubscription: { type: Boolean, default: true },
   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
   modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
   negativeRevireMessage: { type: String, requied: true}
}, { 
   timestamps: true  // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model("merchantsinfos", merchantsinfoSchema);
