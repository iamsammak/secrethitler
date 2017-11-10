// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';

import './demonew.html';

// demo create game view
// create new game
// populate with 4 computer players

Template.demonew.events({
  "click .back-button": function() {
    Session.set("view", "startmenu");
  },
  "submit #demonew-form": function(event) {
    event.preventDefault();

    let name = event.target.name.value;
    if (!name) {
      return false;
    }
    if (name.length > 10) {
      return FlashMessages.sendError("Too many characters. Please enter a shorten name.");
    }
    let codename = "demopassword";

    // console.log(`Hello ${name}, welcome to the Game`);
    Meteor.call("newgame", { name: name, codename: codename, demo: true }, (err, res) => {
      if (err) {
        console.error(err);
      }

      [roomId, playerId, code] = res;
      Meteor.subscribe("rooms", code);
      Meteor.subscribe("players", roomId, function() {
        Session.set("roomId", roomId);
        Session.set("playerId", playerId);
        Session.set("view", "demolobby");
      });
    });

    return false;
  }
});
