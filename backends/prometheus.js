const rp = require('request-promise');

exports.endpoint = 'http://localhost:9090/api/v1/query';

exports.fetch = (query) => {
  return rp({
    uri: exports.endpoint, qs: { query }, json: true }
  ).then((response) => {
    if (response.status === 'success') {
      return response.data.result.length > 0 ? parseFloat(response.data.result[0].value[1]) : 0;
    } else {
      return 0;
      console.warn(`Failed to fetch ${query}`, response);
    }
  });
}
