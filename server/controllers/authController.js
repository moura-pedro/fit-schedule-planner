const User = require('../models/user');
const { hashPassword, comparePassword } = require('../helpers/auth');
const jwt = require('jsonwebtoken');

const test = (req, res) => {
    res.json('test is working')
}


// Register Endpoint
const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        // Check if name was entered
        if (!name) {
            return res.json({
                error: 'name is required'
            })
        }

        // Check if password was entered and good
        if (!password || password.length < 6) {
            return res.json({
                error: 'Password is required and should be at least 6 characters long'
            })
        }

        // Check if email
        const exist = await User.findOne({email});

        if (exist) {
            return res.json({
                error: 'Email is taken already'
            })
        }

        const hashedPassword = await hashPassword(password)
        // Create user on database
        const user = await User.create({
            name, 
            email, 
            password: hashedPassword,
        });

        return res.json(user)
    } catch (error) {
        console.log(error)
    }
}

// Login Endpoint

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        // Check if user exists
        const user = await User.findOne({email});
        if (!user) {
            return res.json({
                error: 'No user found'
            })
        }

        // Check if passwords match
        const match = await comparePassword(password, user.password)
        if (match) {
            jwt.sign({
                email: user.email, 
                id: user._id, 
                name: user.name
            }, process.env.JWT_SECRET, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json({
                    id: user._id,
                    email: user.email,
                    name: user.name
                });
            });
        } else {
            return res.json({
                error: 'Passwords do not match'
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getProfile = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.json(null);
        }

        jwt.verify(token, process.env.JWT_SECRET, {}, async (err, decoded) => {
            if (err) {
                return res.json(null);
            }

            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.json(null);
            }

            res.json(user);
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    test,
    registerUser,
    loginUser,
    getProfile
}