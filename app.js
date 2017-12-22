var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(3000);
// Get the directory of current project.
global.appRoot = path.resolve(__dirname);

global.roomCount = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// Set up mongoose connection
mongoose.connect('mongodb://localhost/uDig');

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// Models
var Room = require('./models/room');
var Paint = require('./models/paint');
var Point = require('./models/point');
var Keyword = require('./models/keyword');

//websocket listen to connections
io.on('connection', function (socket) {
    var roomId;
    var keyword2;

    console.log('establish connection successfully');
    console.log("backend: socket: " + socket);
    socket.emit('connectionSuccess');

    socket.on('userInfo', function (userInfo) {
        socket.userInfo = userInfo;
    });

    socket.on('roomId', function (data) {
        roomId = data.roomId;
        socket.join(data.roomId);

        console.log("RoomID: ", roomId);

        // recovery the paint when reconnect
        Point.find({roomId: roomId}, function (err, oldPoints) {
            if (err) {
                console.log("no points for the drawer");
            }
            else {
                console.log("Points find");
                oldPoints.forEach(function (point, i) {
                    switch (point.state) {
                        case "beginDraw":
                            console.log("Points find: beginDraw");
                            socket.emit('beginDrawOldPoint', {
                                'x': point.cordX,
                                'y': point.cordY,
                                'color': point.color,
                            });
                            break;
                        case "draw":
                            //console.log("Points find: draw");
                            socket.emit('drawOldPoint', {
                                'x': point.cordX,
                                'y': point.cordY,
                                'color': point.color,
                            });
                            break;
                        case "endDraw":
                            console.log("Points find: endDraw");
                            socket.emit('endDrawOldPoint', {
                                'x': point.cordX,
                                'y': point.cordY,
                                'color': point.color,
                            });
                    }
                });
            }
        });
        // update the userlist
        socket.broadcast.to(roomId).emit('updateUserList', {'userId': socket.userInfo.userId});
    });

    socket.on("bindKeywordReconnect", function() {
        console.log("In function bindKeywordReconnect");
        Room.findOne({roomId: socket.userInfo.roomId}, function(err, room) {
           if(err) {
               console.log("bindKeywordReconnect find room failed, the err is ");
               console.log(err);
           } else {
               if(!room) {
                   console.log("bindKeywordReconnect room is null");
               } else {
                   console.log("bindKeywordReconnect room.keyword is " + room.keyword);
                   keyword2 = room.keyword;
                   socket.userInfo.keyword = room.keyword;
               }
           }
        });
    });

    // register callback for beginDraw
    socket.on('beginDraw', function (point) {
        console.log("io: beginDraq: ");
        var role = socket.userInfo.userRole;
        console.log("io: role: " + role);
        console.log('Server get event: beginDraw');
        savePoints(point, roomId, "beginDraw");
        socket.to(roomId).emit('beginDraw', point);
    });

    // register callback for draw
    socket.on('draw', function (point) {
        //console.log('Server get event: draw');
        savePoints(point, roomId, "draw");  // save points into db
        socket.to(roomId).emit('draw', point);
    });

    socket.on('endDraw', function (point) {
        console.log('Server get event: endDraw');
        savePoints(point, roomId, "endDraw");
        socket.to(roomId).emit('endDraw');
    });

    // server broadcast changed brush to guessers
    socket.on('brushChanged', function (brush) {
        console.log("backend: brushChanged")
        socket.to(roomId).emit('brushChanged', brush)
    });

    // server broadcast clearcanvas signal to guessers
    socket.on('clearCanvas', function () {
        console.log("backend: clearcanvas");
        socket.to(roomId).emit('clearCanvas');
    });

    socket.on("startUserNum",function() {
       Room.findOne({roomId: socket.userInfo.roomId}, function(err, room) {
           if(err) {
               console.log("startUserNum find room failed");
               console.log(err);
           } else {
               if(isEmpty(room)) {
                   console.log("startUserNum room is null");
               } else {

                   userNum = room.userNum;
                   console.log("startUserNum use number is " + userNum);
                   console.log(room);
                   socket.emit("roomUserNum", userNum);
               }
           }
       }) ;
    });
    // server reserve signal from drawer
    // and broadcast start contdowntime to all users
    // include drawer
    var timeCount = 91;
    socket.on('serverStart', function () {
        //var newKeyword = new Keyword({Id: 1022, keyword: "Titanic"});
        //newKeyword.save();


        // send keyword
        var keywordId = Math.ceil(Math.random() * 1021);
        console.log("keywordId is " + keywordId);

        Keyword.find({Id: keywordId}, function(err, keywordDatabase) {
            if(err) {
                console.log("serverStart find keyword failed");
                console.log(err);
            } else {
                //console.log("serverStart find keyword success " + keyword);
                //console.log(typeof keyword);
                console.log(keywordDatabase.toString());
                keywordStrAll = keywordDatabase.toString().trim().split(",");
                keywordStr = keywordStrAll[1].split(":");
                keyword = keywordStr[1];
                keyword = keyword.trim();
                //keyword = keywordDatabase['keyword'];
                console.log("serverStart keyword: " + keyword);
                socket.userInfo.keyword = keyword;
                console.log("serverStart socket.keyword: " + socket.userInfo.keyword);
                Room.update({roomId: socket.userInfo.roomId}, {$set: {keyword: keyword}}, function(err) {
                   if(err) {
                       console.log("serverStart room update keyword failed and the error is ");
                       console.log(err);
                   } else {
                       console.log("serverStart room update keyword success");
                   }
                });
                io.sockets.in(socket.userInfo.roomId).emit('sendKeyword', keyword);
            }
        });

        Room.update({roomId: socket.userInfo.roomId}, {$set: {roomState: 1}}, function(err, updatedRoomNum) {
            if(err) {
                console.log("serverStart roomState update failed");
                console.log(err);
            } else {
                console.log("serverStart roomState update success");
                console.log(updatedRoomNum);
            }
        });

        timeCount = 91;
        //socket.emit('sendKeyword', keyword);
        io.sockets.in(roomId).emit('startTimeCountDown');
        setInterval(() => {
            if(timeCount >= 0){
            if(timeCount > 0) {
                timeCount = timeCount - 1;
                io.sockets.in(roomId).emit('timeCountDown', {
                    'timeCount': timeCount
                });
            }
        }
    },1000);
    });

    socket.on("bindKeyword", function(keyword) {
        keyword2 = keyword;
        console.log("bindKeyword keyword2 is " + keyword2);
        socket.userInfo.keyword = keyword;
    });
    // server waits for the first person who give the right answer in
    // each round.
    socket.on('sendMsg', function (msg) {
        console.log("Server get message from");
        console.log(socket.userInfo.userId);
        console.log("The message is: ");
        console.log(msg);
        var msg_owner = {
            'userId': socket.userInfo.userId,
            'userRole': socket.userInfo.userRole,
            'roomId': roomId,
        };
        console.log(msg_owner);
        console.log("SendMsg the keyword is " + msg);
        io.sockets.in(roomId).emit('receiveMsg', {'msg_owner': msg_owner, 'msg': msg});
        console.log("sendMsg socket.keyword: " + socket.userInfo.keyword);
        msg = "'" + msg + "'";
        console.log("msg: " + msg);
        console.log("tolowercase msg: " + msg.toLowerCase().trim());
        console.log("tolowercase socket.keyword: " + socket.userInfo.keyword.toLowerCase().trim());
        if (msg.toLowerCase().trim() == socket.userInfo.keyword.toLowerCase().trim()) {
            console.log("Someone give right anser");
            timeCount = -1;
            // update scores in db
            Account.update({"username": msg_owner.userId}, {$inc: {"score": 1}}, function (err, num) {
                if (err) {
                    console.log("update err!!!");
                } else {
                    console.log("num of docs changes: ", num);
                }
            });


            // broadcast the push-based update of scoreboard.
            io.sockets.in(roomId).emit('updateScoreBoard', {"userId": msg_owner.userId})

            // broadcast the message that someone get the right answer.
            io.sockets.in(roomId).emit('rightAnswer', {'msg_owner': msg_owner, 'keyword': keyword});
        }
    });

    // save paint of user: userId in room: roomId
    socket.on('paint', function (data) {
        console.log('paint dataURL recieve!!!');
        // console.log(data.dataURL);
        savePaints(data.dataURL, roomId, socket.userInfo.userId);
    });

    socket.on('timerStop', function () {
        console.log("app timerStop");
        timeCount = 0;
        //    io.sockets.in(roomId).emit('timerStop');
        if (socket.userInfo.userRole == "drawer") {
            io.sockets.in(roomId).emit('timerStopFinished');
        }
    });

    socket.on("gameOverResetTimer", function () {
        if (socket.userInfo.userRole = 'drawer') {
            io.sockets.in(roomId).emit('resetTimer');
        }
    });

    socket.on("gameOver", function () {
        if (socket.userInfo.userRole == "drawer") {
            io.sockets.in(roomId).emit('timerStopFinished');
        }
    });
// Change the drawer to guesser if time's up or guessers give the right answer
    socket.on("drawerChangeRole", function () {
        // Find current drawer
        console.log("In drawerChangeRole");

        // Drop the points of this round, since this round is over.
        Point.remove({roomId: socket.userInfo.roomId}, function(err) {
            if (err) {
                //console.log("points remove failed");
            } else {
                //console.log('collection removed');
            }
        });

        Room.findOne({"roomId": socket.userInfo.roomId}, function (err, room) {
            if (err) {
                console.log("drawerChangeRole find room failed");
            } else {
                if (isEmpty(room)) {
                    console.log("drawerChangeRole room is empty");
                }
                else {
                    userInfo = socket.userInfo;
                    roomId = userInfo.roomId;
                    console.log("drawerChangeRole find room success and room is " + room);
                    var drawerId = room.drawerId;
                    var userListTmp = room.userList.toString();
                    var userList = userListTmp.split(",");
                    var drawerIndex = room.drawerIndex;
                    console.log("The type of userList is: ");
                    console.log(typeof room.userList);
                    console.log("The room.userList is: " + room.userList);
                    console.log("The userList before split is: " + room.userList.toString());
                    console.log("The userList after split is: " + userList);
                    console.log("drawerId is " + drawerId);
                    console.log("userInfo.userId is " + userInfo.userId);
                    if (drawerId.localeCompare(userInfo.userId) == 0) {
                        console.log("find drawer, change role to guesser");
                        Account.update({username: userInfo.userId}, {$set: {role: "guesser"}}, function (err, updatedUserNum) {
                            if (err) {
                                console.log("drawerChangeRole drawer update role failed");
                            } else {
                                console.log("drawerChangerole drawer update role success" + updatedUserNum);
                                socket.userInfo.userRole = "guesser";
                                io.sockets.to(roomId).emit('drawerToGuesserFinish');
                            }
                        });
                    }

                    // game over since each one has drawn once.
                    var userNum = room.userNum;
                    var drawerIndex = room.drawerIndex;
                    console.log("userNum: " + userNum);
                    console.log("drawerIndex: " + drawerIndex);
                    if (drawerIndex == userNum - 1) {
                        console.log("drawerChangeRole drawerIndex equals userNum");
                        Room.update({roomId: socket.userInfo.roomId}, {$set: {drawerIndex: -1}}, function (err) {
                            if (err) {
                                console.log("drawerChangeRole drawerIndex equals userNum update room failed");
                                console.log(err);
                            }
                        });
                        console.log("game over");
                        Paint.find({roomId: roomId}, function (err, paintings) {
                            if (err) {
                                console.log("find the paintings err!!!");
                            } else {
                                var dataURLs = [];
                                var userIds = [];
                                paintings.forEach(function (painting, i) {
                                    dataURLs.push(painting.dataURL);
                                    userIds.push(painting.username);
                                    console.log("paint: username:", painting.username);
                                });
                                io.sockets.in(roomId).emit('showPaintings', {
                                    'dataURLs': dataURLs,
                                    'userIds': userIds
                                });
                            }
                        });
                    }
                }
            }
        });
    });

    // After one round, clear the paints of the room
    socket.on("clearPainting", function() {
        Paint.findOneAndRemove({username: socket.userInfo.userId}, function(err) {
            if(err) {
                console.log("clearPainting clear painting failed");
                console.log(err);
            } else {
                console.log("clearPainting clear painting success");
            }
        });
    });

// Change one of guesser to drawer after drawer's role is changed
    socket.on("guesserChangeRole", function () {
        console.log("Server GuesserChangeRole");
        Room.findOne({'roomId': socket.userInfo.roomId}, function (err, room) {
            if (err) {
                console.log("guesserChangeRole find room failed");
            } else {
                if (isEmpty(room)) {
                    console.log("guesserChangeRole room is empty");
                }
                else {
                    console.log("guesserChangeRole find room success");
                    var userListTmp = room.userList.toString();
                    var userList = userListTmp.split(",");
                    var drawerIndex = room.drawerIndex;
                    var drawerNewIndex = drawerIndex + 1;
                    var userInfo = socket.userInfo;

                    if (userInfo.userId.localeCompare(userList[drawerNewIndex]) == 0) {
                        console.log("Find next drawer");
                        Account.update({username: userInfo.userId}, {$set: {role: "drawer"}}, function (err, updatedUserNum) {
                            if (err) {
                                console.log("guesserChangeRole update drawer failed" + err);
                            } else {
                                console.log("guesserChangeRole update drawer success");
                                console.log(updatedUserNum);
                                socket.userInfo.userRole = 'drawer';
                                userInfo.userRole = 'drawer';
                                io.sockets.to(roomId).emit("guesserChangeRoleFinished", userInfo);
                            }
                        });
                    }
                }
            }
        });
    });

    socket.on("guesserToDrawerUpdateRoom", function () {
        console.log("In function guesserToDrawerUpdateRoom");
        Room.update({roomId: socket.userInfo.roomId}, {
                $set: {drawerId: socket.userInfo.userId},
                $inc: {drawerIndex: 1}
            },
            function (err, updatedRoomNum) {
                if (err) {
                    console.log("guesserToDrawerUpdateRoom update room failed " + err);
                } else {
                    console.log("guesserToDrawerUpdateRoom update room success" + updatedRoomNum);
                    io.sockets.in(roomId).emit('guesserToDrawerFinished');
                }
            });
    });

    // Listening on LeaveRoom event and update the room database
    socket.on("leaveRoomUpdateRoom", function () {
        Room.findOne({roomId: socket.userInfo.roomId}, function (err, room) {
            if (err) {
                console.log("leaveRoomUpdateRoom find room failed " + err);
            } else {
                if (isEmpty(room)) {
                    console.log("leaveRoomUpdateRoom room is empty");
                } else {
                    var userInfo = socket.userInfo;
                    var userListTmp = room.userList.toString();
                    var userList = userListTmp.split(",");
                    var i = -1;
                    for (i = 0; i < userList.length; i++) {
                        if (userList[i] == socket.userInfo.userId) {
                            break;
                        }
                    }
                    console.log("leaveRoomUpdateRoom i is " + i);
                    console.log("leaveRoomUpdateRoom drawerIndex is " + room.drawerIndex);
                    if (i > room.drawerIndex) {
                        Room.findOneAndUpdate({roomId: userInfo.roomId}, {
                            $inc: {userNum: -1},
                            $pull: {userList: userInfo.userId}
                        }, {new: true}, function (err, updatedRoom) {
                            if (err) {
                                console.log("leaveRoomUpdateRoom update room bigger drawerId failed");
                                console.log(err);
                            } else {
                                console.log("leaveRoomUpdateRoom update room bigger drawerId success");
                                console.log(updatedRoom);
                                if (updatedRoom.userNum == 0) {
                                    console.log("leaveRoomUpdateRoom bigger drawerId userNum is 0");
                                    Room.findOneAndRemove({roomId: userInfo.roomId}, function (err) {
                                        if (err) {
                                            console.log("leaveRoomUpdateRoom bigger drawerId remove room failed");
                                        } else {
                                            console.log("leaveRoomUpdateRoom bigger drawerId remove room success");
                                        }
                                    });
                                    io.in(socket.userInfo.roomId).emit("drawerLeaveRoom", {'userId': socket.userInfo.userId})
                                } else {
                                    io.in(socket.userInfo.roomId).emit("leaveRoomUpdateRoomFinished", {'userId': userInfo.userId});
                                }
                            }
                        });
                    } else {
                        Room.findOneAndUpdate({roomId: userInfo.roomId}, {
                            $inc: {userNum: -1, drawerIndex: -1},
                            $pull: {userList: userInfo.userId}
                        }, {new: true}, function (err, updatedRoom) {
                            if (err) {
                                console.log("leaveRoomUpdateRoom update room smaller drawerId failed");
                                console.log(err);
                            } else {
                                console.log("leaveRoomUpdateRoom update room smaller drawerId success");
                                console.log(updatedRoom);
                                if (updatedRoom.userNum == 0) {
                                    console.log("leaveRoomUpdateRoom smaller drawerId userNum is 0");
                                    Room.findOneAndRemove({roomId: userInfo.roomId}, function (err) {
                                        if (err) {
                                            console.log("leaveRoomUpdateRoom smaller drawerId remove room failed");
                                        } else {
                                            console.log("leaveRoomUpdateRoom smaller drawerId remove room success");
                                        }
                                    });
                                    io.sockets.in(userInfo.roomId).emit("lastDrawerLeaveRoom", {'userId': socket.userInfo.userId})
                                } else {
                                    io.sockets.in(userInfo.roomId).emit("leaveRoomUpdateRoomFinished", {'userId': userInfo.userId});
                                }
                            }
                        });
                    }
                }
            }
        });

    });

    // Listening on leaveRoom event and update user database
    socket.on("leaveRoomUpdateUser", function () {
        console.log("leaveRoomUpdateUser");
        roomId = socket.userInfo.roomId;
        if (socket.userInfo.role == 'guesser') {
            Account.update({username: socket.userInfo.userId}, {$set: {roomId: -1}}, function (err, updatedUserNum) {
                if (err) {
                    console.log("leaveRoomUpdateUser update guesser failed");
                    console.log(err);
                } else {
                    console.log("leaveRoomUpdateUser update guesser success " + updatedUserNum);
                    io.sockets.in(roomId).emit("guesserLeaveRoom", {'userId': socket.userInfo.userId});
                    //                socket.leave(roomId);
                }
            });
        } else {
            Account.update({username: socket.userInfo.userId}, {
                $set: {
                    roomId: -1,
                    role: 'guesser'
                }
            }, function (err, updatedUserNum) {
                if (err) {
                    console.log("leaveRoomUpdateUser update drawer failed");
                    console.log(err);
                } else {
                    console.log("leaveRoomUpdateUser update drawer success " + updatedUserNum);
                    timeCount = 0;
                    io.sockets.in(roomId).emit("drawerLeaveRoom", {'userId': socket.userInfo.userId});
                }
            });
        }
    });

    socket.on("leaveRoomSocket", function () {
        socket.leave(socket.userInfo.roomId);
    });
});

/***** help function *******/
// savePoints attempts to save point in the db.
function savePoints(point, roomID, state) {
    // new data
    // console.log("save point: roomID: ", roomID);
    //console.log("svaePoints");
    var myPoint = new Point({
        roomId: roomID,
        cordX: point.x,
        cordY: point.y,
        color: point.color,
        state: state,
        updated: new Date,
    })
    // save into database
    myPoint.save(function (err) {
        if (err) {
            console.log('fail to save!!!!')
            return;
        }
        else {
            //console.log("save point success");
        }
        //console.log('save the point success!!!!');
        //console.log('x:', myPoint.cordX);
        //console.log('y:', myPoint.cordY);
        //console.log('color:', myPoint.color);
    });
}

// save painting into db
function savePaints(paint, roomID, userID) {
    console.log("save paint: roomID: ", roomID, "userID: ", userID);
    var myPaint = new Paint({
        username: userID,
        roomId: roomID,
        dataURL: paint,
    })
    // save into database
    myPaint.save(function (err) {
        if (err) {
            console.log('fail to save!!!!')
            return;
        }
        console.log('save the paint success!!!!');
        // console.log('dataURL:', myPaint.dataURL);
    });
}

function isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
}

module.exports = app;