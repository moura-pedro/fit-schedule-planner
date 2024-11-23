// server/models/transcript.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseSchema = new Schema({
    term: String,
    subject: String,
    courseCode: String,
    level: String,
    title: String,
    grade: String,
    creditHours: Number,
    qualityPoints: Number,
    status: {
        type: String,
        enum: ['completed', 'in-progress']
    }
});

const termTotalSchema = new Schema({
    attemptHours: Number,
    passedHours: Number,
    earnedHours: Number,
    gpaHours: Number,
    qualityPoints: Number,
    gpa: Number
});

const transcriptSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentInfo: {
        name: String,
        program: String,
        college: String,
        major: String
    },
    courses: [courseSchema],
    termTotals: [termTotalSchema],
    overallTotals: {
        attemptHours: Number,
        passedHours: Number,
        earnedHours: Number,
        gpaHours: Number,
        qualityPoints: Number,
        gpa: Number
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const TranscriptModel = mongoose.model('Transcript', transcriptSchema);
module.exports = TranscriptModel;