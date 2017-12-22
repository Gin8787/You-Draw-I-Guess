var socket = io.connect('127.0.0.1:3000');

socket.on('connectionSuccess', function () {
    console.log("connection-success");

    var userId = $('#username').val();
    var userRole = $('#userRole').val();
    var roomId = $('#roomId').val();

    var userInfo = {
        userId: userId,
        userRole: userRole,
        roomId: roomId
    };

    socket.userInfo = userInfo;
    socket.emit("userInfo", userInfo);
    socket.emit("roomId", {"roomId": roomId});
    socket.emit("bindKeywordReconnect");

    console.log("userInfo: " + userInfo.userId + " " + userInfo.userRole);

    if (userInfo.userRole == 'drawer') {
        console.log("role is drawer, cannot send message");
        $("#message_send").hide();
        $("#message_input").hide();
    }

    if (userInfo.userRole == 'guesser') {
        console.log("role is guesser, cannot draw picture");
        var draw_tool = $("#draw_tool");
        draw_tool.hide();
        var colorbar = $("#colorbar");
        colorbar.hide();
        var brushwidth = $("#brushwidth");
        brushwidth.hide();
        var startbtn = $("#startbtn");
        startbtn.hide();
    }
});