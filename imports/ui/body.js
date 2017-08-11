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

// Template.buttonmenu.events({
//   "click .newgame-button": function() {
//     Session.set("view", "newgame");
//   },
// })
