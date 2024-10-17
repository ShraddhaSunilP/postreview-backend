const express = require('express');
const cors = require('cors');
require("dotenv").config();
require("./db");
const Users = require("../model/users");
const BusinessCategorys = require("../model/businesscategorys");
const NegaiveReviews = require("../model/negativereviews");
const MerchantsInfo = require("../model/merchantsinfos");
const Questionforms = require("../model/questionforms");
const AIReviews = require("../model/aireviews"); 
const app = express();

app.use(express.json()); 
app.use(cors());


// register Users
app.post("/user", async (req, res) => {
    try {
        let users = new Users(req.body);
        let result = await users.save();
        res.send(result);

    } catch (error) {
        console.log("Error adding user : ", error);
        res.status(500).send({ error: "Error adding user" });
    }
});


// register BusinessCategory
app.post("/BusinessCategories", async (req, res) => {
    try {
        let businesscategorys = new BusinessCategorys(req.body);
        let result = await businesscategorys.save();
        res.send(result);
    } catch(error){
        console.log("Error adding businesscategory : ", error);
        res.status(500).send({error: "Error adding businesscategory"});
    }
})


// register MerchantsInfo
app.post("/merchantsInfo", async(req,res) => {
    try{
        let merchantsinfo = new MerchantsInfo(req.body);
        let result = await merchantsinfo.save();
        res.send(result);
    } catch(error){
        console.log("Error adding merchantsInfo : ", error);
        res.status(500).send({error : "Error adding merchantsInfo"});
    }
})


// register NegativeReviews
app.post("/negativeReview", async(req,res) => {
    try{
        let negaiveReviews = new NegaiveReviews(req.body);
        let result = await negaiveReviews.save();
        res.send(result);
    } catch(error){
        console.log("Error adding negaiveReviews: ", error);
        res.status(500).send({error: "Error adding negaive Reviews"});
    }
})


// register questionfroms
app.post("/questionForms", async(req, res) =>{
    try{
        let questionsforms = new Questionforms(req.body);
        let result = await questionsforms.save();
        res.send(result);
    } catch(error){
        console.log("Error adding questionforms : ", error);
        res.status(500).send({error : "Error adding questionforms"});
    }
});


// register aireviews
app.post("/aireviews", async(req, res) => {
    try{
        let aireviews = new AIReviews(req.body);
        let result = await aireviews.save();
        res.send(result);
    } catch(error){
        console.log("Error adding aireviews : ", error);
        res.status(500).send({Error : "Error adding aireviews"});
    }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Base Url
// test.postAIreview.com