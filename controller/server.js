const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require("dotenv").config();
require("./db");
const axios = require("axios");
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

const multer = require('multer');
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage }); 

const bcrypt = require('bcrypt');
const saltRounds = 10;

const Jwt = require("jsonwebtoken");
const jwtkey = "PostReview"

// const SignupUsers = require("../model/signupUsers");
const Users = require("../model/users");
const BusinessCategorys = require("../model/businesscategorys");
const NegaiveReviews = require("../model/negativereviews");
const MerchantsInfo = require("../model/merchantsinfos");
const Questionforms = require("../model/questionforms");
const AIReviews = require("../model/aireviews");
const app = express();

app.use(express.json());
app.use(cors());

// In-memory storage for OTPs (use a database in production)
let otpStore = {};

// // Signup Users 
// app.post("/registerUser", async(req,res) => {
//   try{
//     if(req.body.password){
//       req.body.password = await bcrypt.hash(req.body.password, saltRounds);
//     }
//     let signupusers = new SignupUsers(req.body);
//     let result = await signupusers.save();
//     res.status(201).send(result);
//   } catch(error){
//     console.log("Error registering user : ", error);
//     res.status(500).send({error : "Error registering user"});
//   }
// });


// register Users
app.post("/users", async (req, res) => {
  try {
    if(req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    }
    let user = new Users(req.body);
    let result = await user.save();
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: "An error occurred while adding the user"});
  }
});


//get all users
app.get("/users", async (req, res) => {
  try {
    let users = await Users.find();

    if (users.length > 0) {
      res.status(200).send(users);
    } else {
      res.status(404).send({ result: "No users found" })
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving users" });
  }
});


// Get single user by name
app.get("/users/:name", async (req, res) => {
  try {
    let result = await Users.findOne({ name: req.params.name });
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send({ result: "User not Found." });
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving the user" });
  }
});

// Update User by name
app.put("/users/:name", async (req, res) => {
  try {
    const result = await Users.updateOne(
      { name: req.params.name }, // Match by name instead of _id
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send('No user found with the given name');
    }
    res.status(200).send({ message: "User updated successfully", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while updating the user" });
  }
});

// delete User by id 
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid User ID format"});
    }

    const result = await Users.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while deleting the user" });
  }
});


// register BusinessCategory
app.post("/businesscategories", async (req, res) => {
  try {
    let businesscategorys = new BusinessCategorys(req.body);
    let result = await businesscategorys.save();
    res.status(201).send({ message: "Business category created successfully", data: result });
  } catch (error) {
    return res.status(500).send({ error: "An error occurred while adding the business category" });
  }
})

// get all businesscategories
app.get("/businesscategories", async (req, res) => {
  try {
    let businesscategory = await BusinessCategorys.find();
    if (businesscategory.length > 0) {
      res.status(200).send(businesscategory);
    } else {
      res.status(404).send({ result: "No businesscategory found" });
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving business categories" });
  }
});

// Get businessctegory by name
app.get("/businesscategories/:name", async (req, res) => {
  try {
    let businessCategory = await BusinessCategorys.findOne({ name: req.params.name });
    if (businessCategory) {
      res.status(200).send(businessCategory);
    } else {
      res.status(404).send({ message: "Business category not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving the business category" });
  }
});

// Update businessctegory by name
app.put("/businesscategories/:name", async (req, res) => {
  try {
    const result = await BusinessCategorys.updateOne(
      { name: req.params.name },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "No business category found with the given name" });
    }
    res.status(200).send({ message: "Business category updated successfully", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while updating the business category" });
  }
});

// delete businessctegory by id 
app.delete("/businesscategories/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid Business Category ID" });
    }

    const result = await BusinessCategorys.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "businessctegory not found" });
    }

    res.status(200).send({ message: "Business category deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while deleting the business category" });
  }
});

// register MerchantsInfo
app.post("/merchantsinfos", upload.single('logo'), async (req, res) => { // Add multer middleware
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    }

    let merchantsinfo = new MerchantsInfo({
      ...req.body,
      logo: req.file ? req.file.buffer : undefined // Add logo from file buffer if uploaded
    });

    let result = await merchantsinfo.save();

    res.status(201).send({ message: "Merchant info added successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while adding merchant info" });
  }
});

//check business name
app.post('/check-unique', async (req, res) => {
  const { businessName } = req.body;

  if (!businessName) {
    return res.status(400).json({ error: 'Business name is required.' });
  }

  try {
    // Check if the business name already exists in the database
    const existingBusiness = await MerchantsInfo.findOne({ businessname: businessName });

    if (existingBusiness) {
      // If it exists, send a response indicating it's not unique
      return res.status(409).json({ unique: false });
    }

    // If it doesn't exist, send a response indicating it's unique
    return res.status(200).json({ unique: true });
  } catch (error) {
    
    return res.status(500).json({ error: 'Server error during business name validation' });
  }
});

