const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { mongoose } = require('mongoose')
const cookieParser = require('cookie-parser')

const app = express();

// database connections
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Database connected'))
.catch((err) => console.log('Database NOT connected', err))

// middleware
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extender: false}))

app.use('/', require('./routes/authRoutes'))
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api', require('./routes/fileRoutes'));


const port = 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`))