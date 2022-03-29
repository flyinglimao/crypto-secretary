require("dotenv").config();
const axios = require("axios");
const url = require("url");

const webhookIdx = process.argv.findIndex((e) => e == "--url");
if (webhookIdx < 0) {
  console.log("No webhook url was set");
} else {
  const webhook = new url.URL(
    `/${process.env.TELEGRAM_WEBHOOK}`,
    process.argv[webhookIdx + 1]
  );
  console.log("reging to " + webhook);

  axios
    .post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`,
      {
        url: webhook,
        allowed_updates: ["message"],
      }
    )
    .then(() => console.log("setting new webhook successed"))
    .catch(() => console.log("setting new webhook failed"));
}

axios
  .post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setMyCommands`,
    {
      commands: ["message"],
    }
  )
  .then(() => console.log("setting commands successed"))
  .catch(() => console.log("setting commands failed"));
