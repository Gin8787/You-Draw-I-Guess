$(document).ready(function () {
    console.log("In leaveroom.js ready");
    $("#leave-room-btn").click(leaveRoomClick);
});

function leaveRoomClick() {
    socket.emit("leaveRoomUpdateRoom");
}

function notifyLeaveRoom(userId) {
    var msglog = $("#msglog");
    var message = '<div class="message_content">' + '<p>'  + 'System: ' + userId + ' left the room' + '</p>' + '</div>';
    msglog.append(message);
    msglog.scrollTop(msglog[0].scrollHeight);
}

this.socket.on("leaveRoomUpdateRoomFinished", function(data) {
    console.log("In leaveRoomUpdateRoomFinished");
    userId = data['userId'];
    console.log("userId is " + userId);
    if(socket.userInfo.userId == userId) {
        socket.emit("leaveRoomUpdateUser");
    }
});

this.socket.on("guesserLeaveRoom", function(data) {
    console.log("In guesserLeaveRoom");
    userId = data['userId'];
    console.log("userId is " + userId);
    if (socket.userInfo.userId == userId) {
        socket.emit("timerStop");
        socket.emit("leaveRoomSocket");
        window.location.replace("/room");
    }
    notifyLeaveRoom(userId);
});

this.socket.on("lastDrawerLeaveRoom", function(data){
    console.log("In lastDrawerLeaveRoom");
    userId = data['userId'];
    if (socket.userInfo.userId == userId) {
        console.log("userId is " + userId);
        socket.emit("leaveRoomSocket");
        window.location.replace("/room");
    }
    notifyLeaveRoom(userId);
});

this.socket.on("drawerLeaveRoom", function(data) {
    console.log("In drawerLeaveRoom");
    userId = data['userId'];
    if (socket.userInfo.userId == userId) {
        console.log("userId is " + userId);
        socket.emit("leaveRoomSocket");
        window.location.replace("/room");
    }
    notifyLeaveRoom(userId);
});