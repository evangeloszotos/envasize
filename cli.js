#! /usr/bin/env node
const yargs = require("yargs");
const envasize = require("./index");
const args = yargs.argv._;

const fs = require("fs");

if (args.length === 1) {
  //console.log("Creating .env");

  try {
    const schema = JSON.parse(fs.readFileSync(args[0]).toString());
    //console.log(schema);
    envasize.writeDotenv(schema);
  } catch (e) {
    console.error(e);
  }
}
else {
    console.log("Please specify exactly one argument with the path to your schema file. e.g.: env.json")
}
