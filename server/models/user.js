const { mongoose } = require('mongoose')
const { Schema } = mongoose

const userSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    file: {
        filename: String,
        contentType: String,
        data: Buffer,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }
})

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;