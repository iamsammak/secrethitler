import { Template } from 'meteor/templating';
import { Rooms, Players } from '../api/collections.js';

import './gameover.html';

Template.gameover.helpers({
  room: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room;
  },
  players: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players;
  },
});

Template.gameover.events({
  "click .play-again-button": function() {
    console.log("So you wanna play again?");
    let roomId = Session.get("roomId");
    Meteor.call("playagain", { roomId: roomId });
  },
});

// play again logic
// should reset the game as new, bring all players back into the lobby
// view should be right before "owner" presses start
// which will allow the addition or departure of players

// Did you add the logic, that executive powers don't active if card is flipped via election tracker
