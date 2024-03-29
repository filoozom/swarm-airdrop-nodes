const fs = require("fs");
const { BigNumber } = require("ethers");
const BN = require('bignumber.js');

BN.config({ DECIMAL_PLACES: 25 })

const readCsv = (input) => {
  const data = fs.readFileSync(input, "utf8");
  const addresses = data
    .trim()
    .split(/\n/)
    .map((string) => string.trim().split(";"));

  // Remove the CSV header
  if (!addresses[0][0].startsWith("0x")) {
    addresses.splice(0, 1);
  }

  const nodes = new Map();
  let sum = BigNumber.from(0);

  for (const [beneficiary, balance] of addresses) {
    nodes.set(beneficiary, BigNumber.from(balance));
    sum = sum.add(balance);
  }

  return { sum, nodes };
};

module.exports = (_, command) => {
  const { input, output } = command.opts();
  const { sum, nodes } = readCsv(input);
  const airdrop = BigNumber.from(10).pow(16 + 6);

  console.log(`Read ${input}, sum of balances: ${sum}`);

  fs.writeFileSync(output, "address;plur\n");
  for ([beneficiary, balance] of nodes) {
    fs.appendFileSync(
      output,
      `${beneficiary};${BN(balance.toString())
        .times(airdrop.toString())
        .div(sum.toString())
        .plus(BigNumber.from(10).pow(15).toString())
        .toFixed(0)}\n`
    );
  }
  console.log(`Data saved to ${output}`);

  const clean = 'data.csv'
  fs.writeFileSync(clean, "address;plur\n");
  for ([beneficiary, balance] of nodes) {
    if (balance.isZero()) {
      continue
    }

    fs.appendFileSync(
      clean,
      `${beneficiary};${BN(balance.toString())
        .times(airdrop.toString())
        .div(sum.toString())
        .toFixed(0)}\n`
    );
  }
  console.log(`Data saved to ${clean}`);

  const airdropOutput = 'airdrop.json'
  const balances = []
  for ([beneficiary, balance] of nodes) {
    balances.push({
      id: beneficiary,
      balance: balance.isZero()
        ? "0" 
        : BN(balance.toString())
            .times(airdrop.toString())
            .div(sum.toString())
            .toFixed(0)
    });
  }
  fs.writeFileSync(airdropOutput, JSON.stringify({ balances }))
  console.log(`Data saved to ${airdropOutput}`);
};
