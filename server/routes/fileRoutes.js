// server/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cors = require('cors');
const { uploadFile, getFile, downloadFile, getTranscript } = require('../controllers/fileController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure CORS for the routes
router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000'
    })
);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/file', getFile);
router.get('/file/download', downloadFile);
router.get('/transcript', getTranscript);

module.exports = router;