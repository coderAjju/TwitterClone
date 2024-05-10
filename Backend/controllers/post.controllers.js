import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from 'cloudinary';
import Notification from '../models/notification.model.js'

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ messgae: "user not found" })
        }
        if (!text && !img) {
            return res.status(400).json({ message: "Post must have text and image" })
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img)
            img = uploadedResponse.secure_url;
        }

        const newPost = await Post.create({
            text,
            img,
            user: userId
        })

        await newPost.save();
        res.status(201).json(newPost)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
        console.log("Error in create post controller: ", error);
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "post not found" })
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: 'you are not authorized to delete this post' })
        }
        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId)
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "post deleted successfully" })
    } catch (error) {
        res.status(500).json({ error: "internal server error" })
        console.log("Error in delete post controller: ", error.message);
    }
}

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if (!text) {
            console.log(text)
            return res.status(400).json({ error: "Text field is required" })
        }
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(400).json({ error: "post not found" })
        }

        const comment = { user: userId, text }
        post.comments.push(comment)
        await post.save();

        res.status(200).json(post)
    } catch (error) {
        console.log("Error in comment post controller: ", error.message);
        res.status(500).json({ error: "internal server error" })
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: postId } = req.params;
        const post = await Post.findById(postId)
        console.log(post)
        if (!post) {
            return res.status(404).json({ error: "post not found" })
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } })
            res.status(200).json({ message: "post unlike successfull " })
        }
        else {
            post.likes.push(userId);
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            })
            await notification.save();

            res.status(200).json({ message: "post like successfully" })
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error.message);
        res.status(500).json({ error: "internal server error" })
    }
}