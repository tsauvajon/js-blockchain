var wf = WF();

var blockchainConf=
{
    "state": true, // true | false, default is true
    "type": "http", // "http", "net", ... see base/server/
    "name": "Test server", // Server name
    "port": {"http": 9393}, // { "http": 80, "http2":81 }
    "thread": 1, // int value or os.cpus().length
    "engine":
    {
      "http-start": {at: "start"},
      "http-data": {at: "start"},
      "http-zone": {at: "start"},
      "http-page": {at: "start"},
      "http-default": { at: "default"},
      "http-route": {at: "route"},
      "http-error": {at: "error"}
    },
    "map": ["start", "app", "default", "route", "error" ] // Order app/engine launching map
}
module.exports = blockchainConf;
