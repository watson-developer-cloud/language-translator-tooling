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

var service = appenv.getService(env.objectStorageServiceName);

var storage = {};

if (service) {
  if (service.credentials.auth_url) {
    storage.auth_url = service.credentials.auth_url;
    storage.id = service.name;
    storage.plan = service.plan;
    storage.userId = service.credentials.userId;
    storage.password = service.credentials.password;
    storage.projectId = service.credentials.projectId;
  }
  else {
    storage.id = service.name;
    storage.plan = service.plan;
    storage.auth_uri = service.credentials.auth_uri;
    storage.global_account_auth_uri = service.credentials.global_account_auth_uri;
    storage.username = service.credentials.username;
    storage.password = service.credentials.password;
    storage.version = service.credentials.version || 'v1';
  }
}

module.exports = storage;
