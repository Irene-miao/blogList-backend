const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./test_helper");
const api = supertest(app);
const Blog = require("../models/blog");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { init } = require("../app");

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));

  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe("blog posts", () => {
  test("return correct number of blog posts as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });

  test("id field is properly named", async () => {
    const blogs = await api.get("/api/blogs");
    const firstBlog = blogs.body[0];

    expect(firstBlog.id).toBeDefined();
  });
});

describe("a blog post", () => {
  let headers;

  beforeEach(async () => {
    const newUser = {
      username: "Pumpkin",
      name: "Orange",
      password: "yummy",
    };
    await api.post("/api/users").send(newUser);

    const result = await api.post("/api/login").send(newUser);

    headers = {
      Authorization: `bearer ${result.body.token}`,
    };
  });

  test("a valid blog post can be created", async () => {
    const newBlog = {
      title: "Friday",
      author: "Cotton",
      url: "https://en.wikipedia.org/wiki/cotton",
      likes: 2,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .set(headers)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

    const latestBlog = blogsAtEnd.slice(-1);
    const blog = Object.assign({}, ...latestBlog);
    delete blog.id;
    delete blog.user;
    expect(blog).toEqual(newBlog);
  });

  test("add blog fails with proper status code 401 Unauthorized if token is missing", async () => {
    const newBlog = {
      title: "Friday",
      author: "Cotton",
      url: "https://en.wikipedia.org/wiki/cotton",
      likes: 2,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(401)
      .expect("Content-Type", /application\/json/);
  });

  test("missing likes property value becomes 0", async () => {
    const newBlog = {
      title: "Thursday",
      author: "Peanut",
      url: "https://en.wikipedia.org/wiki/peanut",
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .set(headers)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const added = blogsAtEnd.find((blog) => blog.url === newBlog.url);

    expect(added.likes).toBe(0);
  });

  test("return status code 400 for missing title and url properties", async () => {
    const newBlog = {
      url: "https://en.wikipedia.org/wiki/black_pepper",
      likes: 2,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .set(headers)
      .expect(400)
      .expect("Content-Type", /application\/json/);
  });

  describe("with valid id", () => {
    let addBlog;

    beforeEach(async () => {
      const newBlog = {
        title: "Wednesday",
        author: "Water",
        url: "https://en.wikipedia.org/wiki/water",
        likes: 2,
      };
      addBlog = await api.post("/api/blogs").send(newBlog).set(headers);
    });

    test("blog post can be deleted with valid id", async () => {
      const aBlog = addBlog.body;

      const initialBlogs = await helper.blogsInDb();

      await api.delete(`/api/blogs/${aBlog.id}`).set(headers).expect(204);

      const blogsAtEnd = await helper.blogsInDb();

      expect(blogsAtEnd).toHaveLength(initialBlogs.length - 1);

      const title = blogsAtEnd.map((r) => r.title);

      expect(title).not.toContain(aBlog.title);
    });

    test("blog post can be updated with valid id", async () => {
      const aBlog = addBlog.body;

      const newBlog = {
        url: "https://en.wikipedia.org/wiki/garlic",
        likes: 3,
      };

      await api
        .put(`/api/blogs/${aBlog.id}`)
        .send(newBlog)
        .set(headers)
        .expect(200);

      const blogsAtEnd = await helper.blogsInDb();
      const url = blogsAtEnd.map((r) => r.url);
      expect(url).toContain(newBlog.url);
    });
  });
});

describe("when there is initially one user in database", () => {
  test("create user success with fresh username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "newUser",
      name: "New User",
      password: "itzsecret",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test.only("create user fail with proper statuscode and message if username is taken", async () => {
    const newUser = {
      username: "Popcorn",
      name: "Duplicate",
      password: "itzsecret",
    };
    await api
    .post("/api/users")
    .send(newUser);

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("`username` to be unique");
  });

  test("Unsuccessful user creation with missing username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      name: "Missing Username",
      password: "nousername",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("`username` is required");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test("Unsuccessful user creation with missing password", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "NoPassword",
      name: "Missing Password",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("Missing password");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test("Unsuccessful user creation with less than 3 characters username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "To",
      name: "Too short",
      password: "short",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain(
      "`username` (`To`) is shorter than the minimum allowed length (3)"
    );

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test("Unsuccessful user creation with less than 3 characters password", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "Short",
      name: "Too short",
      password: "to",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain(
      "Password must be at least 3 characters long"
    );

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
