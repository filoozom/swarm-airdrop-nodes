const config = require("config");
const fs = require("fs");
const path = require("path");
const { StaticPool } = require("node-worker-threads-pool");
const { BigNumber } = require("ethers");

// Lib
const { readAddresses } = require("../../lib/csv");

module.exports = (_, command) => {
  const { input, output, chequebooks, noChequebookValidation } = command.opts();
  const validateChequebooks = !noChequebookValidation;

  const nodes = new Map();
  const pool = new StaticPool({
    size: config.get("workers.count"),
    task: path.resolve(__dirname, "./worker.js"),
    workerData: {
      trusted: readAddresses(input),
      chequebooks: validateChequebooks && readAddresses(chequebooks),
    },
  });

  let jobs = 0;
  let done = 0;

  const fetch = async (input) => {
    let result;
    try {
      result = await pool.exec(input);
    } catch (err) {
      console.error(err);
      fetch(input);
      return;
    }

    done++;
    const { from, to, balances } = result;

    for (const { beneficiary, payout } of balances) {
      const total = nodes.get(beneficiary) || BigNumber.from(0);
      nodes.set(beneficiary, total.add(payout));
    }

    const progress = (Math.round((done / jobs) * 10000) / 100).toFixed(2);
    console.log(
      `Fetched from ${from} to ${to} (${progress}%), found ${balances.length} new balances (${nodes.size} nodes total)`
    );

    if (done === jobs) {
      pool.destroy();

      fs.writeFileSync(output, "address;balance\n");
      for (const data of [...nodes].sort()) {
        fs.appendFileSync(output, data.join(";") + "\n");
      }
      console.log(`Data saved to ${output}`);
    }
  };

  const { interval, first, latest } = config.get("fetch");

  for (let from = first; from < latest; from += interval) {
    const to = from + interval - 1;
    fetch({
      from,
      to: to > latest ? latest : to,
      first,
      latest,
    });
    jobs++;
  }
};
