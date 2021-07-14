const config = require("config");
const fs = require("fs");
const path = require("path");
const { getDefaultProvider, utils } = require("ethers");
const { parentPort } = require("worker_threads");

// ABI
const ssAbi = require("../abis/ss.json");

// Setup provider and interface
const provider = getDefaultProvider(config.get("ethereum.endpoint"));
const interface = new utils.Interface(ssAbi);

// Trusted nodes
const trustedNodesRaw = fs.readFileSync(
  path.join(__dirname, "data/trusted.csv"),
  "utf8"
);
const trustedNodes = new Set(trustedNodesRaw.split(/\r\n/).slice(1));

parentPort.on("message", async (input) => {
  const { from, to } = input;
  const events = await provider.getLogs({
    topics: [
      "0x950494fc3642fae5221b6c32e0e45765c95ebb382a04a71b160db0843e74c99f",
    ],
    fromBlock: from,
    toBlock: to,
  });

  const recipients = events.flatMap((event) =>
    trustedNodes.has(event.address)
      ? interface.parseLog(event).args.recipient
      : []
  );

  parentPort.postMessage({ ...input, recipients: new Set(recipients) });
});
