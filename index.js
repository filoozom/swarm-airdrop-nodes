const path = require("path");
const { program } = require("commander");
const { version } = require("./package.json");

function parseDirectory(dir) {
  if (dir.startsWith("~")) {
    return path.join(homedir(), dir.slice(2));
  }

  return path.resolve(dir);
}

program.version(version).helpOption("--help");

program
  .command("trusted")
  .description("Fetch nodes that got cheques from trusted nodes")
  .option(
    "-i, --input <input>",
    "input csv file",
    parseDirectory,
    parseDirectory(path.join(__dirname, "data/initial-trusted.csv"))
  )
  .option(
    "-o, --output <output>",
    "output csv file",
    parseDirectory,
    parseDirectory(path.join(__dirname, "data/trusted.csv"))
  )
  .action(require("./commands/trusted"));

program
  .command("balances")
  .description("Fetch eligible airdrop balances from a list of nodes")
  .option(
    "-i, --input <input>",
    "input csv file",
    parseDirectory,
    parseDirectory(path.join(__dirname, "data/trusted.csv"))
  )
  .option(
    "-o, --output <output>",
    "output csv file",
    parseDirectory,
    parseDirectory(path.join(__dirname, "data/balances.csv"))
  )
  .action(require("./commands/balances"));

program
  .command("airdrop")
  .description("Calculate BZZ received by a node based on a balance CSV")
  .option(
    "-i, --input <input>",
    "input csv file",
    parseDirectory,
    parseDirectory(path.join(__dirname, "data/balances.csv"))
  )
  .option(
    "-o, --output <output>",
    "output csv file",
    parseDirectory,
    parseDirectory(path.join(__dirname, "data/airdrop.csv"))
  )
  .action(require("./commands/airdrop"));

program.parse();