// get all records for MerchantsInfo 
app.get("/merchantsinfos", async (req, res) => {
  try {
    let merchantinfo = await MerchantsInfo.find();
    
    if (merchantinfo.length > 0) {
      res.status(200).send(merchantinfo);
    } else {
      res.status(404).send({ result: "No merchantinfo found" })
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving merchant info" });
  } 
});

// Get single merchantsInfo by businessname
app.get("/merchantsinfos/:businessname", async (req, res) => {
  try {
    let result = await MerchantsInfo.findOne({ businessname: req.params.businessname });
    if (result) {
      console.log(result._id);
      res.status(200).send(result._id);
      console.log(result._id);
      let questions = await Questionforms.find({ merchantInfoId: result._id });
      res.status(200).send(questions);
    } else {
      res.status(404).send({ message: "No record found." });
    }
  } catch (error) {
   res.status(500).send({ error: "An error occurred while fetching merchant info." });
  }
});

// Update merchantsInfo by name
app.put("/merchantsinfos/:businessname", async (req, res) => {
  try {
    const result = await MerchantsInfo.updateOne(
      { businessname: req.params.businessname }, // Match by name instead of _id
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "No merchant info found with the given business name." });
    }
    res.status(200).send({ message: "Merchant info updated successfully", data: result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while updating merchant info." });
  }
});

// delete merchantinfos by id 
app.delete("/merchantsinfos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid Merchant Info ID" });
    }

    const result = await MerchantsInfo.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Merchant info not found" });
    }

    res.send({ message: "Merchant info deleted successfully", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while deleting merchant info." });
  }
});

// register NegativeReviews
app.post("/negativeReviews", async (req, res) => {
  try {
    let negaiveReviews = new NegaiveReviews(req.body);
    console.log("Request Body:", req.body);
    let result = await negaiveReviews.save();
    res.status(201).send(result); 
  } catch (error) {
    console.log("Error adding negative reviews:", error);
    res.status(500).send({ error: "Error adding negative reviews" }); // Corrected spelling
  }
});

// get all Negative reviews
app.get("/negativeReviews", async (req, res) => {
  try {
    let negativeReviews = await NegaiveReviews.find();
    if (negativeReviews.length > 0) {
      res.status(200).send(negativeReviews);
    } else {
      res.status(404).send({ message: "No Records Found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Error getting negative reviews" }); // Corrected spelling
  }
});

// get single data in NegaiveReviews by name
app.get("/negativeReviews/:name", async (req, res) => {
  try {
    let result = await NegaiveReviews.findOne({ name: req.params.name });
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send({ result: "No Record Found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" }); // Fixed spelling and returned as an object
  }
});

// Update NegaiveReviews by name
app.put("/negativeReviews/:name", async (req, res) => {
  try {
    const result = await NegaiveReviews.updateOne(
      { name: req.params.name },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send('No negativeReview found with the given name');
    }
    res.status(200).send({ message: "negativeReview updated successfully", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while updating the negativeReview. Please try again later." });
  }
});

// delete negativeReview by id 
app.delete("/negativeReviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid negativeReview ID format. Please provide a valid 24-character hexadecimal ID." });
    }

    const result = await NegaiveReviews.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "No negativeReview found with the given ID." });
    }

    res.status(200).send({ message: "negativeReview deleted successfully", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while trying to delete the negativeReview. Please try again later." });
  }
});

// register Questionfroms
app.post("/questionForms", async (req, res) => {
  try {
    req.body.merchantInfoId = new mongoose.Types.ObjectId(req.body.merchantInfoId);
    let questionsforms = new Questionforms(req.body);
    let result = await questionsforms.save();
    res.status(201).send(result);
  } catch (error) {
    console.log("Error adding questionforms : ", error);
    res.status(500).send({ error: "An error occurred while adding questionForms. Please try again later." });
  }
});

//get all Questionfroms
app.get("/questionForms", async (req, res) => {
  try {
    let questionform = await Questionforms.find();
    if (questionform.length > 0) {
      res.status(200).send(questionform);
    } else {
      return res.status(404).send({ message: "No Question Forms found." });
    }
  } catch(error) {
    res.status(500).send({ error: "An error occurred while retrieving question forms. Please try again later." });
  }
});

