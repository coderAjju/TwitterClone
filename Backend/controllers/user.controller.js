import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getUserProfile = async (req,res)=>{
    const {username} = req.params;
    try {
        const user = await User.findOne({username}).select("-password");
        if(!user) return res.status(404).json({error:"user not found"});

        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile: ",error.message);
        res.status(500).json({error:error.message});
    }
}

export const followUnfollowUser = async (req,res)=>{
    try {
        const {id} = req.params;
        const FollowerKiId = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if(id === req.user._id.toString()){
            return res.status(400).json({error:"you cannot follow yourself"});
        }
        if(!FollowerKiId || !currentUser){
            return res.status(404).json({error:"user not found"});
        }
        const isFollowing = currentUser.following.includes(id);
        if(isFollowing){
            // unfollow the user
            await User.findByIdAndUpdate(id,{$pull: {followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$pull:{following:id}});
            res.status(200).json({message: "User unfollowed successfully"});
        }
        else{
            // follow the user
            await User.findByIdAndUpdate(id,{$push: {followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$push:{following:id}});

            // follow successfull notification
            const newNotification = new Notification({
                enum:"follow",
                from:req.user._id,
                to:FollowerKiId._id,
            });
            await newNotification.save();
            res.status(200).json({message:"Uesr followed successfully"})
        }
    } catch (error) {
        console.log("Error in followUnfollowUser: ",error.message);
        res.status(500).json({error:error.message});
    }
}

export const getSuggestedUser = async (req,res)=>{
    try {
        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match:{
                    _id:{ $ne:userId },
                },
            },
            {
                $sample:{ size:10 },
            }
        ]);

        const filteredUsers = users.filter((user)=> !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0,4);
        suggestedUsers.forEach((user)=> {user.password = null});

        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.log("Error in getSuggestedUser ",error.message);
        res.status(500).json({error:error.message});
    }
}

export const updateUser = async (req,res) => {
    try {
        const {username,fullname,email,currentPassword,newPassword,bio,link} = req.body;
        let {profileImg,coverImg} = req.body;
        const userId = req.user._id; // current use id 
        
        let user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({error:"user not found"});
        }
        
        if((!newPassword && currentPassword)||(newPassword && !currentPassword)){
            return res.status(404).json(error," please provide both currentPassword and newPassword")
        }

        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword,user.password);
            if(!isMatch){
                return res.status(400).json({error:"current password is incorrect"});
            }
            if(newPassword.length < 6){
                return res.status(400).json({error:"new password must be atleast 6 characters long"});
            }

            let salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword,salt);
        }

        if(profileImg){
            if(user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split("."));
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }
        if(coverImg){
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        user.fullname = fullname || user.fullname;
        user.username = username || user.username;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;
        user = await user.save();

        // password should be null in response
        user.password = null;
        return res.status(200).json(user);
    } catch (error) {
        console.log("Error in updateUser: ",error.message);
        res.status(500).json({error:error.message});
    }
}