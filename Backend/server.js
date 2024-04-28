import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import connectMongoDb from './db/connectMongoDB.js';
import cookieParser from 'cookie-parser';

const app = express();
dotenv.config();

const port = process.env.PORT;

app.get('/', (req, res) =>{
    res.send("hello world")
})
app.use(express.json()); // to parse req.body
app.use(express.urlencoded({extended:true})); // use to parse form data.
app.use(cookieParser());
app.use('/api/auth', authRoutes);

app.listen(port, () => {
    console.log('Server is running on port',port);
    connectMongoDb();
})