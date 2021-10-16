const commentsRouter = require("express").Router();
const Comment = require("../models/comment");
const Blog = require("../models/blog");

commentsRouter.get("/:id/comments", async (request, response) => {
    const id = request.params.id
  const comments = await Blog.findById(id).populate('comments', {content: 1, id: 1,});
    response.json(comments);
  });

commentsRouter.post("/:id/comments", async (request, response) => {
  // Get blog from request object
  const id = request.params.id
  const blog = await Blog.findById(id)
    const body = request.body;
  console.log(blog)

    const comment = new Comment({
      content: body.content,
    });

  console.log(comment)
    const savedComment = await comment.save();
    console.log(savedComment)
    blog.comments = blog.comments.concat(savedComment._id);
    console.log(blog.comments)
    await blog.save();
    response.status(201).json(savedComment.toJSON());
  });


module.exports = commentsRouter;