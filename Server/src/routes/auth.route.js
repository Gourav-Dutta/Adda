import {Router} from "express";
// import { handleSignUpFunction,handleLoginFunction  } from "../../Controller/auth.controller.js";
// import {handleSignUpFunction, handleLoginFunction} from "../Controller/auth.controller.js";
import * as authController from "../Controller/auth.controller.js";
import {authMiddleware} from "../middleware/auth.middleware.js"



const route = Router();


route.post("/signup", authController.handleSignUpFunction);
route.post("/login", authController.handleLoginFunction);
route.post("/refresh-token", authController.rotationRefreshTokenFunction);
route.post("/logout", authController.handleLogoutFunction);
route.post("/allLogout", authMiddleware, authController.handleAllLogoutFunction);
route.post("/verify-otp", authController.handleVerifyOtpFunction);


export {route as authRoute};


