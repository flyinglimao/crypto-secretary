require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const supportNetworks = {};
function init() {
  axios
    .get(
      `https://api.covalenthq.com/v1/chains/?format=JSON&key=${process.env.COVALENT_TOKEN}`
    )
    .then(({ data }) => {
      for (const item of data.data.items) {
        if (!item.is_testnet) supportNetworks[item.name] = item.chain_id;
      }
    })
    .catch(() => {
      console.error("obtain supported networks failed");
      process.exit();
    });
}
init();

const bot = require("./bot");

const app = express();
app.use(bodyParser.json());

app.post(`/${process.env.TELEGRAM_WEBHOOK}`, async (req, res) => {
  bot.handleChat(req.body, { supportNetworks });
  res.send({ success: true });
});

app.listen(process.env.PORT, () => console.log("Server Started"));
