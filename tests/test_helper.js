const Blog = require("../models/blog");
const app = require("../app");
const supertest = require("supertest");
const api = supertest(app);
const initialBlogs = [
  {
    title: "testing number 101",
    author: "gc",
    url: "gc.com123123",
    likes: 5,
  },
  {
    title: "testing number 101",
    author: "gc",
    url: "gc.com123123",
    likes: 5,
  },
];

const nonExistingId = async () => {
  const blog = new Blog({ content: "willremovethissoon" });
  await blog.save();
  await blog.deleteOne();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const User = require("../models/user");

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

const token = async () => {
  const response = await api.post("/api/login").send({
    username: "carlo123",
    password: "12345",
  });
  return response.body.token;
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb,
  token,
};
