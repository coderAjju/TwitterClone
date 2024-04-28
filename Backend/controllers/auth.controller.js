import User from '../models/user.model.js'
import bcrypt from "bcryptjs";
import generateTokenAndSetCookies from "../lib/utils/generateToken.js";

export const signup = async (req,res)=>{
    try {
        const {fullname,username,password,email} = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if(!emailRegex.test(email)){
            return res.status(400).json({
                message:"invalid email"
            })
        }
            
        const existingUser = await User.findOne({ username})
        if(existingUser){
            return res.status(400).json({
                message:"user is already exists"
            })
        }

        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({
                message:"Email is already exists"
            })
        }

        // hash password

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new User({
            fullname,
            username,
            email,
            password:hashedPassword
        })

        if(newUser){
            generateTokenAndSetCookies(newUser.id,res);
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                fullname:newUser.fullname,
                username:newUser.username,
                email:newUser.email,
                followers:newUser.followers,
                following:newUser.following,
                profileImg:newUser.profileImg,
                coverImg:newUser.coverImg,
            })
        }else{
            res.status(400).json({error:"invalid user data"})
        }

    } catch (error) {
       console.log("Error in signup controller",error.message);
        res.status(500).json({error:"internal server error"});
    } 
}

export const login = async (req,res)=>{
    try{
        const {username,password} = req.body;
        const user = await User.findOne({username});
        const isPassword = await bcrypt.compare(password, user?.password || "");
        console.log("hello")
        if(!user || !isPassword){
            return res.status(400).json({
                message:"invalid username or password"
            })
        }
        generateTokenAndSetCookies(user._id,res);

        res.status(200).json({
            _id:user._id,
            fullname:user.fullname,
            username:user.username,
            email:user.email,
            followers:user.followers,
            following:user.following,
            profileImg:user.profileImg,
            coverImg:user.coverImg,
        });

    }catch (error) {
        console.log("Error in login controller",error.message);
        res.status(500).json({error:"internal server error"});
    } 
}

export const logout = async (req,res)=>{
    try {
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({
            message:"logged out successfully"
        })
    } catch (error) {
        console.log("Error in logout controller",error.message);
        res.status(500).json({error:"internal server error"});
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password")
        res.status(200).json(user);
    } catch (error) {
        console.log("error in getme controller",error.message);
        res.status(500).json({error:"internal server error"});
    }
};