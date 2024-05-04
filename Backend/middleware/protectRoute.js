import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'

//this middleware function is used to protect routes that require authentication. It verifies the JWT token and checks if the user exists in the database before allowing access to the protected route.

export const protectRoute = async (req,res,next) => {
    try {
        const token = req.cookies.jwt;
        if(!token) {
            return res.status(401).json({
                message:"Unauthorized: No token provided"
            })
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded) {
            return res.status(401).json({
                message:"Unauthorized: Invalid token"
            })
        }

        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(401).json({
                message:"Unauthorized: User not found"
            })
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware",error.message);
        res.status(500).json({error:"internal server error"});
    }
}