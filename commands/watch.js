const db = require("../models");

function createRecord(chat_id, address, network, topic, event) {
  return db.Watch.create({
    chat_id,
    address,
    network,
    topic,
    event,
  });
}

module.exports = function (chatId, message, send, { supportNetworks }) {
  // /watch <address>[@<network>] [ft|nft] [send|receive|approve]
  const args = message.split(" ");

  const [address, network] = args[1].split("@");
  const topic = args[2];
  const event = args[3];

  if (!address || !address.match(/0x[0-9a-zA-Z]{40}/))
    return send(chatId, `${address} is an invalid address`);
  if (topic && !["ft", "nft"].includes(topic)) {
    return send(chatId, `${topic} is not unknown input`);
  }
  if (event && !["send", "receive", "approve"].includes(event)) {
    return send(chatId, `${event} is not unknown event`);
  }

  const createRecords = [];
  (network ? [network] : Object.keys(supportNetworks)).forEach((network) => {
    (topic ? [topic] : ["ft", "nft"]).forEach((topic) => {
      (event ? [event] : ["send", "receive", "approve"]).forEach((event) => {
        createRecords.push(
          createRecord(chatId, address, network, topic, event)
        );
      });
    });
  });

  Promise.all(createRecords)
    .then(() => {
      send(chatId, "Observers are created");
    })
    .catch(() => {
      send(chatId, "Something went wrong");
    });
};
