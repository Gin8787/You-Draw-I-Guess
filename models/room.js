/**
 * Model for room
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Room = new Schema({
    roomId: {
        type: Number, default: -1
    },
    userNum: {
        type: Number, default: 0
    },
    roomState: {
        type: Number, default: 0 //0 indicates room is in waiting sate, and 1 indicates room is in playing sate
    },
    drawerId: {
        type: String, default: ""
    },
    drawerIndex: {
        type: Number, default: 0
    },
    userList: {
        type: [String]
    },
    keyword: {
        type: String,
        default: ""
    }
});

var Room = mongoose.model('Room', Room);
module.exports = Room;