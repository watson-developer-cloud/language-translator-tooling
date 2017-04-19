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

var redis = require('redis');
var cfenv = require('cfenv');
var _ = require('lodash');
var config = require('./environment');
var log = require('./log');

// We've seen a regular problem with the redis service
//  hosted on Bluemix where we get connection refused errors
//  if we don't send it a message for a long time.
// We were recommended to try a ping every ten minutes or so
//  to avoid this.
function startKeepalive (client) {
  var TEN_MINUTES = 600000;
  setInterval(function redisping () {
    if (!client.pub_sub_mode) {
      client.ping();
    }
  }, TEN_MINUTES);
}

function createOptions (serviceConfig) {
  var options = {};

  if (serviceConfig.credentials.password) {
    options.auth_pass = serviceConfig.credentials.password;
  }

  return options;
}

module.exports = function createClient (options) {

  var client = null,
  serviceConfig = null,
  appEnv = null,
  clientOptions = null;

  appEnv = cfenv.getAppEnv({
    vcap : config.vcap
  });

  if (!serviceConfig) {
    log.info('Getting name of redis service from environment');
    serviceConfig = appEnv.getService(process.env.REDIS_SERVICE_NAME || 'redis');
  }

  if (!serviceConfig) {
    log.info('Using user-provided service connection details for redis');
    serviceConfig = appEnv.getService('redis-ups');
  }

  if (!serviceConfig) {
    //If no redis instance is bound to the app, return null;
    log.info('No redis connection available');

    return null;
  }

  clientOptions = createOptions(serviceConfig);

  if (!!options) {
    clientOptions = _.assign(options, clientOptions);
  }

  log.info({
    port : serviceConfig.credentials.port,
    host : serviceConfig.credentials.host,
    client_options : clientOptions
  }, 'Connecting to redis db');

  // Create the client
  client = redis.createClient(serviceConfig.credentials.port, serviceConfig.credentials.host, clientOptions);

  client.on('error', function handleError (err) {
    log.error({
      error : err
    }, 'Redis error');
  });

  startKeepalive(client);

  return client;
};
