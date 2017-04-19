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

var env = require('./environment');
var cfenv = require('cfenv');

var appenv = cfenv.getAppEnv({vcap : env.vcap});

var service = appenv.getService(env.cloudantServiceName);

var db = {};

if (service) {
  db.id = service.name;
  db.username = service.credentials.username;
  db.password = service.credentials.password;
  db.host = service.credentials.host;
  db.port = service.credentials.port;
  db.url = service.credentials.url;
  db.version = service.credentials.version || 'v1';
}

module.exports = db;
