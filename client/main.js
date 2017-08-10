import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.index.onCreated( funciton() {
  this.currentTab = new ReactiveVar( "books" );
});

Template.index.helpers({
  tab: function() {
    return Template.instance().currentTab.get();
  },
  tabData: funciton() {
    let tab = Template.instance().currentTab.get();

    let data = {
      "names": [
        { "first-name": "Sam", "last-name": "Mak" },
        { "first-name": "Sheldon", "last-name": "Chang" },
        { "first-name": "Joy", "last-name": "Wu" },
        { "first-name": "Calandra", "last-name": "Chang" },
        { "first-name": "Melissa", "last-name": "Lau" },
        { "first-name": "Bryan", "last-name": "Lee" },
        { "first-name": "Andy", "last-name": "Lau" },
        { "first-name": "Benjamin", "last-name": "Pan" },
        { "first-name": "Brian", "last-name": "Jean" },
      ],
      "roles": [
        { "name": "Sam", "hidden": "Facist" },
        { "name": "Sheldon", "hidden": "Liberal" },
        { "name": "Joy", "hidden": "Facist" },
        { "name": "Calandra", "hidden": "Liberal" },
        { "name": "Melissa", "hidden": "Liberal" },
        { "name": "Bryan", "hidden": "Hitler" },
        { "name": "Andy", "hidden": "Liberal" },
        { "name": "Benjamin", "hidden": "Liberal" },
        { "name": "Brian", "hidden": "Liberal" },
      ],
      "totem": [
        { "name": "Sam Mak", "position": "6" },
        { "name": "Sheldon", "position": "9" },
        { "name": "Joy", "position": "7" },
        { "name": "Calandra", "position": "8" },
        { "name": "Melissa", "position": "3" },
        { "name": "Bryan", "position": "1" },
        { "name": "Andy", "position": "2" },
        { "name": "Benjamin", "position": "4" },
        { "name": "Brian", "position": "5" },
      ],
    };

    return data[ tab ];
  }
});

Template.index.events({
  'click .nav-tabs li': function(event, template) {
    let currentTab = $(event.target).closest("li");

    currentTab.addClass("active");
    $(".nav-pills li").not(currentTab).removeClass("active");

    template.currentTab.set(currentTab.data("template"));
  }
});

// Template.hello.onCreated(function helloOnCreated() {
//   // counter starts at 0
//   this.counter = new ReactiveVar(0);
// });
//
// Template.hello.helpers({
//   counter() {
//     return Template.instance().counter.get();
//   },
// });
//
// Template.hello.events({
//   'click button'(event, instance) {
//     // increment the counter when button is clicked
//     instance.counter.set(instance.counter.get() + 1);
//   },
// });
