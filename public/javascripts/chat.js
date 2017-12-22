/**
 * the javascript of chat log and keyword
 */
this.socket.on("receiveMsg", function (data) {
    console.log("In function reveive_msg");
    add_message(data);
});

this.socket.on("sendKeyword", function (keyword) {
    console.log("drawer get keyword");
    console.log(keyword);
    //if(socket.userInfo.role == 'drawer') {
    $("#keyword-board").val(keyword);
    //}
    socket.emit("bindKeyword", keyword);
});

this.socket.on("rightAnswer", function (data) {
    var msg_owner = data.msg_owner;
    var keyword = data.keyword;
    var message = 'User ' + msg_owner.userId + "got the right anser! The right answer is: " + keyword;
    console.log("right answer");
    console.log(message);
    if (socket.userInfo.userRole == "drawer") {
        socket.emit("timerStop");
        console.log("right answer send the paint back");
        var img_dataURL_src = c.toDataURL();
        socket.emit('paint', {
            'dataURL': img_dataURL_src
        });
    }
    modalDisappear();
    cxt.clearRect(0, 0, c.width, c.height);
});

var modalDisappear = function () {
    console.log("modalDisappear");
    var clearFlag = 0;
    var count = 3;//设置3秒后自动消失
    //$("#myModal2").toggle();//显示模态框
    $("#myModal2").modal("show");
    $("#myModal2").draggable({//设置模态框可拖动（需要引入jquery-ui.min.js）
        handle: ".modal-header"
    });
    console.log("modalDisappear2");

    var autoClose = function () {
        console.log("autuClose");
        console.log("count: " + count);
        if (count > 0) {
            count--;
        } else if (count <= 0) {
            window.clearInterval(clearFlag);
            $("#myModal2").fadeOut("slow");
            count = 3;
            $("#myModal2").modal("hide");
        }
    }
    clearFlag = window.setInterval(autoClose, 1000);//每过一秒调用一次autoClose方法
    console.log("modalDisappear3");
}


this.socket.on("timerStopFinished", function () {
    console.log("Client listening on timerStopFinished finished");
    // Avoid send multiple "drawerChangeRole" event
    if (socket.userInfo.userRole == "drawer") {
        socket.emit("drawerChangeRole");
    }
});

this.socket.on("drawerToGuesserFinish", function () {
    cxt.clearRect(0, 0, c.width, c.height);
    console.log("Client listening on drawerChangeRoleFinished");
    if (socket.userInfo.userRole == "drawer") {
        socket.userInfo.userRole = "guesser";
        console.log("drawerChangeRoleFinished socket.userInfo.role change to guesser");
    }
    socket.emit("guesserChangeRole");
});

this.socket.on("guesserChangeRoleFinished", function (userInfo) {
    console.log("Client listening on guesserChangeRoleFinished");
    if (socket.userInfo.userId == userInfo.userId) {
        socket.userInfo.userRole = "drawer";
        console.log("guesserToDrawerUpdateRoom socket.userInfo.role change to drawer");
        socket.emit("guesserToDrawerUpdateRoom");
    }
});

this.socket.on("guesserToDrawerFinished", function () {
    console.log("Client listening on guesserToDrawerFinished");
    $("myModal2").modal("hide");
    userInfo = socket.userInfo;
    if (userInfo.userRole == 'drawer') {
        console.log("guesserToDrawerFinished role is drawer, cannot send message");
        $("#message_send").hide();
        $("#message_input").hide();
        var draw_tool = $("#draw_tool");
        draw_tool.show();
        var colorbar = $("#colorbar");
        colorbar.show();
        var brushwidth = $("#brushwidth");
        brushwidth.show();
        var startbtn = $("#startbtn");
        startbtn.show();
    }

    if (userInfo.userRole == 'guesser') {
        console.log("guesserToDrawerFinished role is guesser, cannot draw picture");
        var draw_tool = $("#draw_tool");
        draw_tool.hide();
        var colorbar = $("#colorbar");
        colorbar.hide();
        var brushwidth = $("#brushwidth");
        brushwidth.hide();
        var startbtn = $("#startbtn");
        startbtn.hide();
        var keyword_board = $("#keyword-board");
        keyword_board.hide();
        $("#message_send").show();
        $("#message_input").show();
    }
});

this.socket.on("drawerLeaveRoom", function(data) {
    if(socket.userInfo.userId == data['userId']) {
        socket.emit("drawerChangeRole");

    }
});

function add_message(data) {
    var msglog = $("#msglog");
    var msg_owner = data.msg_owner;
    var msg = data.msg;
    //var message = '<div class="message_content">' + '<p>' + msg_owner.userId + ': ' + msg + '</p>' + '</div>';
    var message = getMessageHTML(msg_owner.userId, msg);
    msglog.append(message);
    msglog.scrollTop(msglog[0].scrollHeight);
}

function getMessageHTML(userId, msg) {
    var msgDiv = "<div class=\"message other-message float-right\">"+msg+"</div>";
    var userIdSpan = "<span class=\"message-data-name\">"+userId+"</span>";
    var userIdDiv = "<div class=\"message-data align-right\">"+userIdSpan+"</div>";
    var msgLi = "<li class=\"clearfix\">"+userIdDiv+msgDiv+"</li>";
    return msgLi
}

function send_message() {
    console.log("In send_message function");
    var msg = $("#message_input").val();
    console.log("Send message: ");
    console.log(msg);
    socket.emit("sendMsg", msg);
    $("#message_input").val('');
    $("#message_input").focus();
}

$(document).ready(function () {
    console.log("In chat.js ready");
    $("#myModal2").modal({show: false})
    if ($("#message_send").is(":visible")) {
        console.log("Role is guesser")
        $("#message_send").click(send_message);
        $("#message_input").keypress(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                send_message();
            }
        });
        $("#message_input").focus();
    } else {
        $("#message_send").hide();
    }
});