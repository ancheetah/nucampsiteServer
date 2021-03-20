const express = require('express');
const User = require('../models/user');

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {  // this endpoint allows a new user to register
  User.findOne({username: req.body.username}) // check that the user name is not taken
  .then(user => {
      if (user) {
          const err = new Error(`User ${req.body.username} already exists!`);
          err.status = 403; // forbidden
          return next(err);
      } else {
          // Create a new user document
          User.create({ // returns a promise
              username: req.body.username,
              password: req.body.password})
          .then(user => {
              res.json({status: 'Registration Successful!', user: user});
          })
          .catch(err => next(err));
      }
  })
  .catch(err => next(err));
});

router.post('/login', (req, res, next) => {
  // Check is user is already logged in
  if(!req.session.user) { 
      const authHeader = req.headers.authorization;
      if (!authHeader) {
          const err = new Error('You are not authenticated!');
          res.setHeader('WWW-Authenticate', 'Basic');
          err.status = 401;
          return next(err);
      }
    
      const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
      const username = auth[0];
      const password = auth[1];
    
      // Start tracking a session for this user
      User.findOne({username: username})
      .then(user => {
          if (!user) {
              const err = new Error(`User ${username} does not exist!`);
              err.status = 401;
              return next(err);
          } else if (user.password !== password) {
              const err = new Error('Your password is incorrect!');
              err.status = 401;
              return next(err);
          } else if (user.username === username && user.password === password) {
              req.session.user = 'authenticated';
              res.end('You are authenticated!')
          }
      })
      .catch(err => next(err));
  } else {  // there's already a session being tracked for this client
      res.end('You are already authenticated!');
  }
});

router.get('/logout', (req, res, next) => { // use GET because client is not sending any info to server
  if (req.session) {
      req.session.destroy();
      res.clearCookie('session-id');
      res.redirect('/');
  } else {
      const err = new Error('You are not logged in!');
      err.status = 401;
      return next(err);
  }
});

module.exports = router;
