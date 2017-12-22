var c = document.getElementById("myCanvas");
var cxt = c.getContext("2d");
var ismouseDown = false;
var last = null;
var crw, crh, cvw, cvh;
cxt.strokeStyle = "white";
var x;

// ------------ For both drawer and guessers ------------
// update the userlist when a new user come in
this.socket.on('updateUserList', function (userInfo) {
    var userListTable = $("#user_list");
    var userId = userInfo.userId;
    var scoreboardId = userId + "_scoreboard";
    if(!document.getElementById(scoreboardId)){
        var userLiHtml = getUserLiHtml(userId, 0);
        var userLi = $(userLiHtml);
        userListTable.append(userLi);
    }
});

// update the scoreboard
this.socket.on('updateScoreBoard', function (user) {
    console.log('update scoreboard information get');
    var userId = user.userId;
    var scoreboardId = userId + "_scoreboard";
    var scoreboardItem = $("#" + scoreboardId);
    var score = scoreboardItem.val();
    if (score == "") {
        score = "0";
    }
    var scoreNum = parseInt(score);
    scoreNum = scoreNum + 1; // update score
    score = scoreNum.toString();
    scoreboardItem.val(score);
    var newHtml = updateScoreBoardLiHtml(userId, score);
    console.log("new html: ", newHtml);
    scoreboardItem.html(newHtml);
});

this.socket.on('timeCountDown', function (timer) {
    console.log('timeCountDown time:', timer.timeCount);
    var time = timer.timeCount;

    if (time == 0) { // time out
        time = -1;
        modalDisappear();
        document.getElementById("timer").innerHTML = "TimeOut";

        // save the drawer's paint
        if (socket.userInfo.userRole == "drawer") {
            console.log("timeout send paint");
            var img_dataURL_src = c.toDataURL();
            socket.emit('paint', {
                'dataURL': img_dataURL_src
            });
            socket.emit("gameOverResetTimer");
        }

    } else {
        document.getElementById("timer").innerHTML = time + "s";
    }
});

var modalDisappear = function () {
    console.log("modalDisappear");
    var clearFlag = 0;
    var count = 3;
    $("#myModal").modal("show");
    $("#myModal").draggable({
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
            $("#myModal").fadeOut("slow");
            count = 3;
            $("#myModal").modal("hide");
        }
    }
    clearFlag = window.setInterval(autoClose, 1000);//每过一秒调用一次autoClose方法
    console.log("modalDisappear3");
}

// userLi html constructor
function getUserLiHtml(username, score) {
    var userLi = "<tr id=\"" + username + "_scoreboard\" value=\"" + score + "\"><td>" + username + "</td><td>" + score + "</td></tr>"
    return userLi;
}

// update score html constructor
function updateScoreBoardLiHtml(username, score) {
    var userLi = "<td>" + username + "</td><td>" + score + "</td>"
    return userLi;
}

// recovery painting when reconnect
this.socket.on('drawOldPoint', function (point) {
    console.log('Client receive an event: drawOldPoint');
    if (last != null) {
        cxt.strokeStyle = point.color;
        cxt.moveTo(last.x, last.y);
        cxt.lineTo(point.x, point.y);
        cxt.stroke();
    }
    last = point;
})

this.socket.on("resetTimer", function () {
    clearInterval(x);
    if (socket.userInfo.userRole == 'drawer') {
        socket.emit("gameOver");
    }
});

this.socket.on('startTimeCountDown', function () {
    console.log("Time start for role:" + socket.userInfo.userRole);
});

this.socket.on('timerStop', function () {
    console.log("Timer stop");
});

// show paintings
this.socket.on('showPaintings', function (paintings) {
    console.log("show paintings");
    var dataURLs = paintings.dataURLs;
    var userIds = paintings.userIds;
    var draw_area = $("#draw_area");
    var leave_room_btn = $("#leave-room-btn");
    draw_area.hide();
    leave_room_btn.hide();
    var show_paintings = $("#show_paintings");
    for (var i = 0; i < dataURLs.length; i++) {
        var imgHTML = getImgHTML(userIds[i], dataURLs[i]);
        var img = $(imgHTML);
        show_paintings.append(img);
    }
    paintingDisappear();
});

