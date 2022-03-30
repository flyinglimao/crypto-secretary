const axios = require("axios");
const { Op } = require("@sequelize/core");
const db = require("./models");
const send = require("./telegram");

function genAPI(chainId, topic, lastWorkHeight, latestHeight, pageNumber = 0) {
  return (
    "https://api.covalenthq.com/v1/" +
    chainId +
    "/events/topics/" +
    topic +
    "/?quote-currency=USD&format=JSON&starting-block=" +
    lastWorkHeight +
    "&ending-block=" +
    latestHeight +
    "&key=" +
    process.env.COVALENT_TOKEN +
    "&page-size=3000&page-number=" +
    pageNumber
  );
}

async function infiniteFetch(chainId, topic, lastWorkHeight, latestHeight) {
  let items = [];
  let flag = true;
  let page = 0;
  while (flag) {
    const { data } = await axios
      .get(genAPI(chainId, topic, lastWorkHeight, latestHeight, page++))
      .catch(() => {
        throw new Error();
      });
    items = items.concat(
      data.data.items.map((e) => ({
        token: e.sender_name,
        address: e.sender_address,
        args: e.decoded.params,
        tx: e.tx_hash,
      }))
    );
    flag = data.data.items.length === 300;
  }

  return items;
}

function spawnWorker(supportNetworks, network, lastWorkHeight, latestHeight) {
  const chainId = supportNetworks[network];
  console.log("Working on " + chainId);
  lastWorkHeight = parseInt(lastWorkHeight);
  latestHeight = parseInt(latestHeight);

  // TODO: How to separate?
  const transfer = Promise.all([
    infiniteFetch(
      chainId,
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      lastWorkHeight,
      latestHeight
    ),
    infiniteFetch(
      chainId,
      "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb",
      lastWorkHeight,
      latestHeight
    ),
    infiniteFetch(
      chainId,
      "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
      lastWorkHeight,
      latestHeight
    ),
  ]).then(([erc20erc721, erc1155batch, erc1155single]) => {
    [
      ...erc20erc721.map((e) => ({
        ...e,
        from: e.args && e.args[0] && e.args[0].value,
        to: e.args && e.args[1] && e.args[1].value,
      })),
      ...erc1155batch.map((e) => ({
        ...e,
        from: e.args && e.args[1] && e.args[1].value,
        to: e.args && e.args[2] && e.args[2].value,
      })),
      ...erc1155single.map((e) => ({
        ...e,
        from: e.args && e.args[1] && e.args[1].value,
        to: e.args && e.args[2] && e.args[2].value,
      })),
    ].forEach(async (evt) => {
      const records = await db.Watch.findAll({
        where: {
          address: {
            [Op.or]: [evt.from, evt.to],
          },
          network: network,
        },
      });
      records.forEach((record) => {
        if (record.address === evt.from && record.event === "send") {
          send(
            record.chat_id,
            `[${network} - ${record.event}]
${record.address} sent ${evt.token} (${evt.address}) to ${evt.to} in tx ${evt.tx}`
          );
        }
        if (record.address === evt.to && record.event === "receive") {
          send(
            record.chat_id,
            `[${network} - ${record.event}]
${record.address} received ${evt.token} (${evt.address}) from ${evt.from} in tx ${evt.tx}`
          );
        }
      });
    });
  });

  const approve = Promise.all([
    infiniteFetch(
      chainId,
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      lastWorkHeight,
      latestHeight
    ),
    infiniteFetch(
      chainId,
      "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
      lastWorkHeight,
      latestHeight
    ),
  ]).then(([erc20erc721, erc721erc1155]) => {
    [
      ...erc20erc721.map((e) => ({
        ...e,
        from: e.args && e.args[0] && e.args[0].value,
        to: e.args && e.args[1] && e.args[1].value,
      })),
      ...erc721erc1155
        .filter((e) => e.args && e.args[2] && e.args[2].value)
        .map((e) => ({
          ...e,
          from: e.args && e.args[0] && e.args[0].value,
          to: e.args && e.args[1] && e.args[1].value,
        })),
    ].forEach(async (evt) => {
      const records = await db.Watch.findAll({
        where: {
          address: evt.from,
          network: network,
          event: "approve",
        },
      });
      records.forEach((record) => {
        send(
          record.chat_id,
          `[${network} - ${record.event}]
${record.address} approved ${evt.token} (${evt.address}) to ${evt.to} in tx ${evt.tx}`
        );
      });
    });
  });
  return Promise.all([transfer, approve]);
}

function sleep(time) {
  return new Promise((res) => setTimeout(res, time));
}

module.exports = async function (supportNetworks) {
  const networks = Object.keys(supportNetworks);
  const lastWorkHeight = {};
  const queue = [];

  const lastHeight = await db.Chain.findAll();
  networks.forEach((network) => {
    lastWorkHeight[network] = lastHeight.find(
      (e) => e.chain === network
    ).lastHeight;
  });

  while (true) {
    const latestHeight = await axios
      .get(
        `https://api.covalenthq.com/v1/chains/status/?format=JSON&key=${process.env.COVALENT_TOKEN}`
      )
      .then(({ data }) => {
        const formatted = {};
        for (const item of data.data.items) {
          if (supportNetworks[item.name]) {
            formatted[item.name] = item.synced_block_height;
          }
        }
        return formatted;
      });

    for (const network of networks) {
      if (!queue.find((e) => e[0] === network)) {
        const latestHeightCache = latestHeight[network];
        if (parseInt(lastWorkHeight[network]) >= parseInt(latestHeightCache))
          continue;

        const worker = spawnWorker(
          supportNetworks,
          network,
          lastWorkHeight[network],
          latestHeightCache
        );
        queue.push([network, worker]);
        worker
          .then(async () => {
            lastWorkHeight[network] = latestHeightCache;
            const chainRecord = await db.Chain.findOne({
              where: { chain: network },
            });
            chainRecord.lastHeight = latestHeightCache;
            return chainRecord.save();
          })
          .then(() => {
            if (queue.findIndex((e) => e[0] === network) >= 0)
              queue.splice(
                queue.findIndex((e) => e[0] === network),
                1
              );
          })
          .catch(() => {
            if (queue.findIndex((e) => e[0] === network) >= 0)
              queue.splice(
                queue.findIndex((e) => e[0] === network),
                1
              );
          });
      } else {
        console.log("Network in queue");
      }
      await sleep(500);
    }
  }
};
