/**
 * Model for number of rooms
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RoomNumSchema = new Schema({
    Id: {
        type: Number, default: 1
    },
    roomNum: {
        type: Number, default: 0
    }
});

var RoomNum = mongoose.model('RoomNum', RoomNumSchema);
module.exports = RoomNum;