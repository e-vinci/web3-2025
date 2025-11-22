var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var expensesRouter = require('./routes/expenses.js');
var topupRouter = require('./routes/topup.js');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:5173', /\.onrender\.com$/],
  })
);

app.use('/api/topup', topupRouter);

module.exports = app;
