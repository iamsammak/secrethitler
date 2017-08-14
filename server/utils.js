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
}

export default Utils;
