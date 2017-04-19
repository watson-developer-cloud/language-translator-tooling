
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

var nock = require('nock');
var env = require('../../config/environment');
var ltFullUrl = env.endpoints.bluemix;
var index = ltFullUrl.indexOf('/info');
var bluemixUrl = ltFullUrl.substring(0, index);

nock(bluemixUrl)
  .persist()
  .get('/info')
  .reply(200, {"name":"Bluemix","build":"221004","support":"http://ibm.com","version":2,"description":"IBM Bluemix","authorization_endpoint":"https://login.ng.bluemix.net/UAALoginServerWAR","token_endpoint":"https://uaa.ng.bluemix.net","allow_debug":true}, { 'x-backside-transport': 'OK OK',
    connection: 'close',
    'transfer-encoding': 'chunked',
    'content-type': 'application/json;charset=utf-8',
    date: 'Thu, 11 Feb 2016 14:21:05 GMT',
    server: 'nginx',
    'x-cf-requestid': '8106183d-4edc-4041-4e3c-354e68f39b8c',
    'x-cf-warnings': 'Endpoint+deprecated',
    'x-content-type-options': 'nosniff',
    'x-vcap-request-id': '57916655-2479-4265-590e-d8a475722b75::8db37fa0-06a1-4a36-bcb1-9c6ecf64d663',
    'x-client-ip': '86.130.98.78',
    'x-global-transaction-id': '482144847' });


