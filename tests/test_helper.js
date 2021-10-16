const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
    {
        title: "Monday",
        author: "Bob",
        url: "https://www.wildlife.state.nh.us/fishing/where-fish.html",
        likes: 3,
        id: "60fc17c702105019e089ca01"
        },
        {
        title: "Tuesday",
        author: "Bob",
        url: "https://www.theadventurejunkies.com/best-hiking-blogs/",
        likes: 5,
        id: "60fc195527d63d37a4ed7041"
        },
]

const nonExistingId = async () => {
const blog = new Blog({ 
    title: 'Willremovesoon', 
    author: 'NonExist',
    url: 'https://www.nonexisting.com',
    likes:0,
    id: '0000'
})
await blog.save()
await blog.remove()

return blog._id.toString()
}

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(user => user.toJSON())
}

module.exports = {
    initialBlogs,
    nonExistingId,
    blogsInDb,
    usersInDb,
}