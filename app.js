var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');  
var logger = require('morgan');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // IIFE

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const campsiteRouter = require('./routes/campsiteRouter');
const promotionRouter = require('./routes/promotionRouter');
const partnerRouter = require('./routes/partnerRouter');

const mongoose = require('mongoose');

const url = 'mongodb://localhost:27017/nucampsite';
const connect = mongoose.connect(url, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true, 
    useUnifiedTopology: true
});

connect.then(() => console.log('Connected correctly to server'), 
    err => console.log(err)
);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware functions are applied in the order they appear
app.use(logger('dev')); // Morgan middleware looks at request header and logs it to console
app.use(express.json());  // Then it passes req and res objs to this middleware which parses the req body
app.use(express.urlencoded({ extended: false }));

// Don't use cookie parser if you're using sessions (sessions)
// app.use(cookieParser('12345-67890-09876-54321')); 
app.use(session({
  name: 'session-id',
  secret: '12345-67890-09876-54321',
  saveUninitialized: false, // don't save new session if there were no updates to session
  resave: false,  // keep saving after request to session even if there are no updates so that session stays active doesn't get deleted after user stops making requests
  store: new FileStore() // save to server's hard disk
}));

// Authenticate users before they can access resources on server
function auth(req, res, next) {
  console.log(req.session);

  // if (!req.cookieParser.user) {
  if (!req.session.user) {

    const authHeader = req.headers.authorization;
    if(!authHeader) { // user has not input any credentials
      const err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic'); // Chalenge the client for credentials. Tells client server is requesting basic authorization
      err.status = 401;
      return next(err);
    }

    // 'Basic' in header contains username and password in a 64-based encoded string. Let's decode it.
    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];
    if (user === 'admin' && pass === 'password') {
      // res.cookie('user', 'admin', {signed: true});  // creates a new cookie with a name of 'user', a value of 'admin' 
                                                    // to store in the name property, and an optional config property with tells Express to use the secret key from cookieParser to create a signed cookie
      req.session.user = 'admin';
      return next(); // authorized. move on to next middleware func
    } else {
      const err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401;
      return next(err);
    }
  } else {
    // if (req.signedCookies.user === 'admin') {
    if (req.session.user === 'admin') {
        return next();
    } else {
        const err = new Error('You are not authenticated!');
        err.status = 401;
        return next(err);
    } 
  }
}

app.use(auth);

// This is first middleware func that starts sending something back to client. Authenticate request before this line.
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/campsites', campsiteRouter);
app.use('/promotions', promotionRouter);
app.use('/partners', partnerRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
