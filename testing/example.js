"use strict";
var index_1 = require('../index');
var _globalEventHandler = new index_1.globalEventHandler();
var gehTestClient = _globalEventHandler.globalEventHandlerClient;
var _s0 = gehTestClient.createEvent('testOne', { test: 1 });
var _s1 = gehTestClient.createEvent('testTwo', { test: { 'subKey': 1 } });
var _o = gehTestClient.createEventLissener('lissenToUpdate', { test: 1 });
_s0.next(':-)');
setInterval(function () { return _s0.next('fire one'); }, 1000);
setInterval(function () { return _s1.next('fire two'); }, 1000);
_o.observable.subscribe(function (x) { return console.log(x); });
setTimeout(function () {
    _s0.dispose();
}, 5000);
setTimeout(function () {
    _s1.dispose();
    _o.dispose();
}, 10000);
//# sourceMappingURL=example.js.map