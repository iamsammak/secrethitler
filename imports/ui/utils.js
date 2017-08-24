import { Rooms, Players } from '../api/collections.js';

export const PRESIDENTIALPOWERS = {
  1: { id: 1, name: "Policy Peek", description: "President examines the top three cards. Policy order doesn't change."},
  2: { id: 2, name: "Execution", description: "President must kill a player."},
  3: { id: 3, name: "Investigate Loyalty", description: "President investigates a player's party membership."},
  4: { id: 4, name: "Call Special Election", description: "President picks the next Presidential Candidate."},
  5: { id: 5, name: "Final Execution", description: "President must kill a player. Veto power is now unlocked."},
  6: { id: 6, name: "Veto Power", description: "When the fifth Fascist Policy is enacted, the Executive Branch gains the power to discard all three Policy tiles if both President and Chancellor agrees. Each use of Veto will advance the Election Tracker by one." }
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
    // FlashMessages.sendInfo(`${room.trackerenact.message}`);
    // flash message only sends to the first instance who pressed continue
    // i want it to flash to everyone and then reset the tracker
    // I can keep track of how many people pressed continue
  }
  if (room.trackerenact.message != "") {
    FlashMessages.sendInfo(`${room.trackerenact.message}`);
  }
};
