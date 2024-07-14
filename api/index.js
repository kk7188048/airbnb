import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
const app = express();
app.use(express.json());
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import cookieparser from 'cookie-parser';
import bycrypt from 'bcryptjs';
import bcrypt from 'bcrypt';
import download from 'image-downloader';
const port = 3000;
import multer from 'multer';
import Place from './models/Place.js';
import Booking from './models/Bookings.js';
app.use(cookieparser());

const corsOptions = {
    credentials: true,
    origin: 'http://localhost:5173',
};

app.use(cors(corsOptions));
if (!process.env.MONGO_URL) {
    console.error('Please define the MONGO_URL environment variable');
    process.exit(1);
}

mongoose
    .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 30000 })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
});

const secret = 'mysecretkey';




function getUserDataFromReq(req) {
return new Promise((resolve, reject) => {
jwt.verify(req.cookies.token, secret, {}, async (err, userData) => {
if (err) throw err;
resolve(userData);
});
});
}    

app.get('/test', (req, res) => {
    try {
        res.json('Hello from your Express server!');
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

const bycryptSalt = bycrypt.genSaltSync(10);
app.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            throw new Error('Missing required field');
        }
        const userDoc = await User.create({
            email,
            password: bycrypt.hashSync(password, bycryptSalt),
            username
        });
        console.log(userDoc);
        res.json(userDoc);
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error this error is from register');
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error('Missing required field');
        }
        console.log(email, password);
        const userDoc = await User.findOne({ email });
        if (!userDoc) {
            throw new Error('User not found');
        }
        const isPasswordValid = bcrypt.compareSync(password, userDoc.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        const token = jwt.sign({
            _id: userDoc._id,
            username: userDoc.username,
            email: userDoc.email
        }, secret, { expiresIn: '365d' });
        if (!token) {
            throw new Error('Failed to sign token');
        }
        res.cookie('token', token).json(userDoc);

    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/profile', (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            throw new Error('Missing token');
        }    
        const user = jwt.verify(token, secret);
        const { _id, username, email } = User.findById(user._id);
        res.json({ _id, username, email });
        print(res.json({ _id, username, email }));
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error from profile');
    }
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json({ ok: true });
});

app.post('/upload-by-link', (req, res) => {
    const { link } = req.body;
    const newName = `${Date.now()}.jpg`;
    const dest = path.join(__dirname, 'uploads', newName);
    download.image({
        url: link,
        dest
    }).then(() => {
        res.json(dest);
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
});

const photosMiddleware = multer({dest:'uploads/'});
app.post('/upload', photosMiddleware.array('photos', 100), (req,res) => {
const uploadedFiles = [];
for (let i = 0; i < req.files.length; i++) {
const {path,originalname} = req.files[i];
const parts = originalname.split('.');
const ext = parts[parts.length - 1];
const newPath = path + '.' + ext;
fs.renameSync(path, newPath);
uploadedFiles.push(newPath.replace('uploads/',''));
}
res.json(uploadedFiles);
});

app.post('/places', (req,res) => {
const {token} = req.cookies;
const {
title,address,addedPhotos,description,price,
perks,extraInfo,checkIn,checkOut,maxGuests,
} = req.body;
jwt.verify(token, secret, {}, async (err, userData) => {
if (err) throw err;
const placeDoc = await Place.create({
owner:userData.id,price,
title,address,photos:addedPhotos,description,
perks,extraInfo,checkIn,checkOut,maxGuests,
});
res.json(placeDoc);
});
});

app.get('/user-places', (req,res) => {
const {token} = req.cookies;
jwt.verify(token, secret, {}, async (err, userData) => {
const {id} = userData;
res.json( await Place.find({owner:id}) );
});
});

app.get('/places/:id', async (req,res) => {
const {id} = req.params;
res.json(await Place.findById(id));
});

app.put('/places', async (req,res) => {
const {token} = req.cookies;
const {
id, title,address,addedPhotos,description,
perks,extraInfo,checkIn,checkOut,maxGuests,price,
} = req.body;
jwt.verify(token, secret, {}, async (err, userData) => {
if (err) throw err;
const placeDoc = await Place.findById(id);
if (userData.id === placeDoc.owner.toString()) {
placeDoc.set({
title,address,photos:addedPhotos,description,
perks,extraInfo,checkIn,checkOut,maxGuests,price,
});
await placeDoc.save();
res.json('ok');
}
});
});

app.get('/places', async (req,res) => {
res.json( await Place.find() );
});

app.post('/bookings', async (req, res) => {
const userData = await getUserDataFromReq(req);
const {
place,checkIn,checkOut,numberOfGuests,name,phone,price,
} = req.body;
Booking.create({
place,checkIn,checkOut,numberOfGuests,name,phone,price,
user:userData.id,
}).then((doc) => {
res.json(doc);
}).catch((err) => {
throw err;
});
});



app.get('/bookings', async (req,res) => {
const userData = await getUserDataFromReq(req);
res.json( await Booking.find({user:userData.id}).populate('place') );
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

