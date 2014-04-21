#!/bin/env node
//  OpenShift sample Node application
var fs = require('fs');
var express = require('express');
var routes = require('./routes').routes;
var path = require('path');


var SampleApp = function () {
    var self = this;

    self.setupVariables = function () {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || 5001;
        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
    };

    self.cache_get = function (key) {
        return self.zcache[key];
    };

    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };


    self.setupTerminationHandlers = function () {
        //  Process on exit and signals.
        process.on('exit', function () {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function (element, index, array) {
                process.on(element, function () {
                    self.terminator(element);
                });
            });
    };

    self.initializeServer = function () {
        self.app = express();
        self.app.use(express.json());       // to support JSON-encoded bodies
        self.app.use(express.urlencoded()); // to support URL-encoded bodies
        self.app.use(express.static(path.join(__dirname, 'public')));
        self.app.use(self.app.router);

        self.app.get('/snapshot', routes.getSnapshot);
        self.app.get('/mastersList', routes.getAllMasters);
        self.app.get('/list', routes.masters);

        self.app.post('/gameOver', routes.closeMaster);
        self.app.post('/startGame', routes.startGameMaster);
        self.app.post('/joinGame', routes.joinGame);
        self.app.post('/playCard', routes.playCard);
        self.app.post('/drawCard', routes.drawCard);
        self.app.post('/drawTwoCard', routes.drawTwoCards);
        self.app.post('/noActionAfterDraw', routes.onNoAction);
        self.app.post('/uno', routes.declareUno);
        self.app.post('/catchPlayer', routes.catchPlayer);
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function () {
        self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function () {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function () {
            console.log('%s: Node server started on %s:%d ...',
                Date(Date.now()), self.ipaddress, self.port);
        });
    };

};
/*  Sample Application.  */


/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

