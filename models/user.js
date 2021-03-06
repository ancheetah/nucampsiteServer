const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');   // this plugin handles hashing, salting, and adding username/password to doc
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    admin: {
        type: Boolean,
        default: false
    }
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);