# Swarm Airdrop

## Context

This is an alternative implementation to verify that the data from the [official code](https://github.com/ethersphere/rise-of-bee-airdrop/blob/main/README.md) is accurate.

## Run this for yourself

```sh
# Show the options to run these scripts
node index.js --help

# Fetch the list of trusted nodes based on data/initial-trusted.csv and write it to data/trusted.csv
node index.js trusted

# Fetch the balances of trusted nodes based on the trusted.csv file and write them to data/balances.csv
node index.js balances

# Calculate the BZZ values that nodes receive based on the data/balances.csv file and write them to data/airdrop.csv
node index.js airdrop
```
