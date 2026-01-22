const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

blogsRouter.get("/", (req, res) => {
  Blog.find({}).then((blogs) => res.json(blogs));
});

blogsRouter.get("/:id", (req, res, next) => {
  Blog.findById(req.params.id)
    .then((blog) => {
      if (blog) {
        res.json(blog);
      } else {
        res.status(404).end();
      }
    })
    .catch((err) => next(err));
});

blogsRouter.post("/", (req, res, next) => {
  const body = req.body;

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  });

  blog
    .save()
    .then((savedBlog) => {
      res.json(savedBlog);
    })
    .catch((err) => next(err));
});

blogsRouter.delete("/:id", (req, res, next) => {
  Blog.findByIdAndDelete(req.params.id)
    .then(() => {
      response.status(204).end();
    })
    .catch((err) => next(err));
});

blogsRouter.put("/:id", (req, res, next) => {
  const { title, author, url, likes } = req.body;

  Blog.findById(req.params.id)
    .then((blog) => {
      if (!blog) {
        return response.status(404).end();
      }

      blog.title = title;
      blog.author = author;
      blog.url = url;
      blog.likes = likes;

      return blog.save().then((updateBlog) => {
        res.json(updateBlog);
      });
    })
    .catch((err) => next(err));
});

module.exports = blogsRouter;
