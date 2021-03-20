const passport = require('passport');   // middleware
const LocalStrategy = require('passport-local').Strategy;   // constructor from LocalStrategy library
const User = require('./models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;  // an obj that will help extract token and other stuff
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

const config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate()));

// Use session based authentication, which requires serialization and deserialization of the user instance
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, {expiresIn: 3600});
};

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // specifies how token should be extracted from header
opts.secretOrKey = config.secretKey;    // uses key from config.js

exports.jwtPassport = passport.use(
    new JwtStrategy(
        opts,
        (jwt_payload, done) => {    // see documentation for passport-jwt
            console.log('JWT payload:', jwt_payload);
            User.findOne({_id: jwt_payload._id}, (err, user) => {
                if (err) {
                    return done(err, false);
                } else if (user) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        }
    )
);

// Verify that an incoming request is from an authenticated user
exports.verifyUser = passport.authenticate('jwt', {session: false});

// Verify admin
exports.verifyAdmin = (req, res, next) => {
    console.log(req.user);
    if (req.user.admin) {
        return next();  // pass control to next middleware if user is admin
    } else {
        err = new Error(`You are not authorized to perform this operation!`);
        err.status = 404;
        return next(err);
    }
};