import { Rooms, Players } from '../api/collections.js';

export const PRESIDENTIALPOWERS = {
  1: {
    id: 1,
    name: "Investigate Loyalty",
    description: "President investigates a player's party membership.",
    icon: "fa fa-user-secret"
  },
  2: {
    id: 2,
    name: "Policy Peek",
    description: "President examines the top three cards. Policy order doesn't change.",
    icon: "fa fa-low-vision"
  },
  3: {
    id: 3,
    name: "Call Special Election",
    description: "President picks the next Presidential Candidate.",
    icon: "fa fa-street-view"
  },
  4: {
    id: 4,
    name: "Execution",
    description: "President must kill a player.",
    icon: "fa fa-bomb"
  },
  5: {
    id: 5,
    name: "Final Execution",
    description: "President must kill a player. Veto power is now unlocked.",
    icon: "fa fa-rocket"
  },
  6: {
    id: 6,
    name: "Veto Power",
    description: "When the fifth Fascist Policy is enacted, the Executive Branch gains the power to discard all three Policy tiles if both President and Chancellor agrees. Each use of Veto will advance the Election Tracker by one.",
    icon: "fa fa-gavel"
  },
};

export const FASCISTICONS = {
  3: [
    { id: 1, title: "", class: "" },
    { id: 2, title: "investigate loyalty", class: "fa fa-user-secret" },
    { id: 3, title: "policy peek", class: "fa fa-low-vision" },
    { id: 4, title: "execution", class: "fa fa-bomb" },
    { id: 5, title: "final execution", class: "fa fa-rocket" },
    { id: 6, title: "", class: "" },
  ],
  5: [
    { id: 1, title: "", class: "" },
    { id: 2, title: "", class: "" },
    { id: 3, title: "policy peek", class: "fa fa-low-vision" },
    { id: 4, title: "execution", class: "fa fa-bomb" },
    { id: 5, title: "final execution", class: "fa fa-rocket" },
    { id: 6, title: "", class: "" },
  ],
  7: [
    { id: 1, title: "", class: "" },
    { id: 2, title: "investigate loyalty", class: "fa fa-user-secret" },
    { id: 3, title: "call special election", class: "fa fa-street-view" },
    { id: 4, title: "execution", class: "fa fa-bomb" },
    { id: 5, title: "final execution", class: "fa fa-rocket" },
    { id: 6, title: "", class: "" },
  ],
  9: [
    { id: 1, title: "investigate loyalty", class: "fa fa-user-secret" },
    { id: 2, title: "investigate loyalty", class: "fa fa-user-secret" },
    { id: 3, title: "call special election", class: "fa fa-street-view" },
    { id: 4, title: "execution", class: "fa fa-bomb" },
    { id: 5, title: "final execution", class: "fa fa-rocket" },
    { id: 6, title: "", class: "" },
  ],
};

// logic that resets election tracker
export function enactFromTracker() {
  let roomId = Session.get("roomId");
  let room = Rooms.findOne(roomId);
  if (room.electiontracker === 3) {
    let update = { electiontracker: 0 }
    if (room.trackerenact.topcard == "liberal") {
      update.liberal = room.liberal + 1;
    } else if (room.trackerenact.topcard == "fascist") {
      update.fascist = room.fascist + 1;
    }
    Rooms.update(roomId, { $set: update });
  }
  if (room.trackerenact.message != "") {
    FlashMessages.sendInfo(`${room.trackerenact.message}`);
  }
};
