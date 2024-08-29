import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenSetCookie.js";
import {
  SendRecentSuccessEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }
    const existingUser = await User.findOne({ email }); //find the email
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }

    //hash password via bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    //verification code
    const verificationToken = generateVerificationCode();
    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await user.save();

    //client side auth via jwt, then send verification email
    generateTokenAndSetCookie(res, user._id);

    //send verification email to the user
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// This function handles the email verification process.
// It receives a request and a response object from the Express API.

export const verifyEmail = async (req, res) => {
  // The verification code is extracted from the request body.
  const { code } = req.body;

  try {
    // The code is used to find a user in the database with a matching verification token and a non-expired verification deadline.
    const user = await User.findOne({
      verificationToken: code,
      verificationExpiresAt: { $gt: Date.now() },
    });

    // If no matching user is found, an error message is sent back to the client.
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    // If user is found, their isVerified status is set to true, and the verification token and expiration date are removed.
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpiresAt = undefined;

    // The edited user is saved to the database.
    await user.save();

    // A welcome email is sent to the user's email address.
    await sendWelcomeEmail(user.email, user.name);

    // A success message is sent back to the client.
    res
      .status(200)
      .json({ success: true, message: "Email verification successful" });
  } catch (error) {
    // If there is an error during the process, an error message is sent back to the client.
    res.status(400).json({ message: error.message, success: false });
  }
};

// This function is responsible for handling the login process.
// It receives a request and a response object from the Express API.

export const login = async (req, res) => {
  // The user's email and password are extracted from the HTTP request body.
  const { email, password } = req.body;

  try {
    // The user with the given email is searched in the database.
    const user = await User.findOne({ email });

    // If no user is found, an error message is sent back to the client.
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // The given password is compared with the user's hashed password.
    const isValidPassword = await bcrypt.compare(password, user.password);

    // the passwords don't match, an error message is sent back to the client.
    if (!isValidPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    // If the email and password are valid, a token is generated for the user and stored as a cookie.
    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();

    // A success message along with information about the user is sent back to the client.
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,

        // The user's password is removed from the response for security purposes.
        password: undefined,
      },
    });
  } catch (error) {
    // If an error occurs, it is logged and thrown as an exception.
    console.log(error);
    console.log("Error in login ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token"); //must be the same name as the one used in res.cookie (name of the cookie)
  res.status(200).json({ success: true, message: "logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    //generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; //now 1hr for safety purpose

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();
    await sendResetPasswordEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );
    res.status(200).json({
      success: true,
      message: "Reset password link sent to your email",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Error occured! Please try again later",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // reset-password/:token. The param token = destructured token
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() }, //$gt means greater than
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    //update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    await SendRecentSuccessEmail(user.email);
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      user: {
        ...user._doc,
        password: undefined, // remove password from response
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
