vizceral-traffic-proxy
======================

A web server that acts as a proxy between vizceral clients and the
metrics server. It currently only supports prometheus, but adding new backends
should be easy enough.

It queries the backend at specific intervals and serves the last
traffic snapshot it has upon request.

Running
-------

```sh
$ git clone git@github.com:lightpriest/vizceral-traffic-proxy.git
$ cd vizceral-traffic-proxy
$ npm install
$ cp config.json.example config.json
$ node index.js
$ curl http://localhost:3000/
```

Configuration
-------------

By default, it will try to load `config.json`. To change that, set the
environment variable `CONFIG` to the desired file.

### `config.json`

The configuration is pretty much self explanatory. There are two
main sections: `proxy` and `template`.

```json
{
  "proxy": { },
  "template": { }
}
```

#### `proxy`

The proxy section describes which backend to connect to and the
endpoint to use.

```json
{
  "proxy": {
    "backend": "prometheus",
    "endpoint": "http://localhost:9090/api/v1/query"
  }
}
```

#### `template`

The template section is the actual traffic tree that the web server uses and
will return. All of the fields are left untouched except for the
`connections.$.metrics.metric` and `nodes.$.maxVolume`. They are used as
queries to the backend and will be replaced with the returned value when.

See metrics object in the following example:

```json
{
  "template": {
    "renderer": "global",
    "name": "edge",
    "nodes": [
      {
        "name": "INTERNET"
      },
      {
        "renderer": "region",
        "name": "us-east-1"
      }
    ],
    "connections": [
      {
        "source": "INTERNET",
        "target": "us-east-1",
        "metrics": {
          "normal": "rate(http_request_counter{region='us-east-1',host='web01',status_code=~'2..'}[1m])",
          "warning": "rate(http_request_counter{region='us-east-1',host='web01',status_code=~'4..'}[1m])",
          "danger": "rate(http_request_counter{region='us-east-1',host='web01',status_code=~'5..'}[1m])"
        }
      }
    ]
  }
}
```

### Port (Default: 3000)

By default, it will expose the latest traffic tree on port 3000.
To change that, set the environment variable `PORT`.

TODO
----

- [ ] Handle errors in configuration file
- [ ] Write tests
- [ ] Graphite backend should be easy to write
