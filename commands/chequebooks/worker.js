const config = require("config");
const { getDefaultProvider, utils } = require("ethers");
const { parentPort, workerData } = require("worker_threads");

// ABI
const sw3Abi = require("../../abis/sw3.json");

// Setup provider and interface
const provider = getDefaultProvider(config.get("ethereum.endpoint"));
const interface = new utils.Interface(sw3Abi);

parentPort.on("message", async (input) => {
  const { from, to } = input;
  const events = await provider.getLogs({
    address: "0xf0277CAFfea72734853B834AFC9892461eA18474",
    topics: [
      "0xc0ffc525a1c7689549d7f79b49eca900e61ac49b43d977f680bcc3b36224c004",
    ],
    fromBlock: from,
    toBlock: to,
  });

  const chequebooks = events.flatMap((raw) => {
    const event = interface.parseLog(raw);
    return { address: event.args.contractAddress };
  });

  parentPort.postMessage({ ...input, chequebooks });
});
