$(document).ready(function () {
    console.log("userlist");
    populatelist();
});

function populatelist() {
    console.log("populatelist the rooms");

    var userListUl = $("#user_list");
    var roomId = $("#roomId").val();
    $.get("/getUsers/"+roomId)
        .done(function (data) {
            var usernames = data.usernames;
            var scores = data.scores;
            for (var i = 0; i < usernames.length; i++) {
                console.log("username: " + usernames[i]);
                var userLiHtml = getUserLiHtml(usernames[i], scores[i]);
                userLi = $(userLiHtml);
                userListUl.append(userLi);
            }
            console.log("get rooms success");          
    });

    //window.setInterval(getUpdates, 5000);
}

function getUserLiHtml(username, score) {
    var userLi = "<tr id=\""+username+"_scoreboard\" value=\""+score+"\"><td>"+username+"</td><td>"+score+"</td></tr>"
    return userLi;
}