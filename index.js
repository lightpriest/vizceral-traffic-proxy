const cors = require('cors');
const app = require('express')();
const _ = require('lodash');

const INTERVAL = 15 * 1000; // 15 seconds
const PORT = process.env.PORT || 3000;
const CONFIG = JSON.parse(require('fs').readFileSync(process.env.CONFIG || 'config.json'));

// Load and define our backend (TODO: maybe support multiple backends?)
const backend = require(`./backends/${CONFIG.proxy.backend || 'prometheus'}.js`);
if (CONFIG.proxy.endpoint) {
  backend.endpoint = CONFIG.proxy.endpoint;
}

// Enable CORS
app.use(cors());

// This is the actual interval function that contiously queries the backend
function setupScheduledRefresh(metrics, metric, query, node) {
  backend.fetch(query).then((response) => {
    if (node.renderer === 'region') {
      node.updated = Date.now();
    }

    metrics[metric] = response;
    setTimeout(() => setupScheduledRefresh(metrics, metric, query, node), INTERVAL);
  });
}

// Scan through the traffic tree, and schedule the query function to each connection
function setupMetricTimers(node) {
  _.each(node.connections, (connection) => {
    _.each(connection.metrics, (query, metric) => {
      connection.metrics[metric] = 0;
      setupScheduledRefresh(connection.metrics, metric, query, node);

      if (_.has(node, 'maxVolume') && !_.isNumber(node.maxVolume)) {
        setupScheduledRefresh(node, 'maxVolume', node.maxVolume, node);
      }
    });
  });

  _.each(node.nodes, setupMetricTimers);
}

// Setup the application
const traffic = JSON.parse(JSON.stringify(CONFIG.template));
setupMetricTimers(traffic);

// Expose the data through /
app.get('/', function (req, res) {
  res.json(traffic);
})

// Start the web server
app.listen(PORT, function () {
  console.log(`vizceral-traffic-proxy listening on :${PORT}`)
})
