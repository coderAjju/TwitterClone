import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import connectMongoDb from './db/connectMongoDB.js';
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary'
const app = express();
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const port = process.env.PORT;

app.get('/', (req, res) =>{
    res.send("hello world")
})
app.use(express.json()); // to parse req.body
app.use(express.urlencoded({extended:true})); // use to parse form data.
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.listen(port, () => {
    console.log('Server is running on port',port);
    connectMongoDb();
})