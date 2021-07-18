const config = require("config");
const { getDefaultProvider, utils } = require("ethers");
const { parentPort, workerData } = require("worker_threads");

// ABI
const ssAbi = require("../../abis/ss.json");

// Setup provider and interface
const provider = getDefaultProvider(config.get("ethereum.endpoint"));
const interface = new utils.Interface(ssAbi);

// Worker data
const { trusted, chequebooks } = workerData;

parentPort.on("message", async (input) => {
  const { from, to } = input;
  const events = await provider.getLogs({
    topics: [
      "0x950494fc3642fae5221b6c32e0e45765c95ebb382a04a71b160db0843e74c99f",
    ],
    fromBlock: from,
    toBlock: to,
  });

  const balances = events.flatMap((raw) => {
    const event = interface.parseLog(raw);
    const { totalPayout, beneficiary, recipient } = event.args;

    if (chequebooks && !chequebooks.has(recipient)) {
      return [];
    }

    if (totalPayout.isZero()) {
      return [];
    }

    return {
      beneficiary,
      payout: trusted.has(raw.address) ? totalPayout : 0,
    };
  });

  parentPort.postMessage({ ...input, balances });
});
