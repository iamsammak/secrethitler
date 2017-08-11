import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './dynamic-test.html';
import './test-content.js';

// template logic for 'dynamictest'
Template.dynamictest.onCreated( function() {
  this.currentTab = new ReactiveVar( "names" );
});

Template.dynamictest.helpers({
  tab: function() {
    return Template.instance().currentTab.get();
  },
  tabData: function() {
    let tab = Template.instance().currentTab.get();

    let data = {
      "names": [
        { "name": "Sam Mak", "second": "I'm down." },
        { "name": "Sheldon Chang", "second": "I want your attention" },
        { "name": "Calandra Chang", "second": "Alphafemale" },
        { "name": "Joy Wu", "second": "Resident artist, I keep it real" },
        { "name": "Melissa Lau", "second": "Hipster who only tunes into things she likes" },
        { "name": "Bryan Lee", "second": "Everyone's best friend" },
        { "name": "Andy Lau", "second": "General" },
        { "name": "Benjamin Pan", "second": "Rare Pokemon" },
        { "name": "Brian Jean", "second": "TFTI" },
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

Template.dynamictest.events({
  'click .nav-tabs li': function(event, template) {
    let currentTab = $(event.target).closest("li");

    currentTab.addClass("active");
    $(".nav-tabs li").not(currentTab).removeClass("active");

    template.currentTab.set(currentTab.data("template"));
  }
});
