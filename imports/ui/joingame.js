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

    accessCode = accessCode.trim().toLowerCase();

    Meteor.subscribe("rooms", accessCode, function() {
      let room = Rooms.findOne({ accessCode: accessCode });
      if (!room) {
        return FlashMessages.sendError("Invalid access code. Watchout for autocorrect.");
      }
      if (room.state !== "lobby") {
        return FlashMessages.sendError("Game has already started...try next game.");
      }
      if (Players.find({ roomId: room._id, name: name }).count() > 0) {
        return FlashMessages.sendError("Someone already chose that name. Might I suggest Sebastian");
      }

      Meteor.subscribe("players", room._id);
      Meteor.call("joingame", { name: name, roomId: room._id }, (err, res) => {
        if (err) {
          console.error(err);
        }
        [roomId, playerId] = res;
        Session.set("roomId", roomId);
        Session.set("playerId", playerId);
        Session.set("view", "lobby");
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
