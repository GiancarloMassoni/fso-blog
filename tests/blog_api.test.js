const { test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const describe = require("node:test").describe;
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const helper = require("./test_helper");
const api = supertest(app);
const bcrypt = require("bcrypt");
const User = require("../models/user");

beforeEach(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});
  const passwordHash = await bcrypt.hash("12345", 10);
  const user = await new User({
    username: "carlo123",
    name: "Carlo",
    passwordHash,
  }).save();

  const blogs = helper.initialBlogs.map((b) => ({
    ...b,
    user: user._id,
  }));

  const savedBlogs = await Blog.insertMany(blogs);

  // link blogs back to user
  user.blogs = savedBlogs.map((b) => b._id);
  await user.save();
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

  const token = await helper.token();

  await api
    .post("/api/blogs")
    .set("Authorization", "Bearer " + token)
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

  const token = await helper.token();
  await api
    .post("/api/blogs")
    .set("Authorization", "Bearer " + token)
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
  const token = await helper.token();

  await api
    .post("/api/blogs")
    .set("Authorization", "Bearer " + token)
    .send(newBlog)
    .expect(400);
});

test("deletion of a blog", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToDelete = blogsAtStart[0];

  const token = await helper.token();

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set("Authorization", "Bearer " + token)
    .expect(204);

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

  const token = await helper.token();

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set("Authorization", "Bearer " + token)
    .send(blogToUpdate)
    .expect(200);

  const blogsAtEnd = await helper.blogsInDb();

  const ids = blogsAtEnd.map((n) => n.id);

  assert(ids.includes(blogToUpdate.id));

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
});

describe("deletion of a blog", () => {
  test("succeeds with status code 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    const token = await helper.token();

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", "Bearer " + token)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    const ids = blogsAtEnd.map((n) => n.id);
    assert(!ids.includes(blogToDelete.id));

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
  });
});

describe("updating of a blog", () => {
  test("succeeds with status code 200 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];
    blogToUpdate.title = "Go To Statement Considered Harmful";
    blogToUpdate.url =
      "https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf";

    const token = await helper.token();

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", "Bearer " + token)
      .send(blogToUpdate)
      .expect(200);

    const blogsAtEnd = await helper.blogsInDb();

    const ids = blogsAtEnd.map((n) => n.id);

    assert(ids.includes(blogToUpdate.id));
  });
});

after(async () => {
  await mongoose.connection.close();
});
