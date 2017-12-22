var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// schema for painting
var paintSchema = new Schema(
    {
        dataURL: {type: String},
        roomId: {type: Number},
        username: {type: String},
        updated: {type: Date, default: Date.now},
    });

// model for painting
var Paint = mongoose.model('Painting', paintSchema);
module.exports = Paint;