var express = require('express');
var router = express.Router();
var passport = require('passport');
var Account = require('../models/account');
var Room = require('../models/room');
var RoomNum = require('../models/roomnum');
const Transaction = require('mongoose-transactions');
const transaction = new Transaction();

router.get('/', function (req, res) {
    res.redirect('/room');
});

router.get('/register', function (req, res) {
    res.render('uDig_login', {});
});

router.post('/register', function (req, res) {
    Account.register(new Account({username: req.body.username}), req.body.password, function (err, account) {
        if (err) {
            res.render('uDig_login', {info: "username exists, please try again!"});
        }
        else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/room');
            });
        }
    });
});

router.get('/login', function (req, res) {
    res.render(appRoot + '/views/uDig_login.jade', {user: req.user});
});

router.post('/login', function (req, res, next) {
    console.log("login111");
    passport.authenticate('local', function (err, user, info) {
        //if (err) { return next(err) }
        if (!user) {
            // *** Display message using Express 3 locals
            //req.session.message = info.message;
            //return res.redirect('login');
            res.render('uDig_login', {info: "Username and password did not match!"});
        }
        else {
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/room');
            });
        }
    })(req, res, next);
});

router.get('/room', function (req, res) {
    if (!req.user) {
        res.redirect('/login');
    }
    else {
        res.render(appRoot + '/views/uDig_room.jade', {user: req.user});
    }
});

router.get('/draw', function (req, res) {
    console.log("redirect draw");
    res.render(appRoot + '/views/uDig_drawer.jade', {});
    console.log("redierct finish");
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// create room
router.get('/createRoom', function (req, res) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        var user = req.user;
        var username = user.username;
        console.log("createRoom user: " + user);
        console.log("createRoom username: " + username);
        RoomNum.findOneAndUpdate({Id: 1}, {$inc: {roomNum: 1}}, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }, function (err, updatedRoomNum) {
            if (err) {
                console.log("createRoom update roomNum failed");
            } else {
                console.log("createRoom update roomNum success, the updated roomNum is");
                console.log(updatedRoomNum);

                roomCount = updatedRoomNum.roomNum - 1;
                console.log("createRoom roomCount is " + roomCount);
                //var newRoom = new Room({roomId: roomCount + 1, userNum: 1, drawId: "aa", drawerIndex: 0, userList: [username]});
                var newRoom = new Room({
                    roomId: roomCount + 1,
                    userNum: 1,
                    drawerId: req.user.username,
                    drawerIndex: 0,
                    userList: [req.user.username]
                });
                newRoom.save(function (err, createNewRoom) {
                    if (err) {
                        console.log("createRoom create save newRoom failed");
                        console.log(err);
                    } else {
                        console.log("createRoom create save newRoom success");
                        console.log(createNewRoom);
                        Account.findOne({username: username}, function (err, user) {
                            if (err) {
                                console.log(err);
                            }
                            if (!user) {
                                console.log("createRoom can not find user");
                            }
                            else {
                                console.log("createRoom find user");
                                console.log(user);
                                user.roomId = roomCount + 1;
                                user.role = 'drawer';
                                user.score = 0;
                                user.save(function (err, updateUser) {
                                    if (err) {
                                        console.log("createRoom update user failed.");
                                    }
                                    else {
                                        console.log("createRoom updateUser");
                                        console.log(updateUser);
                                        res.render(appRoot + '/views/uDig_drawer.jade', {user: updateUser});
                                    }
                                });
                            }
                        });
                    }

                });
            }
        });
    }
});

