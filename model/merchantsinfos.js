// ****** This is my current Schema ****** //
const mongoose = require("mongoose");
const multer = require('multer');

const storage = multer.memoryStorage(); // Use memory storage for simplicity
const upload = multer({ storage: storage });

const merchantsinfoSchema = new mongoose.Schema({ 
   name: { type: String, trim: true },
   businessname: { type: String, maxlength: 15 },
   email: { type: String, trim: true },
   password: { type: String, trim: true },
   activationLink: { type: String, trim: true },
   expiresAt: { type: Date }, 
   businessCategory: { type: String, trim: true },
   logo: { type: Buffer },
   isActive: { type: Boolean, default: false },
   themeColor: { type: String, trim: true },
   textColor: { type: String, trim: true },
   negativeReviewProtectiontoggle: { type: Boolean, default: false },
   gstNumber: { type: String },
   googlereviewURL: { type: String },
   isActiveSubscription: { type: Boolean, default: false },
   modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
   negativeReviewMessage: { type: String },
   question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'questionforms' },
   scanner: { type: Buffer }
}, { 
   timestamps: true
});

module.exports = mongoose.model("merchantsinfos", merchantsinfoSchema);


// ****** This connet is not add in my schema ********* //
// businessCategoryId: { type: mongoose.Schema.Types.Objec tId, ref: 'businesscategorys', required: true, index: true }, 
// mobile: { type: String, required: true, unique: true, trim: true, index: true }, 
// SubscriptionStartDate: { type:Date, require:true },
// SubscriptionEndDate: { type:Date, require:true },
// physicalAddress: { type: String, required: true, trim: true },   
//createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },


   

// ****** This is my old schema with all validations ****** //
// const mongoose = require("mongoose");
// const multer = require('multer');

// const storage = multer.memoryStorage(); // Use memory storage for simplicity
// const upload = multer({ storage: storage });

// const merchantsinfoSchema = new mongoose.Schema({ 
//    name: { type: String, trim: true, index: true },
//    businessname: { type: String, maxlength: 15, unique: true },
//    email: { type: String, trim: true, unique: true },
//    password: { type: String, trim: true },
//    activationLink: { type: String, trim: true },
//    expiresAt: { type: Date }, // Expiration time for the activation link
//    businessCategory: { type: String, trim: true },
//    logo: { type: Buffer },
//    isActive: { type: Boolean, default: false },
//    themeColor: { type: String, trim: true },
//    textColor: { type: String, trim: true },
//    negativeReviewProtectiontoggle: { type: Boolean, default: false },
//    gstNumber: { type: String },
//    googlereviewURL: { type: String, type: String, unique: true, sparse: true },
//    isActiveSubscription: { type: Boolean, default: false },
//    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
//    negativeRevireMessage: { type: String },
//    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'questionforms' },
//    scanner: { type: Buffer, unique: true, sparse: true }
// }, { 
//    timestamps: true
// });

// module.exports = mongoose.model("merchantsinfos", merchantsinfoSchema);
