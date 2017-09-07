// import { Meteor } from 'meteor/meteor';
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
    let playerId = Session.get("playerId");

    return Players.find({ roomId: roomId }).fetch().map(
      function(player) {
        // console.log(player);
        // set player.current to be player._id if player._id is equal to playerId
        player.current = player._id == playerId;
        return player;
      });
  },
});

Template.gameover.events({
  "click .play-again-button": function() {
    // console.log("So you wanna play again?");
    let roomId = Session.get("roomId");
    Meteor.call("playagain", { roomId: roomId });
  },
});
