const config = require("config");
const fs = require("fs");
const path = require("path");
const { StaticPool } = require("node-worker-threads-pool");

const nodes = new Set();
const pool = new StaticPool({
  size: config.get("workers.count"),
  task: "./worker.js",
});

let jobs = 0;
let done = 0;

const fetch = async (input) => {
  try {
    const { from, to, recipients } = await pool.exec(input);
    [...recipients].forEach((recipient) => nodes.add(recipient));
    done++;

    const progress = (Math.round((done / jobs) * 10000) / 100).toFixed(2);
    console.log(
      `Fetched from ${from} to ${to} (${progress}%), found ${recipients.size} new recipients (${nodes.size} total)`
    );

    if (done === jobs) {
      pool.destroy();

      const file = path.join(__dirname, "data/output.csv");
      fs.writeFileSync(file, ["address", ...nodes].join("\n"));
      console.log(`Data saved to ${file}`);
    }
  } catch (err) {
    console.error(err);
    fetch(input);
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
