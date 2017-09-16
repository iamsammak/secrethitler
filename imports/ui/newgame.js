// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './newgame.html';

// add name length restriction

Template.newgame.events({
  "click .back-btn": function() {
    Session.set("view", "startmenu");
  },
  "submit #newgame-form": function(event) {
    event.preventDefault();

    // console.log(event);

    let name = event.target.name.value;
    if (!name) {
      return false;
    }
    if (name.length > 10) {
      return FlashMessages.sendError("Too many characters. Please enter a shorten name.");
    }
    let codename = event.target.codename.value;
    if (!codename) {
      return false;
    }

    // console.log(`Hello ${name}, welcome to the Game`);
    Meteor.call("newgame", { name: name, codename: codename }, (err, res) => {
      if (err) {
        console.error(err);
      }

      [roomId, playerId, code] = res;
      Meteor.subscribe("rooms", code);
      Meteor.subscribe("players", roomId, function() {
        Session.set("roomId", roomId);
        Session.set("playerId", playerId);
        Session.set("view", "lobby");
        // console.log("going to the lobby");
      });
    });

    return false;
  }
});
