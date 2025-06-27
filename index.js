// Dependencies
const { Notion } = require("@neurosity/notion");
require("dotenv").config();

// Authentication
const deviceId = process.env.DEVICE_ID || "";
const email = process.env.EMAIL || "";
const password = process.env.PASSWORD || "";

const verifyEnvs = (email, password, deviceId) => {
  const invalidEnv = (env) => {
    return env === "" || env === 0;
  };
  if (invalidEnv(email) || invalidEnv(password) || invalidEnv(deviceId)) {
    console.error(
      "Please verify deviceId, email and password are in .env file, quitting..."
    );
    process.exit(0);
  }
};
verifyEnvs(email, password, deviceId);
console.log(`${email} attempting to authenticate to ${deviceId}`);

// Instantiating a notion
const notion = new Notion({
  deviceId,
});

const main = async () => {
  await notion
    .login({
      email,
      password,
    })
    .catch((error) => {
      console.log(error);
      throw new Error(error);
    });

  notion.calm().subscribe((calm) => {
    const timestamp = new Date().toLocaleTimeString();
    if (calm.probability > 0.1 && calm.probability < 0.19) {
      console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟥");
    } else if (calm.probability > 0.2 && calm.probability < 0.29) {
      console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟧");
    } else if (calm.probability > 0.3 && calm.probability < 0.39) {
      console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟩");
    } else if (calm.probability > 0.4) {
      console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟦");
    }
  });
  console.log("Logged in");
};
main();
