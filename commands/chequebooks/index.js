const config = require("config");
const fs = require("fs");
const path = require("path");
const { StaticPool } = require("node-worker-threads-pool");

module.exports = (_, command) => {
  const { output } = command.opts();
  const nodes = [];
  const pool = new StaticPool({
    size: config.get("workers.count"),
    task: path.resolve(__dirname, "./worker.js"),
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

    const { from, to, chequebooks } = result;
    nodes.push(...chequebooks);
    done++;

    const progress = (Math.round((done / jobs) * 10000) / 100).toFixed(2);
    console.log(
      `Fetched from ${from} to ${to} (${progress}%), found ${chequebooks.length} new chequebooks (${nodes.length} total)`
    );

    if (done === jobs) {
      pool.destroy();

      fs.writeFileSync(
        output,
        ["address", ...nodes.map((node) => node.address)].join("\n") + "\n"
      );
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
