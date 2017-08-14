import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { Rooms, Players } from '../api/collections.js';

import './body.html';

import './newgame.js';
import './joingame.js';
import './lobby.js';
import './seating.js';
import './gameover.js';

// testing files
import './dynamic-test.js';
import './hello-info.js';

Tracker.autorun(function roomstate() {
  if (!Session.get("view")) {
    Session.set("view", "startmenu");
  };
  console.log("hello inside Tracker");

  let roomId = Session.get("roomId");
  let playerId = Session.get("playerId");

  if (!roomId || !playerId) {
    console.log("no roomId or playerId...returning now");
    return;
  };

  let room = Rooms.findOne(roomId);
  console.log("room", room);
  let player = Players.findOne(playerId);
  console.log("player", player);

  if (!room || !player) {
    Session.set("roomId", null);
    Session.set("playerId", null);
    Session.set("view", "startmenu");
    return;
  };


});

Template.main.onCreated(function createViewSession() {
  Session.set("view", "startmenu");
  console.log("view set : ", Session.get("view"));
});

Template.main.helpers({
  currentview: function() {
    return Session.get("view");
  }
});

Template.buttonmenu.events({
  "click .newgame-button": function() {
    Session.set("view", "newgame");
    console.log("trying to start a new game");
  },
  "click .joingame-button": function() {
    Session.set("view", "joingame");
    console.log("attempting to join game");
  },
  "click .startmenu-button": function() {
    Session.set("view", "startmenu");
    console.log("view changed to startmenu");
  },
  "click .lobby-button": function() {
    Session.set("view", "lobby");
    console.log("view changed to lobby");
  },
  "click .seating-button": function() {
    Session.set("view", "seating");
    console.log("view changed to seating");
  },
  "click .gameover-button": function() {
    Session.set("view", "gameover");
    console.log("view changed to gameover");
  },
  "click .session-button": function() {
    console.log(Session.get("view"));
  },
});
