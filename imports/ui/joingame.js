// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';

import './joingame.html';

Template.joingame.events({
  "click .back-button": function() {
    Session.set("view", "startmenu");
  },
  "submit #joingame-form": function(event) {
    event.preventDefault();

    let accessCode = event.target.accesscode.value;
    let name = event.target.name.value;
    if (!name) {
      return false;
    }
    let codename = event.target.codename.value;
    if (!codename) {
      return false;
    }

    accessCode = accessCode.trim().toLowerCase();

    Meteor.subscribe("rooms", accessCode, function() {
      let room = Rooms.findOne({ accessCode: accessCode });
      if (!room) {
        return FlashMessages.sendError("Invalid access code. Watchout for autocorrect.");
      }
      // temp solution
      // need to fix seating/table view reentrance
      // people can current sneak in during seating...
      // I need to do something about add players to the room as the room.state changes from lobby to table
      if (room.state == "table") {
        debugger

        let seats = room.tableSeats;
        let names = seats.map((player) => {return player.name});
        if (!names.includes(name)) {
          return FlashMessages.sendError("Game has already started.");
        }
      }
      // In Game view - reentrance of an active player
      if (room.state == "game" || room.state == "gameover") {
        let players = room.players;
        let names = players.map((player) => {return player.name});
        if (!names.includes(name)) {
          return FlashMessages.sendError("Game has already started.");
        }
      }
      // In the Lobby - filter out people picking the same name
      if ((room.state == "lobby") && (Players.find({roomId: room._id, name: name}).count() > 0)) {
        // need to fix this to allow people in if they have the right codename
        let playerCheck = Players.findOne({roomId: room._id, name: name});
        debugger
        if (playerCheck.codename != codename) {
          return FlashMessages.sendError("Someone already chose that name");
        }
      }

      Meteor.subscribe("players", room._id);
      Meteor.call("joingame", {
                                name: name,
                                codename: codename,
                                roomId: room._id,
                                view: room.state
                              }, (err, res) => {
        if (err) {
          console.log(err);
        }
        [roomId, playerId, view] = res;
        Session.set("roomId", roomId);
        Session.set("playerId", playerId);
        Session.set("view", view);
      });
    });

    return false;
  }
});

Template.joingame.rendered = function() {
  let accessCode = Session.get("accessCode");
  if (accessCode) {
    console.log("join game rendered. Access Code: ", accessCode);
    $("input[name=accesscode]").val(accessCode);
  }
};
