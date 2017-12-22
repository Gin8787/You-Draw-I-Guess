/*
* Model for user account
*/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

// passport-local-mongoose package automatically take care of salting and hashing the password for us.
var Account = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    roomId: {
        type: Number, default: -1
    },
    role: {
        type: String, default: 'guesser'
    },
    score: {
        type: Number, default: 0
    }
});

Account.plugin(passportLocalMongoose);

// Export model
var Account = mongoose.model('Account', Account);
module.exports = Account;