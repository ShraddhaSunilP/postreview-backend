const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require("dotenv").config();
require("./db");
const axios = require("axios");
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const multer = require('multer');
const storage = multer.memoryStorage(); // Use memory storage for file upload
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
});
//const upload = multer({ storage: storage }); // Define the upload middleware
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require("nodemailer");

const Jwt = require("jsonwebtoken");
const jwtkey = process.env.JWT_KEY;

const Users = require("../model/users");
const BusinessCategorys = require("../model/businesscategorys");
const NegativeReviews = require("../model/negativereviews"); 
const MerchantsInfo = require("../model/merchantsinfos");
const Questionforms = require("../model/questionforms");
const AIReviews = require("../model/aireviews");
const Supports = require("../model/supports");
const app = express();

app.use(express.json());

// Increase header size limit
//app.use(express.json({ limit: "1mb" }));
app.use(cors());

// In-memory storage for OTPs (use a database in production)
let otpStore = {};

// Signup Users and Send Email with Bcrypted ID
app.post("/registerUser", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }

    // Check if the email is already registered and active
    const existingMerchant = await MerchantsInfo.findOne({ email });
    if (existingMerchant && existingMerchant.isActive) {
      return res
        .status(400)
        .send({ message: "Email address is already registered and active." });
    }

    // If email is registered but isActive is false, resend the activation link
    if (existingMerchant && !existingMerchant.isActive) {
      // Hash the ID using bcrypt
      const saltRounds = 10;
      const hashedId = await bcrypt.hash(existingMerchant._id.toString(), saltRounds);

      // Encode the hashedId to make it URL-safe
      const encodedHashedId = encodeURIComponent(hashedId);

      // Create the updated activation link
      //const activationLink = `https://test.postaireview.com/set-password?id=${encodedHashedId}`;
      const activationLink = `http://localhost:5000/set-password?id=${encodedHashedId}`;
      // Save the updated activation link in the database
      existingMerchant.activationLink = activationLink;
      await existingMerchant.save();
      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@test.postaireview.com",
          pass: "Test$upport@123",
        },
      });
     // Compose the email
      const mailOptions = {
        from: "support@test.postaireview.com",
        to: email,
        subject: "Activate Your Account - Updated Link",
        html: `<p>Your account is registered, but not activated. Please activate your account by clicking the following link:</p><a href="${activationLink}">Activate Account</a>`,
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error Sending Email:", error);
          return res.status(500).send({ error: "Email could not be sent" });
        }
        console.log("Email Sent:", info.response);

        // Set up a timeout to remove the activation link after 24 hours
        setTimeout(async () => {
          try {
            await MerchantsInfo.findByIdAndUpdate(existingMerchant._id, { $unset: { activationLink: "" } });
            console.log(`Activation link for ${email} has expired and been removed.`);
          } catch (error) {
            console.error("Error Removing Activation Link:", error);
          }
        }, 24 * 60 * 60 * 1000); // 24 hours

        res.status(200).send({
          message: "Updated activation email sent successfully.",
          data: { email: existingMerchant.email, activationLink },
        });
      });
    } else {
      // Create a new document with email if no existing merchant is found
      const newMerchant = new MerchantsInfo({ email });
      const result = await newMerchant.save();

      // Hash the ID using bcrypt
      const saltRounds = 10;
      const hashedId = await bcrypt.hash(result._id.toString(), saltRounds);

      // Encode the hashedId to make it URL-safe
      const encodedHashedId = encodeURIComponent(hashedId);

      // Create the activation link
        //const activationLink = `https://test.postaireview.com/set-password?id=${encodedHashedId}`;
        const activationLink = `http://localhost:5000/set-password?id=${encodedHashedId}`;
      // Save the activation link in the database
      try {
        result.activationLink = activationLink;
        await result.save(); // Explicitly save the updated document
        console.log("Activation Link Saved Successfully:", result.activationLink);
      } catch (error) {
        console.error("Error Saving Activation Link:", error);
      }

      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@test.postaireview.com",
          pass: "Test$upport@123",
        },
      });

      // Compose the email
      const mailOptions = {
        from: "support@test.postaireview.com",
        to: email,
        subject: "Activate Your Account",
        html: `<p>Please activate your account by clicking the following link:</p><a href="${activationLink}">Activate Account</a>`,
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error Sending Email:", error);
          return res.status(500).send({ error: "Email could not be sent" });
        }
        console.log("Email Sent:", info.response);

        // Set up a timeout to remove the activation link after 24 hours
        setTimeout(async () => {
          try {
            await MerchantsInfo.findByIdAndUpdate(result._id, { $unset: { activationLink: "" } });
            console.log(`Activation link for ${email} has expired and been removed.`);
          } catch (error) {
            console.error("Error Removing Activation Link:", error);
          }
        }, 24 * 60 * 60 * 1000); // 24 hours

        res.status(201).send({
          message: "User registered successfully and activation email sent!",
          data: { email: result.email, activationLink: result.activationLink },
        });
      });
    }
  } catch (error) {
    console.error("Error Registering Merchant:", error);
    res.status(500).send({ error: "Error registering Merchant" });
  }
});


