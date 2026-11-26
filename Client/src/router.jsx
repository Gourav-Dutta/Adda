import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Dashboard from "./views/Dashboard";
import SignUpPage from "./views/Signup";
import VerifyOtpPage from "./views/VerifyOtpPage";




const router = createBrowserRouter([
    {
        path: "/",
        element: <Dashboard/>
    },
    {
        path: "/signup",
        element: <SignUpPage/>
    },
    {
        path: "/verify-otp",
        element: <VerifyOtpPage/>
    }
])


export default router;