// get single data in Questionfroms by name
app.get("/questionForms/:id", async (req, res) => {
  try {
    let result = await Questionforms.findOne({ _id: req.params.id });
    if (result) {
      res.status(200).send(result);
    } else {
      return res.status(404).send({ message: "No Question Form found with the given ID." });
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving the Question Form. Please try again later." });
  }
})

// Update Questionfroms by id
app.put("/questionForms/:id", async (req, res) => {
  try {
    const result = await Questionforms.updateOne(
      {  _id: req.params.id },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "No Question Form found with the given ID." });
    }
    res.status(200).send({ message: "Question Form updated successfully.", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while updating the Question Form. Please try again later." });
  }
});

// delete Questionfroms by id 
app.delete("/questionForms/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid Question Forms ID format." });
    }

    const result = await Questionforms.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "No Question Form found with the given ID." });
    }

    res.status(200).send({ message: "Question Form deleted successfully.", result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while deleting the Question Form. Please try again later." });
  }
});

// register Aireviews
app.post("/aireviews", async (req, res) => {
  try {
    let aireviews = new AIReviews(req.body);
    let result = await aireviews.save();
    res.status(201).send(result);
  } catch (error) {
    console.error('Error adding AIReview:', error);
    res.status(500).send({ error: "An error occurred while adding AIReview. Please try again later." });
  }
})

// get all records for Aireview Table
app.get("/aireviews", async (req, resp) => {
  try {
    let aiReviews = await AIReviews.find();
    if (aiReviews.length > 0) {
      resp.status(200).send(aiReviews);
    } else {
      resp.status(404).send({ message: "No AI reviews found." });
    }
  } catch (error) {
    resp.status(500).send({ message: "Error retrieving AI reviews.", error: error.message });
  }
});

// Get a single record for AIReview Table
app.get("/aireviews/:id", async (req, resp) => {
  try {
    let result = await AIReviews.findOne({ _id: req.params.id });
    if (result) {
      resp.status(200).send(result);
    } else {
      resp.status(404).send({ message: "No record found with the provided ID." });
    }
  } catch (error) {
    resp.status(500).send({ message: "Error retrieving the record.", error: error.message });
  }
});

// Update aireviews by id
app.put("/aireviews/:id", async (req, res) => {
  try {
    const result = await AIReviews.updateOne(
      {  _id: req.params.id },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "No AI review found with the given ID." });
    }
    res.status(200).send({ message: "AI review updated successfully.", updatedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).send({ message: "An error occurred while updating the AI review.", error: error.message });
  }
});

// Delete AIReview by ID
app.delete("/aireviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid AI Review ID format." });
    }

    const result = await AIReviews.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "No AI review found with the given ID." });
    }

    res.status(200).send({ message: "AI review deleted successfully." });
  } catch (error) {
    res.status(500).send({ message: "An error occurred while deleting the AI review. Please try again later.", error: error.message });
  }
});


// login Api 
app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    try {
      let user = await Users.findOne({ email: req.body.email });
      if (user) {
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (isMatch) {
          const token = Jwt.sign({ user }, jwtkey, { expiresIn: "24h" });
          res.send({ message: "Login Successfull", user, auth: token });
        } else {
          res.status(401).send({ message: "Login Failed : Incorrect Password" });
        }
      } else {
        res.status(404).send({ message: "Login Failed : No User Found" });
      }
    } catch (error) {
      console.log("Error during login: ", error);
      res.status(500).send({ error: "Login Failed: Server Error" });
    }
  } else {
    res.status(400).send({ message: "Login Failed: Missing Email or Password" });
  }
});

// verify Token
function verifyToken(req, res, next) {
  let token = req.headers['authorization'];
  console.log(token);
  if (token) {
    token = token.split(" ")[1];
    console.warn("middleware called : ", token);
    Jwt.verify(token, jwtkey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "Please provide valid token with header" });
      } else {
        next();
      }
    })
  } else {
    res.status(403).send({ result: "Please add token with header" });
  }
}

// Function to send OTP
const sendOtp = async (mobileNumber, otp) => {
  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&message=Your OTP is ${otp}&sender_id=FSTSMS&language=english&route=p&numbers=${mobileNumber}`;

  try {
      const response = await axios.get(url);
      return response.data;
  } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
  }
};

// Route to send OTP
app.post('/send-otp', async (req, res) => {
  const { mobileNumber } = req.body;
  console.log(`Received mobileNumber: ${mobileNumber}`); // Log the received mobileNumber
  const otp = Math.floor(100000 + Math.random() * 900000); 

  try {
      await sendOtp(mobileNumber, otp);
      otpStore[mobileNumber] = otp; 
      console.log('Stored OTPs:', otpStore);
      res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
      res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { mobileNumber, otp } = req.body;

  console.log(`Verifying OTP for ${mobileNumber} : Received OTP = ${otp} Stored OTP = ${otpStore[mobileNumber]}`);

  if (otpStore[mobileNumber] && otpStore[mobileNumber] === otp) {
      delete otpStore[mobileNumber];
      return res.status(200).json({ message: 'OTP verified successfully!' });
  }
  res.status(400).json({ message: 'Invalid OTP.' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`); 
});

// Base Url
// test.postAIreview.com  