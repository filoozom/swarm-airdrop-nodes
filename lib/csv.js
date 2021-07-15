const fs = require("fs");

const readAddresses = (input) => {
  const data = fs.readFileSync(input, "utf8");
  const addresses = data.split(/\n/).map((string) => string.trim());

  // Remove the CSV header
  if (!addresses[0].startsWith("0x")) {
    addresses.splice(0, 1);
  }

  return new Set(addresses);
};

module.exports = {
  readAddresses,
};
