/**
 * Created by chu lin.
 * The model of point.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Schema = mongoose.Schema;

// schema for point
var pointSchema = new Schema({
    roomId: Number,
    cordX: Number,
    cordY: Number,
    color: String,
    state: String,
    updated: {type: Date, default: Date.now},
    updatedCount: Number,
})

// model for point
var Point = mongoose.model('Point', pointSchema);
module.exports = Point;
