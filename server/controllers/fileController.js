// controllers/fileController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.file = {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            data: req.file.buffer,
            uploadDate: new Date()
        };

        await user.save();

        res.json({
            success: true,
            file: {
                filename: user.file.filename,
                uploadDate: user.file.uploadDate
            }
        });
    } catch (error) {
        console.error('Error in uploadFile:', error);
        res.status(500).json({ error: 'Error uploading file' });
    }
};

const getFile = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.file) {
            return res.json({ file: null });
        }

        res.json({
            file: {
                filename: user.file.filename,
                uploadDate: user.file.uploadDate
            }
        });
    } catch (error) {
        console.error('Error in getFile:', error);
        res.status(500).json({ error: 'Error fetching file' });
    }
};

const downloadFile = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.set({
            'Content-Type': user.file.contentType,
            'Content-Disposition': `attachment; filename="${user.file.filename}"`
        });

        res.send(user.file.data);
    } catch (error) {
        console.error('Error in downloadFile:', error);
        res.status(500).json({ error: 'Error downloading file' });
    }
};

module.exports = {
    uploadFile,
    getFile,
    downloadFile
};

