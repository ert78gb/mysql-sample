'use strict';

const Server = require('expressjs-backend'),
  environment = require('./environment');

let routes = [
  {prefix: '/authentication/v1.0/', controller: require('./routes/login-route')},
];

let server = new Server(environment.app, routes);
server.start();
