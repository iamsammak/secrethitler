import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.index.onCreated( function() {
  this.currentTab = new ReactiveVar( "names" );
});

Template.index.helpers({
  tab: function() {
    return Template.instance().currentTab.get();
  },
  tabData: function() {
    let tab = Template.instance().currentTab.get();

    let data = {
      "names": [
        { "name": "Sam", "second": "Mak" },
        { "name": "Sheldon", "second": "Chang" },
        { "name": "Joy", "second": "Wu" },
        { "name": "Calandra", "second": "Chang" },
        { "name": "Melissa", "second": "Lau" },
        { "name": "Bryan", "second": "Lee" },
        { "name": "Andy", "second": "Lau" },
        { "name": "Benjamin", "second": "Pan" },
        { "name": "Brian", "second": "Jean" },
      ],
      "roles": [
        { "name": "Sam", "second": "Facist" },
        { "name": "Sheldon", "second": "Liberal" },
        { "name": "Joy", "second": "Facist" },
        { "name": "Calandra", "second": "Liberal" },
        { "name": "Melissa", "second": "Liberal" },
        { "name": "Bryan", "second": "Hitler" },
        { "name": "Andy", "second": "Liberal" },
        { "name": "Benjamin", "second": "Liberal" },
        { "name": "Brian", "second": "Liberal" },
      ],
      "totem": [
        { "name": "Sam Mak", "second": "6" },
        { "name": "Sheldon", "second": "9" },
        { "name": "Joy", "second": "7" },
        { "name": "Calandra", "second": "8" },
        { "name": "Melissa", "second": "3" },
        { "name": "Bryan", "second": "1" },
        { "name": "Andy", "second": "2" },
        { "name": "Benjamin", "second": "4" },
        { "name": "Brian", "second": "5" },
      ],
    };

    return {contentType: tab, items: data[tab]};
  }
});

Template.index.events({
  'click .nav-tabs li': function(event, template) {
    let currentTab = $(event.target).closest("li");

    currentTab.addClass("active");
    $(".nav-tabs li").not(currentTab).removeClass("active");

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
