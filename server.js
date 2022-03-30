require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const db = require("./models");
const startCron = require("./cron");

const supportNetworks = {};
async function init() {
  const listReq = axios
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
  if (process.env.FIRSTBOOT) {
    await db.Chain.truncate();
    await axios
      .get(
        `https://api.covalenthq.com/v1/chains/status/?format=JSON&key=${process.env.COVALENT_TOKEN}`
      )
      .then(({ data }) => {
        for (const item of data.data.items) {
          if (!item.is_testnet) {
            db.Chain.create({
              chain: item.name,
              lastHeight: item.synced_block_height,
            });
          }
        }
      })
      .catch(() => {
        console.error("obtain initial networks status failed");
        process.exit();
      });
  }
  await listReq;
  startCron(supportNetworks);
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