this.socket.on('roomUserNum', function(userNum){
    if(userNum > 1) {
        brush.color = "black";
        $("#draw_tool").show();
        $("#keyword-board").show();
        brushChanged();
        socket.emit("serverStart");
    }
} );

var paintingDisappear = function() {
    console.log("paintingDisappear");
    var clearFlag = 0;
    var count = 12;
    var show_paintings = $("#show_paintings");

    var autoClose = function() {
        console.log("paintingDisappear autoclose");
        if(count > 0) {
            count--;
        } else if (count <= 0){
            window.clearInterval(clearFlag);
            count = 12;
            socket.emit("clearPainting");
            show_paintings.hide();
            $("#draw_area").show();
            $("#leave-room-btn").show();
            while(show_paintings.hasChildNodes()) {
                show_paintings.removeChild(show_paintings.firstChild);
                console.log("while show_paintings");
            }
            console.log("after while");
        }
    };
    clearFlag = window.setInterval(autoClose, 1000);

};

// image html constructor
function getImgHTML(userId, dataURL) {
    var imgHtml = "<img src=\"" + dataURL + "\" style=\"width:100%\">"
    var userIdHtml = "<div class=\"caption\"><p>" + userId + "</p></div>";
    var wholeHtml = "<div class=\"col-md-6\"><div class=\"thumbnail\"><div class=\"thumbnail\">" + imgHtml
        + userIdHtml + "</div></div></div>"
    return wholeHtml;
}


// -------------------- For drawer ---------------------
var brush = {
    "color": "red",
    "width": "1"
}

function initSize() {
    console.log("In initSize");
    crw = c.width;	//The real width of canvas
    crh = c.height;	//The real height of canvas
    cvw = c.offsetWidth;	//The visual width of canvas
    cvh = c.offsetHeight;	//the visual height of canvas

}

function mousedown(event) {
    if (socket.userInfo.userRole == "drawer") {
        // console.log("In mousedown");
        event.preventDefault();
        ismouseDown = true;
        var xy = pos(event);

        // console.log("mousedown userRole: ", socket.userInfo.userRole)
        socket.emit('beginDraw', {
            'x': xy.x,
            'y': xy.y,
            'color': cxt.strokeStyle,
        });
    }
}

function mouseup(event) {
    if (socket.userInfo.userRole == "drawer") {
        // console.log("In mouseup");
        ismouseDown = false;
        event.preventDefault();
        last = null;
        socket.emit('endDraw', {
            'x': -1,
            'y': -1,
            'color': "hehe",
        });
    }
}

function mousemove(event) {
    if (socket.userInfo.userRole == "drawer") {
        // console.log("In mousemove");
        if (ismouseDown == true) {

            // console.log("In ismouseDown==true");
            event.preventDefault();
            var xy = pos(event);
            if (last != null) {
                // console.log("In last!= null");
                cxt.beginPath();
                cxt.moveTo(last.x, last.y);
                cxt.lineTo(xy.x, xy.y);
                cxt.stroke();
            }
            last = xy;
            socket.emit('draw', {
                'x': xy.x,
                'y': xy.y,
                'color': cxt.strokeStyle,
            });
        }
    }
}

function pos(event) {
    // console.log("In pos");
    var x, y;
    // console.log('event.offsetX is:');
    // console.log(event.offsetX);
    // console.log('event.offsetY is:');
    // console.log(event.offsetY);
    x = (event.offsetX) / cvw * crw;
    y = (event.offsetY) / cvh * crh;
    return {x: x, y: y};
}

function brushChanged() {
    // console.log("frontend: brushChanged!!!")
    cxt.strokeStyle = brush.color;
    // console.log("color:", cxt.strokeStyle);
    cxt.lineWidth = brush.width;
    socket.emit("brushChanged", brush)
}