router.get('/enterRoom/:roomId', function (req, res) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        var roomId = req.params.roomId;
        console.log("roomId: " + roomId);

        Room.findOne({roomId: roomId}, function (err, room) {
            if (err) {
                console.log("enterRoom find room failed");
                console.log(err);
            } else {
                console.log("enterRoom find room success, and room is ");
                console.log(room);
                console.log("the type of room is ");
                console.log(typeof room);
                if (isEmpty(room)) {
                    console.log("enterRoom room is null");
                    res.redirect("/room");
                }
                else {
                    var userListTmp = room.userList.toString();
                    var userList = userListTmp.split(",");
                    var userExist = false;
                    for (var i = 0; i < userList.length; i++) {
                        if (req.user.username == userList[i]) {
                            userExist = true;
                            break;
                        }
                    }
                    if (userExist) {
                        console.log("enterRoom reconnect!");
                        res.render(appRoot + '/views/uDig_drawer.jade', {user: req.user});
                    } else {
                        if (room.roomState == 0) {
                            Room.update({roomId: roomId}, {
                                $inc: {userNum: 1},
                                $addToSet: {userList: req.user.username}
                            }, function (err, numAffectedRoom) {
                                if (err) {
                                    console.log("enterRoom update room failed");
                                } else {
                                    console.log("enterRoom update room success");
                                    console.log(numAffectedRoom);
                                    Account.findByIdAndUpdate({_id: req.user._id}, {
                                        $set: {
                                            roomId: roomId,
                                            role: 'guesser',
                                            score: 0
                                        }
                                    }, function (err, updatedUser) {
                                        if (err) {
                                            console.log("EnterRoom update user failed and the err is:" + err);
                                        } else {
                                            console.log("EnterRoom update user success and the updatedUser is:" + updatedUser);
                                            var user = req.user;
                                            user.roomId = roomId;
                                            user.role = 'guesser';
                                            res.render(appRoot + '/views/uDig_drawer.jade', {user: user});
                                        }
                                    });
                                }
                            });
                        } else {
                            console.log("enterRoom failed! Sorry, the room is not available now! Please choose other rooms");
                            res.render('uDig_room', {error: "Sorry, the room is not available now! Please create a new room or choose other rooms"});
                        }
                    }
                }
            }
        });
    }
});

router.get('/getRooms/', function (req, res) {
    console.log("getRooms signal recieve!!!");
    var roomIDs = [];
    Room.find({}, function (err, rooms) {
        if (err) {
            console.log("find rooms err")
        } else {
            rooms.forEach(function (room, i) {
                console.log("roomID: ", room.roomId);
                roomIDs.push(room.roomId);
            });
        }
        console.log("first roomID: " + roomIDs[0]);
        res.json({
            roomIDs: roomIDs
        });
    });
});

router.get('/getRooms/', function (req, res) {
    console.log("getRooms signal recieve!!!");
    var roomIDs = [];
    Room.find({}, function (err, rooms) {
        if (err) {
            console.log("getRooms find rooms err")
        } else {
            console.log("getRooms find rooms success");
            console.log(rooms);
            rooms.forEach(function (room, i) {
                console.log("getRooms roomID: ", room.roomId);
                roomIDs.push(room.roomId);
            });
        }
        console.log("first roomID: " + roomIDs[0]);
        roomIdJson = {"roomIDs": roomIDs};
        console.log("getRooms roomIdJson is ");
        console.log(roomIdJson);
        console.log("getRooms type of roomIdJson is ");
        console.log(typeof roomIdJson);
        console.log(roomIdJson["roomIDs"]);
        res.json(roomIdJson);
    });
});

// get users from the db
router.get('/getUsers/:roomId', function (req, res) {
    console.log("getUsers signal recieve!!!");
    var roomId = req.params.roomId;
    console.log("getUsers: roomId: " + roomId);
    var usernames = [];
    var scores = [];
    Account.find({roomId: roomId}, function (err, users) {
        if (err) {
            console.log("find users err")
        } else {
            users.forEach(function (user, i) {
                console.log("username: ", user.username);
                usernames.push(user.username);
                scores.push(user.score);
            });
        }
        console.log("first roomID: " + usernames[0]);

        res.json({
            usernames: usernames,
            scores: scores
        });
    });
});


function isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
}

module.exports = router;