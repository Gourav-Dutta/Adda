import { prisma } from "../utils/db.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "../service/email.js";
import crypto from "node:crypto";

import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../service/auth.js";

const COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: REFRESH_TOKEN_MAX_AGE,
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

const userSignUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phone: z.string().min(10, "Phone number must be at least 10 characters long"),
});

async function handleSignUp(req, res) {
  try {
    const body = userSignUpSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { name: body.name }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        phone_no: body.phone,
        isVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_no: true,
        // role: true,
        created_at: true,
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otp.upsert({
      where: { email: body.email },
      update: {
        user_id: user.id,
        otp_code: hashedOtp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // Valid for 10 mins
      },
      create: {
        user_id: user.id,
        email: body.email,
        otp_code: hashedOtp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(body.email, otp);
    console.log("Otp send successfully");

    return res.status(201).json({
      message: "User created successfully. Please Check your email for the verification code.",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: error.issues,
      });
    }

    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});


const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});

async function handleVerifyOtp(req, res) {
    try {
        const { email, otp } = verifyOtpSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Account is already verified" });
        }

        const otpRecord = await prisma.otp.findUnique({
            where: { email },
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "No OTP request found for this email" });
        }

        if (otpRecord.expires_at < new Date()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otp_code);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP code" });
        }

        // Mark user as verified and delete the used OTP record
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            }),
            prisma.otp.delete({
                where: { email },
            }),
        ]);

        return res.status(200).json({
            message: "Email verified successfully. You can now log in.",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: error.issues,
            });
        }

        console.error("Verify OTP error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleLogin(req, res) {
  try {
    const body = userLoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if(!user.isVerified){
        return res.status(403).json({
            message: "Account is not verified. Please verify your email before logging in.",
        })
    };

    const passwordMatches = await bcrypt.compare(body.password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await prisma.session.create({
      data: {
        user_id: user.id,
        refresh_token: refreshTokenHash,
        ip_address: req.ip,
        user_agent: req.get("user-agent") || "unknown",
        revoked: false,
      },
    });

    const accessToken = generateAccessToken(user, session.id);

    res.cookie(COOKIE_NAME, refreshToken, refreshCookieOptions);

    // res.cookie("refreshToken", refreshToken,
    //     {
    //         httpOnly: true,
    //         sameSite: "strict",
    //         secure: true,
    //         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    //     }
    //  );

    const { password: _password, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: userWithoutPassword,
      session: session,
      refresh: refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: error.issues,
      });
    }

    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// Request only come when user is logged in and has a valid refresh token.
async function rotationRefreshToken(req, res) {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await prisma.session.findFirst({
      where: {
        refresh_token: refreshTokenHash,
        revoked: false,
      },
    });

    if (!session) {
      res.clearCookie(COOKIE_NAME, clearRefreshCookieOptions);

      return res.status(401).json({
        message: "Invalid or revoked refresh token",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user_id,
      },
    });

    if (!user) {
      res.clearCookie(COOKIE_NAME, clearRefreshCookieOptions);

      return res.status(401).json({
        message: "User not found",
      });
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    const rotation = await prisma.session.updateMany({
      where: {
        id: session.id,
        refresh_token: refreshTokenHash,
        revoked: false,
      },
      data: {
        refresh_token: newRefreshTokenHash,
      },
    });

    console.log(rotation);
    if (rotation.count !== 1) {
      res.clearCookie(COOKIE_NAME, clearRefreshCookieOptions);

      return res.status(401).json({
        message: "Refresh token has already been used",
      });
    }

    const accessToken = generateAccessToken(user, session.id);

    res.cookie(COOKIE_NAME, newRefreshToken, refreshCookieOptions);

    return res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
      session: session,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function handleLogout(req, res) {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
      res.clearCookie(COOKIE_NAME, clearRefreshCookieOptions);

      return res.status(200).json({
        message: "Logged out successfully",
      });
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const data = await prisma.session.updateMany({
      where: {
        refresh_token: refreshTokenHash,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    res.clearCookie(COOKIE_NAME, clearRefreshCookieOptions);

    return res.status(200).json({
      message: "Logged out successfully",
      session: data,
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function handleLAllogout(req, res) {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
      // res.clearCookie(COOKIE_NAME, clearRefreshCookieOptions);

      return res.status(200).json({
        message: "Refresh Token not found",
      });
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const data = await prisma.session.findMany({
      where: {
        refresh_token: refreshTokenHash,
        revoked: false,
      },
    });

    if (!data) {
      return res.status(404).json({
        msg: "User either not't exists or already logout",
      });
    }

    const user = req.user;
    console.log(user);
    const updatedSessions = await prisma.session.updateMany({
      where: {
        user_id: user.id,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    if (updatedSessions.count == 0) {
      return res.status(400).json({
        msg: "Refresh token has already been used",
      });
    }

    return res.status(200).json({
      msg: "User logout from all devices successfull",
      data: updatedSessions,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "An server error occured",
      error: error.message,
    });
  }
}

export {
  handleSignUp as handleSignUpFunction,
  handleLogin as handleLoginFunction,
  rotationRefreshToken as rotationRefreshTokenFunction,
  handleLogout as handleLogoutFunction,
  handleLAllogout as handleAllLogoutFunction,
  handleVerifyOtp as handleVerifyOtpFunction,
};
