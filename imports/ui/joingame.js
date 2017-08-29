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
      // let playerExist = Players.findOne({ roomId: room._id, name: name });
      // debugger
      // if ((room.state !== "lobby") && (playerExist == undefined)) {
      //   return FlashMessages.sendError("Game has already started...try next game.");
      // }
      // if (Players.find({roomId: room._id, name: name}).count() > 0) {
      //
      // }
      // if (playerExist != undefined) {
      //   if (playerExist.codename != codename) {
      //     return FlashMessages.sendError("Someone already chose that name or you've entered the wrong codename");
      //   }
      // }

      Meteor.subscribe("players", room._id);
      Meteor.call("joingame", { name: name, codename: codename, roomId: room._id }, (err, res) => {
        if (err) {
          console.error(err);
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
