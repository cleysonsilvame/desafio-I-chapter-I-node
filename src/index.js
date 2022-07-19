const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(username) {
  const user = users.find((user) => user.username === username);

  return user;
}

function checksExistsUserAccountMiddleware(request, response, next) {
  const { username } = request.headers;

  const user = checksExistsUserAccount(username);

  if (!user) {
    return response.status(400).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  let user = checksExistsUserAccount(username);

  if (user) {
    return response.status(400).json({ error: "User already exists" });
  }

  user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccountMiddleware, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccountMiddleware, (request, response) => {
  const { user } = request;

  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { user } = request;

    const { id } = request.params;
    const { title, deadline } = request.body;

    const todoIndex = user.todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos[todoIndex].title = title;
    user.todos[todoIndex].deadline = new Date(deadline);

    return response.json(user.todos[todoIndex]);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { user } = request;

    const { id } = request.params;

    const todoIndex = user.todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos[todoIndex].done = true;

    return response.json(user.todos[todoIndex]);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { user } = request;

    const { id } = request.params;

    const todoIndex = user.todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = app;