// drawer's canvas actions' listeners
c.onmousedown = mousedown;
c.onmousemove = mousemove;
c.onmouseup = mouseup;

$(document).ready(function () {
    initSize();

    // initial the timer
    document.getElementById("timer").innerHTML = "90s";

    // hide the colorbar and brushwidth
    $("#colorbar").hide();
    $("#brushwidth").hide();
    $("#keyword-board").hide();
    $("#myModal").modal({show: false});

    //start game
    $("#startbtn").click(function () {
        socket.emit("startUserNum");
        // console.log("start botton clicked");

    });

    // use eraser
    $("#eraser").click(function () {
        brush.color = "white";
        brush.width = "20";
        console.log("eraser");
        brushChanged();
    })

    // clear the canvas
    $("#clear").click(function () {
        cxt.clearRect(0, 0, c.width, c.height);
        socket.emit('clearCanvas');
    })

    // show tool bar
    $("#toolbar-btn").click(function () {
        // console.log("colorbtn onclick")
        $("#colorbar").toggle();
        $("#brushwidth").toggle();
    });

    // change brush width
    $("#width1").click(function () {
        brush.width = "1";
        brushChanged();
    });

    $("#width2").click(function () {
        brush.width = "5";
        brushChanged();
    });

    $("#width3").click(function () {
        brush.width = "10";
        brushChanged();
    });

    $("#green").click(function () {
        brush.color = "green";
        brush.width = "1";
        brushChanged();
    });

    $("#blue").click(function () {
        brush.color = "blue";
        brush.width = "1";
        brushChanged();
    });

    $("#black").click(function () {
        brush.color = "black";
        brush.width = "1";
        brushChanged();
    });

    $("#pink").click(function () {
        brush.color = "pink";
        brush.width = "1";
        brushChanged();
    });

    $("#yellow").click(function () {
        brush.color = "yellow";
        brush.width = "1";
        brushChanged();
    });

    $("#red").click(function () {
        brush.color = "red";
        brush.width = "1";
        brushChanged();
    });
})

// -------------------- For guesser ---------------------
this.socket.on('beginDraw', function (point) {
    // console.log("Client receive an event: beginDraw");
    cxt.beginPath();
    // console.log("point.x is ");
    // console.log(point.x);
    // console.log("point.y is ");
    // console.log(point.y);
    cxt.moveTo(point.x, point.y);
})

this.socket.on('draw', function (point) {
    // console.log('Client receive an event: draw');
    if (last != null) {
        cxt.moveTo(last.x, last.y);
        cxt.lineTo(point.x, point.y);
        cxt.stroke();
    }
    last = point;
})

this.socket.on('endDraw', function () {
    // console.log('Client receive an event: endDraw');
    ismouseDown = false;
    last = null;
    cxt.closePath();
})

this.socket.on('brushChanged', function (msg) { // change guessers' brushes
    // console.log("frontend: guesser changed")
    cxt.strokeStyle = msg.color;
    cxt.lineWidth = msg.width;
});

this.socket.on('clearCanvas', function () { // clear guessers' canvases
    // console.log("clearCanvas");
    cxt.clearRect(0, 0, c.width, c.height);
});

// recovery painting when reconnect
this.socket.on('beginDrawOldPoint', function (point) {
    console.log('Client receive an event: beginDrawOldPoint');
    cxt.strokeStyle = point.color;
    cxt.beginPath();
    cxt.moveTo(point.x, point.y);
})
this.socket.on('drawOldPoint', function (point) {
    // console.log('Client receive an event: drawOldPoint');
    if (last != null) {
        cxt.strokeStyle = point.color;
        cxt.moveTo(last.x, last.y);
        cxt.lineTo(point.x, point.y);
        cxt.stroke();
    }
    last = point;
})
this.socket.on('endDrawOldPoint', function (point) {
    console.log('Client receive an event: drawOldPoint');
    ismouseDown = false;
    last = null;
    cxt.closePath();
})