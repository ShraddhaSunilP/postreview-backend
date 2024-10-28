const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
    .then(()=>console.log("MongoDB connected"))
    .catch((err)=>console.log("Mongodb connection error:", err));

    // console.log(window.location.href);
    // $env:NODE_ENV="development"; 
    //  node app.jss
    // console.log(process.env.NODE_ENV);