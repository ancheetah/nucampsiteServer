const express = require('express');
const authenticate = require('../authenticate');
const multer = require('multer'); // for file uploads

// Set config for storage and images (otherwise multer has default values)
const storage = multer.diskStorage({    
    destination: (req, file, cb) => {
        cb(null, 'public/images');  // saving files in public makes them visible to client
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname) // name on server = name on client side
    }
});

const imageFileFilter = (req, file, cb) => { 
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

// Call multer and config to handle image uploads
const upload = multer({storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

uploadRouter.route('/')
.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end('GET operation not supported on /imageUpload');
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
    res.json(req.file); // send file info back to server
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end('PUT operation not supported on /imageUpload');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end('DELETE operation not supported on /imageUpload');
});

module.exports = uploadRouter;