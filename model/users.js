const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, index: true },  // trim added
    email: { type: String, required: true, unique: true, trim: true, index: true },  // trim added
    password : { type : String, required: true,trim: true, index: true},
    mobile: { type: String, required: true, unique: true, trim: true, index: true },  // trim added
    designation: { type: String, required: true, trim: true, index: true },  // trim added
    isAdmin: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
}, { 
    timestamps: true  // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('users', usersSchema);
