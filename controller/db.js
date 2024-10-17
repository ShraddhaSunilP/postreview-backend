const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
    .then(()=>console.log("MongoDB connected"))
    .catch((err)=>console.log("Mongodb connection error:", err));