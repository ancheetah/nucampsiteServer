const passport = require('passport');   // middleware
const LocalStrategy = require('passport-local').Strategy;   // LocalStrategy library
const User = require('./models/user');

exports.local = passport.use(new LocalStrategy(User.authenticate()));

// Use session based authentication, which requires serialization and deserialization of the user instance
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());