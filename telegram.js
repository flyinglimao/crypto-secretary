const axios = require("axios");

module.exports = function send(chatId, message) {
  axios
    .post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
      }
    )
    .then(() => console.log("send message successed"))
    .catch(() => console.log("send message failed"));
};
