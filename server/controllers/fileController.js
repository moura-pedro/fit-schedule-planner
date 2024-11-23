// server/controllers/fileController.js
const User = require('../models/user');
const Transcript = require('../models/transcript'); // Add this import
const TranscriptParser = require('../services/transcriptParser');
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

        // Store the file in user model
        user.file = {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            data: req.file.buffer,
            uploadDate: new Date()
        };

        await user.save();

        // Parse transcript if it's a PDF file
        if (req.file.mimetype === 'application/pdf') {
            try {
                const parser = new TranscriptParser(req.file.buffer);
                const parsedData = await parser.parse();

                // Create or update transcript record
                const transcript = await Transcript.findOneAndUpdate(
                    { userId: user._id },
                    {
                        userId: user._id,
                        studentInfo: parsedData.studentInfo,
                        courses: parsedData.courses,
                        termTotals: parsedData.termTotals,
                        overallTotals: parsedData.overallTotals,
                        uploadDate: new Date()
                    },
                    { upsert: true, new: true }
                );

                return res.json({
                    success: true,
                    file: {
                        filename: user.file.filename,
                        uploadDate: user.file.uploadDate
                    },
                    transcript: transcript
                });
            } catch (parseError) {
                console.error('Error parsing PDF:', parseError);
                return res.status(400).json({ 
                    error: 'Error parsing transcript PDF',
                    details: parseError.message
                });
            }
        }

        res.json({
            success: true,
            file: {
                filename: user.file.filename,
                uploadDate: user.file.uploadDate
            }
        });
    } catch (error) {
        console.error('Error in uploadFile:', error);
        res.status(500).json({ 
            error: 'Error uploading file',
            details: error.message
        });
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

const getTranscript = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const transcript = await Transcript.findOne({ userId: decoded.id });

        if (!transcript) {
            return res.status(404).json({ error: 'No transcript found' });
        }

        res.json({ transcript });
    } catch (error) {
        console.error('Error in getTranscript:', error);
        res.status(500).json({ error: 'Error fetching transcript' });
    }
};

module.exports = {
    uploadFile,
    getFile,
    downloadFile,
    getTranscript
};