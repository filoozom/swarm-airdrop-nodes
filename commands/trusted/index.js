const config = require("config");
const fs = require("fs");
const path = require("path");
const { StaticPool } = require("node-worker-threads-pool");

// Lib
const { readAddresses } = require("../../lib/csv");

module.exports = (_, command) => {
  const { input, output, chequebooks, chequebookValidation } = command.opts();

  const trusted = readAddresses(input);
  const nodes = new Set(trusted);
  const pool = new StaticPool({
    size: config.get("workers.count"),
    task: path.resolve(__dirname, "./worker.js"),
    workerData: {
      trusted,
      chequebooks: chequebookValidation && readAddresses(chequebooks),
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

    const { from, to, recipients } = result;
    [...recipients].forEach((recipient) => nodes.add(recipient));
    done++;

    const progress = (Math.round((done / jobs) * 10000) / 100).toFixed(2);
    console.log(
      `Fetched from ${from} to ${to} (${progress}%), found ${recipients.size} new recipients (${nodes.size} total)`
    );

    if (done === jobs) {
      pool.destroy();

      const sortedNodes = [...nodes].sort();
      fs.writeFileSync(output, ["address", ...sortedNodes].join("\n") + "\n");
      console.log(`Data saved to ${output}`);
    }
  };

  const { interval, first, latest } = config.get("trusted");

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
