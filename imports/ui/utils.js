export const PRESIDENTIALPOWERS = {
  1: { id: 1, name: "Policy Peek", description: "President examines the top three cards. Policy order doesn't change."},
  2: { id: 2, name: "Execution", description: "President must kill a player."},
  3: { id: 3, name: "Investigate Loyalty", description: "President investigates a player's party membership."},
  4: { id: 4, name: "Call Special Election", description: "President picks the next Presidential Candidate."},
  5: { id: 5, name: "Final Execution", description: "President must kill a player. Veto power is now unlocked."},
  6: { id: 6, name: "Veto Power", description: "When the fifth Fascist Policy is enacted, the Executive Branch gains the power to discard all three Policy tiles if both President and Chancellor agrees. Each use of Veto will advance the Election Tracker by one." }
};

export function moveTracker(num) {
  document.getElementById(`tracker-${num}`).classList.toggle("fill");
  if (num === 0) {
    document.getElementById("tracker-1").classList.remove("fill");
    document.getElementById("tracker-2").classList.remove("fill");
    document.getElementById("tracker-3").classList.remove("fill");
  }
};
