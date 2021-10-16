// Event handlers of routes are called controllers

const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const middleware = require("../utils/middleware");

// Get all blogs
blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", {
    username: 1,
    name: 1,
    id: 1,
  },);
  response.json(blogs);
});

//Get one
blogsRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  response.json(blog)
})

// Create new blog
blogsRouter.post("/", middleware.userExtractor, async (request, response) => {
  // Get user from request object
  const user = request.user;

  const body = request.body;

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.json(savedBlog);
});

// Delete a blog
blogsRouter.delete( "/:id",middleware.userExtractor,async (request, response) => {
    // Get user from request object
    const user = request.user;
    
    const blog = await Blog.findById(request.params.id);

    if (blog.user.toString() === user._id.toString()) {
      await blog.remove()
      user.blogs = user.blogs.filter(blog => blog.id.toString() !== request.params.id.toString())
      await user.save()
      response.status(204).end();
    } else {
      return response9
        .status(401)
        .json({ error: "Only the creator can delete blogs" });
    }
  }
);

// Update a blog
blogsRouter.put("/:id", async (request, response) => {
  const blog = request.body;
 
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  response.json(updatedBlog.toJSON());
});

module.exports = blogsRouter;
