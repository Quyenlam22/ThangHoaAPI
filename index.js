const express = require('express');
require("dotenv").config();

const bodyParser = require('body-parser');

const database = require("./config/database");
database.connect();

const app = express();
const port = 3002;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

const route = require("./api/v1/routes/index.route");

route(app);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
})