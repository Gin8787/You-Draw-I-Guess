$(document).ready(function () {
    console.log("rooms");
    populatelist();
});

function enterRoom(i) {
    console.log("enter room: " + i);
    var username = $('#user-username').val();
}

function populatelist() {
    console.log("populatelist the rooms");

    var roomsDiv = $("#rooms");
    $.get("/getRooms")
        .done(function (data) {
            console.log("get rooms success");
            // var data = jQuery.parseJSON(data)
            var roomIDs = data["roomIDs"];
            for (var i = 0; i < roomIDs.length; i++) {
                console.log("roomID: " + i);
                var roomHtml = getRoomHtml(roomIDs[i]);
                roomDiv = $(roomHtml);
                roomsDiv.append(roomDiv);
            }
            console.log("get rooms success");
        });
}

function getRoomHtml(i) {
    var roomHtml = "<div class=\"col-lg-3 col-md-6 col-sm-6 col-xs-12 continfobox\" id=\"list-bax-16\"><div class=\"infobox text-center\"><div class=\"flip-container\"><div class=\"flipper\"><div class=\"col-md-12\"><img class=\"room-img\" src=\"../images/img0.jpg\" alt=\"DRAW\"><div class=\"col-md-12\"><p class=\"room-num\" id=\"room-num\"> Room" + i + " </p></div><div class=\"col-md-12\"><p class=\"room-prompt\"> Come and join us! </p></div><div class=\"enter-room-action\"><a href=\"/enterRoom/" + i + "\"><input type=\"button\" id=\"room-btn" + i + "\" class=\"col-xs-12 btn btn-default btn-susbcr\" value=\"Enter\" onclick=\"window.location.href(\"/enterRoom/" + i + "\")\"> </a></div></div></div></div></div></div>";
    return roomHtml;
}
