import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './body.html';
import './dynamic-test.js';
import './hello-info.js';

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

Template.newgame.events({
  "click .back-btn": function() {
    Session.set("view", "startmenu");
  },
  "submit #newgame-form": function(event) {
    event.preventDefault();

    console.log(event);
    let name = event.target.name.value;
    console.log("Hello", name);
    console.log("add subscription to room and change view to lobby");
  }
});
