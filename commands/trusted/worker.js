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

  const isValidChequebook = (address) => {
    return !chequebooks || chequebooks.has(address);
  };

  const recipients = events.flatMap((raw) => {
    const event = interface.parseLog(raw);
    const valid = trusted.has(raw.address) && isValidChequebook(raw.address);
    return valid ? event.args.recipient : [];
  });

  parentPort.postMessage({ ...input, recipients: new Set(recipients) });
});
