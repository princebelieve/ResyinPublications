//server/src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { google } = require("googleapis");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const {
  sendResetPasswordEmail,
  sendPasswordResetSuccessEmail,
  sendEmailVerification,
} = require("../services/email");
const RefreshToken = require("../models/RefreshToken");

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase());

// ----------------------
// EMAIL HELPERS
// ----------------------
const createEmailVerificationToken = () =>
  crypto.randomBytes(32).toString("hex");

const getClientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

const sendVerificationLink = async ({ email, token }) => {
  const clientUrl = getClientUrl();
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

  // Log verification URL for local debugging (useful if SMTP not configured)
  console.log(`Verification link for ${email}: ${verificationUrl}`);

  try {
    await sendEmailVerification({ to: email, verificationUrl });
    return true;
  } catch (err) {
    console.warn(
      `Failed to send verification email to ${email}: ${err?.message || err}`,
    );
    // Do not throw here; token is persisted and user can request resend
    return false;
  }
};

// 🟢 REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!String(name || "").trim() || !String(email || "").trim() || !String(password || "")) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = createEmailVerificationToken();
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: adminEmails.includes(normalizedEmail) ? "admin" : "user",
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    const verificationEmailSent = await sendVerificationLink({
      email: user.email,
      token: emailVerificationToken,
    });

    return res.status(201).json({
      message:
        "Account created. Check your email and verify your address before logging in.",
      verificationEmailSent,
    });
  } catch (err) {
    console.error(err);

    if (err?.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      return res.status(400).json({
        message: duplicateField === "email" ? "User already exists" : "Unable to create this account. Please try again.",
      });
    }

    res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

// 🔵 LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isDeleted) {
      return res.status(410).json({ message: "This account has been permanently deleted." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "This account is suspended. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Allow legacy users created before email verification existed
    if (user.emailVerified === false && user.emailVerificationToken) {
      return res.status(403).json({
        message:
          "Please verify your email address before signing in. Check your inbox.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google token is required." });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res
        .status(500)
        .json({ message: "Google sign-in is not configured on the server." });
    }

    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
      return res
        .status(400)
        .json({ message: "Please use a verified Google account." });
    }

    const normalizedEmail = String(payload.email || "").toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user?.isDeleted) {
      return res.status(410).json({ message: "This account has been permanently deleted." });
    }

    if (user?.isSuspended) {
      return res.status(403).json({ message: "This account is suspended. Please contact support." });
    }

    if (!user) {
      const password = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name: payload.name || normalizedEmail,
        email: normalizedEmail,
        password: hashedPassword,
        role: adminEmails.includes(normalizedEmail) ? "admin" : "user",
        emailVerified: true,
      });
    } else if (!user.emailVerified) {
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err?.message || "Google sign-in failed. Please try again.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = Date.now() + 3600 * 1000;

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")[0]
      .trim();
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    try {
      await sendResetPasswordEmail({
        to: user.email,
        resetUrl,
      });
    } catch (emailError) {
      console.error(
        "Password reset email could not be sent:",
        emailError?.message || emailError,
      );
      return res.status(500).json({
        message: "Unable to send password reset email. Please try again later.",
      });
    }

    return res.json({
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Invalid password reset request." });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    try {
      await sendPasswordResetSuccessEmail({ to: user.email });
    } catch (emailError) {
      console.warn(
        "Password reset success email could not be sent:",
        emailError?.message || emailError,
      );
    }

    res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const jwt = require("jsonwebtoken");

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required." });
    }

    let user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (user) {
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return res.json({ message: "Email verified successfully." });
    }

    user = await User.findOne({
      pendingEmailVerificationToken: token,
      pendingEmailVerificationExpires: { $gt: Date.now() },
    });

    if (user) {
      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
      user.pendingEmailVerificationToken = undefined;
      user.pendingEmailVerificationExpires = undefined;
      user.emailVerified = true;
      await user.save();

      return res.json({ message: "Your new email address has been verified." });
    }

    return res
      .status(400)
      .json({ message: "Verification token is invalid or expired." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        message: "If the account exists, a verification email has been sent.",
      });
    }

    let token;
    let verificationEmail;

    if (user.pendingEmail) {
      token =
        user.pendingEmailVerificationToken || createEmailVerificationToken();
      user.pendingEmailVerificationToken = token;
      user.pendingEmailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
      verificationEmail = user.pendingEmail;
    } else if (!user.emailVerified) {
      token = user.emailVerificationToken || createEmailVerificationToken();
      user.emailVerificationToken = token;
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
      verificationEmail = user.email;
    }

    if (token) {
      await user.save();
      await sendVerificationLink({
        email: verificationEmail,
        token,
      });
    }

    return res.json({
      message: "If the account exists, a verification email has been sent.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        message: "Refresh token required",
      });
    }

    // VERIFY JWT
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // CHECK TOKEN EXISTS IN DB
    const existingToken = await RefreshToken.findOne({
      token,
    });

    if (!existingToken) {
      return res.status(401).json({
        message: "Refresh token not recognized",
      });
    }

    // FIND USER
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // DELETE OLD TOKEN (ROTATION)
    await RefreshToken.deleteOne({
      _id: existingToken._id,
    });

    // CREATE NEW TOKENS
    const newAccessToken = generateAccessToken(user);

    const newRefreshToken = generateRefreshToken(user);

    // SAVE NEW REFRESH TOKEN
    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};

// 🟢 CHANGE PASSWORD (authenticated users)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to change password",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleSignIn,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
};
