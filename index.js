"use strict";
var server_1 = require('./server');
var client_1 = require('./client');
var gehTestServer = new server_1.globalEventHandlerServer(9838);
var gehTestClient = new client_1.gobalEventHandlerClient(9838, 'localhost');
var _s = gehTestClient.createEvent('testOne', { test: 1 });
var _o = gehTestClient.createEventLissener('lissenToUpdate', { test: 1 });
_s.next(':-)');
setInterval(function () { return _s.next('fire'); }, 1000);
_o.observable.subscribe(function (x) { return console.log(x); });
var child = require('child_process').fork('child.js');
//# sourceMappingURL=index.js.map