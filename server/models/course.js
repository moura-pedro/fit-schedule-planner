const { mongoose } = require('mongoose');
const { Schema } = mongoose;

const sectionSchema = new Schema({
  CRN: String,
  Section: String,
  Days: String,
  Times: String,
  Place: String,
  Instructor: String,
  Capacity: String,
  CurrentEnrollment: {
    type: Number,
    default: 0
  },
  registeredUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const courseSchema = new Schema({
  Course: String,
  Credits: String,
  Title: String,
  Prerequisites: String,
  Requirements: String,
  Sections: [sectionSchema]
});

const CourseModel = mongoose.model('classes', courseSchema);
module.exports = CourseModel;