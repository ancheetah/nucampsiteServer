const express = require('express');
const User = require('../models/user');
const passport = require('passport'); // has methods useful for registering and logging users

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {  // this endpoint allows a new user to register
  User.register(
    new User({username: req.body.username}),
    req.body.password,
    err => {
        if (err) {
            res.statusCode = 500; // Internal server err
            res.json({err: err});
        } else {
            passport.authenticate('local')(req, res, () => {
                res.json({success: true, status: 'Registration Successful!'});
            });
        }
    }
  );
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({success: true, status: 'You are successfully logged in!'});
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
