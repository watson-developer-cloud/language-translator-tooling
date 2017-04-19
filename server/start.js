/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config/environment');

// new style, optional registration
require("./newrelic").initialize();

// ibmwatson dependency
var monitoring = require('ibmwatson-qa-servicemonitoring');
var modelStore = require('./components/modelStore');
var batchStore = require('./components/batchStore');
var app = require('./app');
var server = require('http').createServer(app);

//setup database first
modelStore.setupDB(function (err, response) {
  batchStore.setupDB(function (err, response) {
    //Then Start Listening
    server.listen(config.port, config.ip, function () {
      monitoring();
      console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
    server.timeout = 10*60*1000;
  });
});
