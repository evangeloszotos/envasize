const fs = require("fs");

function extractValue(source, key, value) {
  const envVariableName = key;
  const finalValue = source[envVariableName];

  if (!finalValue) {
    if (value[buildInKeys.required] && !ignoreReqsGlobally) {
      const error = new Error();
      error.name = "RequiredEnvironmentVariableMissingError";
      error.message = `Variable ${envVariableName}' is flaged as required but is not set!`;
      throw error;
    }
  }

  const fallbackValue = value.hasOwnProperty(buildInKeys.default)
    ? value.default
    : value[key];

  return finalValue || fallbackValue;
}

const buildInKeys = {
  required: "req",
  default: "default"
};

function isMappingValue(value) {
  const keysOfValue = Object.keys(value);
  const valueOfFirstKey = value[keysOfValue[0]];

  const reservedKeys = Object.values(buildInKeys);

  let actualLength = keysOfValue.length;

  reservedKeys.forEach(reservedkey => {
    if (keysOfValue.includes(reservedkey)) {
      actualLength -= 1;
    }
  });

  let isMapping = false;
  if (actualLength === 1) {
    if (typeof valueOfFirstKey !== "object" || valueOfFirstKey === null) {
      isMapping = true;
    }
  }

  return isMapping;
}

let dotenvLines = [];
function toDotenvString(schema, options) {
  dotenvLines = [];

  ignoreReqsGlobally = true;
  envasize(schema, options);
  ignoreReqsGlobally = false;

  const dotenvString = dotenvLines.reduce(
    (acc, cur) => acc + `${cur[0]}${cur[1]}=${cur[2]}\n`,
    ""
  );

  return dotenvString;
}

let ignoreReqsGlobally = false;

function writeDotenv(path, schema, options) {
  if (typeof path === "object") {
    schema = path;
    path = ".env";
  }

  const dotenvString = toDotenvString(schema, options);

  fs.writeFileSync(path, dotenvString);
}

function processEnvironmentVariable(name, valueDescriptor) {
  const dotenvLineParts = [
    valueDescriptor.req ? "" : "#",
    name,
    valueDescriptor[name]
  ];

  // eliminate doubles
  if (!dotenvLines.some(line => line[1] === name)) {
    dotenvLines.push(dotenvLineParts);
  }
}

function envasize(configSchema, options = {}) {
  const {
    src: source = process.env,
    reqRoot = false,
    reqAll = false
  } = options;

  const resultConfig = {};

  Object.entries(configSchema).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null) {
      const keysOfValue = Object.keys(value);

      if (isMappingValue(value)) {
        const envVariableName = keysOfValue[0];

        value.req = value.req || reqAll;

        processEnvironmentVariable(envVariableName, value);

        const extractedValue = extractValue(source, envVariableName, value);
        resultConfig[key] = extractedValue;
      } else {
        resultConfig[key] = envasize(value, options);
      }
    } else {
      const envVariableName = key;
      const uniformedValue = {};

      uniformedValue[buildInKeys.required] = reqRoot || reqAll;
      uniformedValue[envVariableName] = value;

      processEnvironmentVariable(envVariableName, uniformedValue);

      const finalValue = extractValue(source, envVariableName, uniformedValue);
      resultConfig[envVariableName] = finalValue;
    }
  });

  return resultConfig;
}

envasize.toDotenvString = toDotenvString;
envasize.writeDotenv = writeDotenv;

module.exports = envasize;
