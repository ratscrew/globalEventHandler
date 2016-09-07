"use strict";
//import {globalEventHandlerServer} from './server';
var client_1 = require('./client');
var client_2 = require('./client');
exports.globalEventHandlerClient = client_2.globalEventHandlerClient;
exports.globalEvent = client_2.globalEvent;
exports.globalEventLissener = client_2.globalEventLissener;
var globalEventHandler = (function () {
    function globalEventHandler(options) {
        if (options === void 0) { options = {}; }
        this._port = 9838;
        this._client = true;
        this._server = true;
        this._serverAddress = 'localhost';
        this._debug = false;
        for (var _o in options) {
            this['_' + _o] = options[_o];
        }
        if (this._server) {
            var cluster = require('cluster');
            if (cluster.isMaster) {
                this.loanchServer(require('child_process').fork(__dirname + '/server.js', [], { execArgv: ['--debug=5859'] }));
            }
        }
        if (this._client) {
            this._globalEventHandlerClient = new client_1.globalEventHandlerClient(this._port, this._serverAddress);
        }
    }
    Object.defineProperty(globalEventHandler.prototype, "port", {
        get: function () {
            return this._port;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(globalEventHandler.prototype, "client", {
        get: function () {
            return this._client;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(globalEventHandler.prototype, "server", {
        get: function () {
            return this._server;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(globalEventHandler.prototype, "serverAddress", {
        get: function () {
            return this._serverAddress;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(globalEventHandler.prototype, "globalEventHandlerClient", {
        get: function () {
            return this._globalEventHandlerClient;
        },
        enumerable: true,
        configurable: true
    });
    globalEventHandler.prototype.loanchServer = function (server) {
        var me = this;
        server.send({ event: 'connect', port: this._port });
        server.on('exit', function (code, signal) {
            if (signal) {
                if (me._debug)
                    console.log("globalEventServer was killed by signal: " + signal);
            }
            else if (code !== 0) {
                if (me._debug)
                    console.log("globalEventServer exited with error code: " + code);
                var args = [];
                if (me._debug)
                    args.push('--debug=5859');
                me.loanchServer(require('child_process').fork(__dirname + '/server.js', [], { execArgv: args }));
            }
            else {
                if (me._debug)
                    console.log('globalEventServer died!');
            }
        });
    };
    return globalEventHandler;
}());
exports.globalEventHandler = globalEventHandler;
//# sourceMappingURL=index.js.map