// Set Password with activationLinkId
app.put("/setPassword/:activationLinkId", async (req, res) => {
  try {
    const { password } = req.body;
    const { activationLinkId } = req.params;

    if (!password) {
      return res.status(400).send({ error: "New password is required" });
    }

    const decodedHashedId = decodeURIComponent(activationLinkId);
    const merchants = await MerchantsInfo.find({ activationLink: { $exists: true } });

    let matchedMerchant = null;
    for (const merchant of merchants) {
      const isMatch = await bcrypt.compare(merchant._id.toString(), decodedHashedId);
      if (isMatch) {
        matchedMerchant = merchant;
        break;
      }
    }

    if (!matchedMerchant) {
      return res.status(404).send({ error: "Invalid or expired activation link" });
    }

    // Check if the account is already activated
    if (matchedMerchant.isActive) {  
      return res.status(400).send({ error: "Account already activated. You cannot set the password again." });
    }

    // Check if the activation link is expired
    if (matchedMerchant.expiresAt < Date.now()) {
      return res.status(400).send({ error: "Activation link has expired." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and set isActive to true
    await MerchantsInfo.updateOne(
      { _id: matchedMerchant._id },
      {
        $set: {
          password: hashedPassword,
          isActive: true, // Set isActive to true when the password is reset
        },
      }
    );

    res.status(200).send({ message: "Password set successfully. Account activated." });
  } catch (error) {
    console.error("Error resetting password: ", error);
    res.status(500).send({ error: "An error occurred while setting the password." });
  }
});


// Forgot password API for Activation Link
app.post("/forgetPassword", async (req, res) => {
  const { email } = req.body;

  try {
    // Find merchant by email in MerchantsInfo collection
    const merchant = await MerchantsInfo.findOne({ email });

    // Check if merchant exists and is active
    if (!merchant || !merchant.isActive) {
      return res.status(400).json({ message: 'Email not found or merchant is inactive' });
    }

    // Hash the merchant ID
    const saltRounds = 10;
    const hashedId = await bcrypt.hash(merchant._id.toString(), saltRounds);

    // Encode the hashedId to make it URL-safe
    const encodedHashedId = encodeURIComponent(hashedId);

    // Create the activation link
    //const activationLink =`https://test.postaireview.com/reset-password?id=${encodedHashedId}`;
    const activationLink = `http://localhost:5000/reset-password?id=${encodedHashedId}`;
    // Save the activation link in the database (optional)
    merchant.activationLink = activationLink;
    await merchant.save();

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@test.postaireview.com",
        pass: "Test$upport@123",
      },
    });

    // Send the activation email
    await transporter.sendMail({
      from: '"Postaireview Support" <support@test.postaireview.com>',
      to: email,
      subject: "Set Your New Password",
      text: `Please click the following link and set a new password: ${activationLink}`,
    });

    res.status(200).json({ message: 'Activation link sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


// Reset Password with activationLinkId
app.put("/resetPassword/:activationLinkId", async (req, res) => {
  try {
    const { newpassword } = req.body; // Only one field in the payload
    const { activationLinkId } = req.params;

    if (!newpassword) {
      return res.status(400).send({ error: "New password is required" });
    }

    // Decode the activationLinkId from the URL
    const decodedHashedId = decodeURIComponent(activationLinkId);

    // Find merchants with an activation link that exists
    const merchants = await MerchantsInfo.find({ activationLink: { $exists: true } });

    let matchedMerchant = null;

    // Compare the decoded hashed ID with merchant IDs
    for (const merchant of merchants) {
      const isMatch = await bcrypt.compare(merchant._id.toString(), decodedHashedId);
      if (isMatch) {
        matchedMerchant = merchant;
        break;
      }
    }

    if (!matchedMerchant) {
      return res.status(404).send({ error: "Invalid or expired activation link" });
    }

    // Check if the activation link is expired
    if (matchedMerchant.expiresAt && matchedMerchant.expiresAt < Date.now()) {
      return res.status(400).send({ error: "Activation link has expired." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    // Update the merchant's password and set the account as active
    await MerchantsInfo.updateOne(
      { _id: matchedMerchant._id },
      {
        $set: {
          password: hashedPassword,
          isActive: true, // Activate the account upon successful password reset
        }
      }
    );

    res.status(200).send({ message: "Password reset successfully. Account activated." });
  } catch (error) {
    console.error("Error resetting password: ", error);
    res.status(500).send({ error: "An error occurred while resetting the password." });
  }
});


app.get("/api/getData/:businessname", async (req, res) => { 
  try {
    const { businessname } = req.params;
    console.log("Incoming request for businessname:", businessname);

    // Validate input
    if (!businessname) {
      return res.status(400).json({ error: "businessname is required" });
    }

    // Fetch specific fields from MerchantsInfo
    const merchantData = await MerchantsInfo.findOne(
      { businessname: new RegExp(`^${businessname}$`, "i") }, // Case-insensitive match
      "logo businessname businessCategory themeColor textColor googlereviewURL question_id"
    );
    console.log("merchantData:", merchantData);

    if (!merchantData) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    // Fetch specific fields from QuestionsForm and ensure IDs match
    const questionData = await Questionforms.findOne(
      { _id: merchantData.question_id }, // Match IDs
      "_id question1 question1Keywords question2 question2Keywords"
    );
    console.log("questionData:", questionData);

    if (!questionData) {
      return res.status(404).json({ error: "Question form not found" });
    }

    // Return combined data if all checks pass
    res.json({
      MerchantsTable: {
        logo: merchantData.logo,
        businessname: merchantData.businessname,
        businessCategory: merchantData.businessCategory,
        themeColor: merchantData.themeColor,
        textColor: merchantData.textColor,
        googlereviewURL: merchantData.googlereviewURL,
        question_id: merchantData.question_id,
      },
      QuestionTable: {
        _id: questionData._id,
        question1: questionData.question1,
        question1Keywords: questionData.question1Keywords,
        question2: questionData.question2,
        question2Keywords: questionData.question2Keywords,
      },
    });
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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

//Get single merchantsInfo by businessname or email
app.get("/merchantsinfos/:businessNameOrEmail", async (req, res) => {
  try {
    // let result = await MerchantsInfo.findOne({ businessname: req.params.businessNameOrEmail || email: req.params.businessNameOrEmail });
    let result = await MerchantsInfo.findOne({
      $or: [
        { businessname: req.params.businessNameOrEmail },
        { email: req.params.businessNameOrEmail }
      ]
    });
    if (result) {
      console.log(result._id);
      res.status(200).send(result);
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

// Update merchantinfo by email // Added by rohit
/*app.put("/merchantsinfosByEmail/:email", async (req, res) => {
  try {
    const result = await MerchantsInfo.updateOne(
      { email: req.params.email }, // Match by _id
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "No merchant info found with the given Id." });
    }
    res.status(200).send({ message: "Merchant info updated successfully", data: result });
  } catch (error) {
    res.status(500).send({ error: "An error occurred while updating merchant info." });
  }
});

// Update merchant info by email
app.put("/merchantsinfosByEmail/:email", upload.none(), async (req, res) => {
  try {
    const updateData = req.body;

    const result = await MerchantsInfo.updateOne(
      { email: req.params.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .send({ message: "No merchant info found with the given email." });
    }

    res.status(200).send({
      message: "Merchant info updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating merchant info:", error);
    res.status(500).send({
      error: "An error occurred while updating merchant info.",
    });
  }
});
*/
//const upload = multer({
  //storage: multer.memoryStorage(), // Store files in memory

//});

app.put("/merchantsinfosByEmail/:email", upload.single("logo"), async (req, res) => {
    try {
      const updateData = { ...req.body };

      // If a file is uploaded, add it to the updateData
      if (req.file) {
        updateData.logo = req.file.buffer; // Assuming you're storing files as binary data
      }

      const result = await MerchantsInfo.updateOne(
        { email: req.params.email },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .send({ message: "No merchant info found with the given email." });
      }

      res.status(200).send({
        message: "Merchant info updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error updating merchant info:", error);
      res.status(500).send({
        error: "An error occurred while updating merchant info.",
      });
    }
  }
);

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
    let negaiveReviews = new NegativeReviews(req.body);
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
    let negativeReviews = await NegativeReviews.find();
    if (negativeReviews.length > 0) {
      res.status(200).send(negativeReviews);
    } else {
      res.status(404).send({ message: "No Records Found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Error getting negative reviews" }); // Corrected spelling
  }
});


// get single data in NegaiveReviews by merchantInfoId
app.get("/negativeReviews/:merchantInfoId", async (req, res) => {
  try {
    const result = await NegativeReviews.findOne({ merchantInfoId: req.params.merchantInfoId });
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send({ result: "No Record Found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
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

    const result = await NegativeReviews.deleteOne({ _id: id });

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
    // Convert `merchantInfoId` to ObjectId for consistency
    req.body.merchantInfoId = new mongoose.Types.ObjectId(req.body.merchantInfoId);

    // Check if the merchant exists
    const merchant = await MerchantsInfo.findById(req.body.merchantInfoId);
    if (!merchant) {
      return res.status(404).send({ error: "Merchant not found" });
    }

    // Create and save the new question form
    const questionsForm = new Questionforms(req.body);
    const savedQuestionForm = await questionsForm.save();

    // Update the merchant's `question_id` field with the new question form's ObjectId
    merchant.question_id = savedQuestionForm._id;
    await merchant.save();

    // Send response
    res.status(201).send({
      message: "Question form created successfully and linked to merchant",
      questionForm: savedQuestionForm,
    });
  } catch (error) {
    console.error("Error adding question forms:", error);
    res.status(500).send({
      error: "An error occurred while adding question forms. Please try again later.",
    });
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

// get single data in Questionfroms by merchantinfoid
app.get("/questionForms/:merchantInfoId", async (req, res) => {
  try {
    const result = await Questionforms.findOne({ merchantInfoId: req.params.merchantInfoId });
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send({ result: "No Question Form found with the given merchantInfoId" });
    }
  } catch (error) {
    res.status(500).send({ error: "An error occurred while retrieving the Question Form. Please try again later." });
  }
});


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
      let merchantsInfo = await MerchantsInfo.findOne({ email: req.body.email });
      if (merchantsInfo) {
        const isMatch = await bcrypt.compare(req.body.password, merchantsInfo.password);
        if (isMatch) {
	  let email = req.body.email;
          const token = Jwt.sign({ email }, jwtkey, { expiresIn: "24h" });
          res.status(200).send({ message: "Login Successfull", merchantsInfo, auth: token });
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

// verify token Api 
app.post("/verifytoken",verifyToken, async (req, res) => {
res.status(200).send({ message: "Success" });
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

//register support data : email, subject and description
app.post("/support", async (req, res) => {
  try {
    let support = new Supports(req.body);
    let result = await support.save();

    // Set up the Nodemailer transport
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@test.postaireview.com", // Your email
        pass: "Test$upport@123", // Your email password or app password
      },
    });

    // Email options
    const mailOptions = {
      from: "support@test.postaireview.com",
      to: req.body.email, 
      subject: "Support Request Received",
      text: `Hi, we have received your support request. Our team will contact you soon.`, // Plain text body
      html: `<p>Hi,</p><p>We have received your support request. Our team will contact you soon.</p>`, // HTML body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(201).send({ message: "Support added and email sent successfully.", result });
  } catch (error) {
    console.error("Error adding support:", error);
    res
      .status(500)
      .send({
        error: "An error occurred while adding support and sending email. Please try again later.",
      });
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://${process.env.HOST || '88.222.213.199'}:${PORT}`);
});


// Base Url
// test.postAIreview.com 