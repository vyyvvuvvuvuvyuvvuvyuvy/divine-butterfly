const express = require("express");
const axios = require("axios");
const SocksProxyAgent = require("socks-proxy-agent");

// Initialize Express app
const app = express();
const port = 3000;

// Define the Tor proxy
const torProxy = "socks5h://127.0.0.1:9050";
const agent = new SocksProxyAgent(torProxy);

// Middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve a simple HTML form for input
app.get("/", (req, res) => {
  res.send(`
    <form action="/fetch" method="POST">
      <label for="onionUrl">Enter a .onion URL:</label><br><br>
      <input type="text" id="onionUrl" name="onionUrl" required><br><br>
      <input type="submit" value="Fetch">
    </form>
  `);
});

// Function to make a request to a .onion site
async function fetchOnionSite(url) {
  try {
    const response = await axios.get(url, { httpsAgent: agent });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      // Server responded with an error (e.g., 404)
      return {
        success: false,
        message: `Error: ${error.response.status} - ${error.response.statusText}`,
      };
    } else if (error.code === "ECONNREFUSED") {
      // Tor may not be running
      return {
        success: false,
        message: "Connection refused. Please make sure Tor is running.",
      };
    } else {
      // Other network issues
      return { success: false, message: `Network error: ${error.message}` };
    }
  }
}

// Endpoint to handle form submission and fetch the .onion URL
app.post("/fetch", async (req, res) => {
  const { onionUrl } = req.body;

  if (!onionUrl) {
    return res.status(400).send("Please provide a .onion URL.");
  }

  const result = await fetchOnionSite(onionUrl);

  if (result.success) {
    res.send(
      `<h2>Response from ${onionUrl}</h2><pre>${result.data}</pre><br><a href="/">Back</a>`
    );
  } else {
    res
      .status(500)
      .send(`<h2>Error: ${result.message}</h2><br><a href="/">Back</a>`);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Tor browser Node.js app listening at http://localhost:${port}`);
});
