// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getFile, downloadFile } = require('../controllers/fileController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), uploadFile);
router.get('/file', getFile);
router.get('/file/download', downloadFile);

module.exports = router;