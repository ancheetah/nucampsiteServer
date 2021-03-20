const express = require('express');
const User = require('../models/user');
const passport = require('passport'); // has methods useful for registering and logging users
const authenticate = require('../authenticate');

const router = express.Router();

/* GET users listing. */
router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find()
  .then(users => {
    res.json(users);
  })
  .catch(err => next(err));
  // res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {  // this endpoint allows a new user to register
  User.register(
    new User({username: req.body.username}),
    req.body.password,
    (err, user) => {
        if (err) {
            res.status(500).json({err: err}); // 500 = Internal server err
        } else {
          if (req.body.firstname) {
              user.firstname = req.body.firstname;
          }
          if (req.body.lastname) {
              user.lastname = req.body.lastname;
          }
          user.save(err => {
            if (err) {
                res.status(500).json({err: err});
                return;
            }
            passport.authenticate('local')(req, res, () => {
                res.json({success: true, status: 'Registration Successful!'});
            });
          });
        }
    }
  );
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  const token = authenticate.getToken({_id: req.user._id});
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
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
