const mongoose = require("mongoose");

const supportsSchema = new mongoose.Schema({
    email : { type : String },
    subject : { type : String },
    description : { type : String }
}, {
    timestamps: true
});

module.exports = mongoose.model("supports", supportsSchema);