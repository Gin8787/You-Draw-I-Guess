/*
* Model for user keyword
*/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// passport-local-mongoose package automatically take care of salting and hashing the password for us.
var keywordSchema = new Schema({
    Id: {
        type: Number,
        default: 0
    },
    keyword: {
        type: String,
        default: ""
    }
});

// Export model
var Keyword = mongoose.model('Keyword', keywordSchema);
module.exports = Keyword;