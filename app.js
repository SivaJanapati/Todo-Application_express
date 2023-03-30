const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`ERROR : ${e.message}`);
    process.exit(1);
  }
};
initialiseDBAndServer();

app.get("/todos/", async (request, response) => {
  let query = "";
  let data = null;
  const { search_q = "", priority, status } = request.query;

  const consistStatus = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  const consistPriority = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const consistPriorityAndStatus = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  switch (true) {
    case consistStatus(request.query):
      query = `select * from todo
                where todo LIKE '%${search_q}%' and status = '${status}';`;
      break;
    case consistPriority(request.query):
      query = `select * from todo 
                where todo like '%${search_q}%' and priority = '${priority}';`;
      break;
    case consistPriorityAndStatus(request.query):
      query = `select * from todo 
                 where todo like '%${search_q}%' and status = '${status}' and priority = '${priority}';`;
      break;
    default:
      query = `select * from todo where todo like '%${search_q}%';`;
  }
  data = await db.all(query);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `select * from todo where id=${todoId};`;
  const data = await db.get(query);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const query = `insert into todo (id, todo, priority, status)
    values(${id},'${todo}','${priority}','${status}');`;
  const data = await db.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  let query = "";
  let data = null;
  const { todo, priority, status } = request.body;
  const { todoId } = request.params;

  const updateStatus = (requestQuery) => {
    return (
      requestQuery.status !== undefined &&
      requestQuery.todo == undefined &&
      requestQuery.priority == undefined
    );
  };
  const updateTodo = (requestQuery) => {
    return (
      requestQuery.todo !== undefined &&
      requestQuery.status == undefined &&
      requestQuery.priority == undefined
    );
  };
  const updatePriority = (requestQuery) => {
    return (
      requestQuery.priority !== undefined &&
      requestQuery.status == undefined &&
      requestQuery.todo == undefined
    );
  };

  switch (true) {
    case updateStatus(request.body):
      query = `update todo set status = '${status}' where id = ${todoId};`;
      break;
    case updateTodo(request.body):
      query = `update todo set todo = '${todo}' where id = ${todoId};`;
      break;
    case updatePriority(request.body):
      query = `update todo set priority = '${priority}' where id = ${todoId};`;
      break;
  }
  data = await db.run(query);
  switch (true) {
    case updateStatus(request.body):
      response.send("Status Updated");
      break;
    case updateTodo(request.body):
      response.send("Todo Updated");
      break;
    case updatePriority(request.body):
      response.send("Priority Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `delete from todo where id=${todoId}`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
