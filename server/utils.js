class Utils {
  static createCode(n) {
    if (n === "temp") {
      return "j0v1an";
    }

    let code = "";
    let dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < n; i++) {
      code += dictionary.charAt(Math.floor(Math.random() * dictionary.lenght));
    }

    return code;
  }

  static drawPolicyDeck() {
    let deck = ["fascist", "fascist", "fascist", "fascist", "fascist", "fascist", "fascist", "fascist", "fascist", "fascist", "fascist", "liberal", "liberal", "liberal", "liberal", "liberal", "liberal"];
    return deck;
  }

  static drawRoleCards(n) {
    let roleCards = {
      2: ["hitler", "liberal"],
      3: ["hitler", "liberal", "liberal"],
      4: ["hitler", "liberal", "liberal", "liberal"],
      5: ["hitler", "fascist", "liberal", "liberal", "liberal"],
      6: ["hitler", "fascist", "liberal", "liberal", "liberal", "liberal"],
      7: ["hitler", "fascist", "fascist", "liberal", "liberal", "liberal", "liberal"],
      8: ["hitler", "fascist", "fascist", "liberal", "liberal", "liberal", "liberal", "liberal"],
      9: ["hitler", "fascist", "fascist", "fascist", "liberal", "liberal", "liberal", "liberal", "liberal"],
      10: ["hitler", "fascist", "fascist", "fascist", "liberal", "liberal", "liberal", "liberal", "liberal", "liberal"],
    };
    return roleCards[n];
  }
  
};

export default Utils;
