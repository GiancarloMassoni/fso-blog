const { test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const helper = require("./test_helper");
const api = supertest(app);

beforeEach(async () => {
  await Blog.deleteMany({});

  await Blog.insertMany(helper.initialBlogs);
});

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("blog post has id property", async () => {
  const response = await api.get("/api/blogs");

  response.body.forEach((blog) => {
    assert(blog.id);
  });
});

test("a valid blog can be added", async () => {
  const newBlog = {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf",
    likes: 5,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);
});

test("blog without likes property defaults to 0", async () => {
  const newBlog = {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf",
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

  const addedBlog = blogsAtEnd[blogsAtEnd.length - 1];
  assert.strictEqual(addedBlog.likes, 0);
});

test("blog without title or url properties receive 404", async () => {
  const newBlog = {
    author: "Edsger W. Dijkstra",
  };

  await api.post("/api/blogs").send(newBlog).expect(400);
});

test("deletion of a blog", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToDelete = blogsAtStart[0];

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

  const blogsAtEnd = await helper.blogsInDb();

  const ids = blogsAtEnd.map((n) => n.id);

  assert(!ids.includes(blogToDelete.id));

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
});

test("updating of a blog", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];
  blogToUpdate.title = "Go To Statement Considered Harmful";
  blogToUpdate.url =
    "https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf";

  await api.put(`/api/blogs/${blogToUpdate.id}`).send(blogToUpdate).expect(200);

  const blogsAtEnd = await helper.blogsInDb();

  const ids = blogsAtEnd.map((n) => n.id);

  assert(ids.includes(blogToUpdate.id));

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
});

after(async () => {
  await mongoose.connection.close();
});
