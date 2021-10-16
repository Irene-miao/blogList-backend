// Define Mongoose schema for blogs

const mongoose = require('mongoose')


const blogSchema = new mongoose.Schema({
    title: {
        type: String, 
        minLength: 5,
        required: true
    },
    author: {
        type: String,
        minLength: 3,
        required: true
    },
    url: {
        type: String,
        lowercase: true,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    user: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
})

blogSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Blog', blogSchema)