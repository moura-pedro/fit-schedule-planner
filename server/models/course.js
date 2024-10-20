const { mongoose } = require('mongoose')
const { Schema } = mongoose

const sectionSchema = new Schema({
  CRN: String,
  Section: String,
  Days: String,
  Times: String,
  Place: String,
  Instructor: String,
  Enrolled: Number,
  MaxCapacity: Number,
});

const courseSchema = new Schema({
  Course: String,
  Credits: Number,
  Title: String,
  Prerequisites: String,
  Requirements: String,
  sections: [sectionSchema],
});

const CourseModel = mongoose.model('classes', courseSchema);
module.exports = CourseModel
