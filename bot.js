const help = require("./commands/help");
const watch = require("./commands/watch");
const unwatch = require("./commands/unwatch");
const send = require("./telegram");

function handleChat(update, vars) {
  if (!update.message) return;
  const message = update.message.text;
  const chatId = update.message.chat.id;
  const fromId = update.message.from.id;

  const isDM = chatId === fromId;

  if (message.startsWith("/help") && isDM) {
    help(chatId, message, send, vars);
  } else if (message.startsWith("/watch") && isDM) {
    watch(chatId, message, send, vars);
  } else if (message.startsWith("/unwatch") && isDM) {
    unwatch(chatId, message, send, vars);
  } else if (isDM) {
    return send(
      chatId,
      "Sorry, I can't understand your message, please use /help to check out commands"
    );
  }
}

module.exports = {
  handleChat,
};
