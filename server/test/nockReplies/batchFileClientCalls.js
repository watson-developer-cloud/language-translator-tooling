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
// var nockCommon = require('./common_nockreplies');
// var log = require('../../lib/log');
var env = require('../../config/environment');
var fileStorageUrl = env.fileStorageServiceUrl;
var constants = require('../../api//models/constants');
var statuses = constants.statuses;
var testConstants = require('../testConstants');
var testModel = testConstants.testModel;
var testClonedModel = testConstants.testClonedModel;


var getBatchFailsHeaders = {
  'x-backside-transport': 'FAIL FAIL',
  connection: 'close',
  'transfer-encoding': 'chunked',
  'access-control-allow-headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
  'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'access-control-allow-origin': '*',
  'content-type': 'application/json; charset=utf-8',
  date: 'Wed, 24 Jun 2015 11:15:45 GMT',
  etag: 'W/"gJWzcMLdt70uRob3fUYLuw=="',
  'x-cf-requestid': 'de46f525-891d-4c8a-63ae-04d5f6a76ec6',
  'x-powered-by': 'Express',
  'x-client-ip': '86.144.170.220',
  'x-global-transaction-id': '529538'
};

var getFileContentsPostHeaders =
 { 'x-backside-transport': 'OK OK',
  connection: 'Keep-Alive',
  'transfer-encoding': 'chunked',
  'access-control-allow-headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
  'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'access-control-allow-origin': '*',
  'content-type': 'false',
  date: 'Fri, 31 Jul 2015 10:56:37 GMT',
  etag: 'd23edea42d27c005a796e4d6a64fa8a9',
  'last-modified': 'Thu, 30 Jul 2015 22:35:34 GMT',
  'x-cf-requestid': 'd7bd3e83-6723-41c7-4949-e65fd66928c8',
  'x-powered-by': 'Express',
  'x-timestamp': '1438295733.11291',
  'x-trans-id': 'tx9ee255d7998b4b7da6e08-0055bb5465',
  'x-client-ip': '81.151.253.92',
  'x-global-transaction-id': '3610088999' };

var createBatchPostHeaders = {
  'x-backside-transport': 'OK OK',
  connection: 'Keep-Alive',
  'transfer-encoding': 'chunked',
  'access-control-allow-headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
  'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'access-control-allow-origin': '*',
  'content-type': 'application/json; charset=utf-8',
  date: 'Tue, 16 Jun 2015 13:10:15 GMT',
  etag: 'W/"57-6f80971f"',
  'x-cf-requestid': 'ae77e87e-509e-4fef-66bc-697a523a189a',
  'x-powered-by': 'Express',
  'x-client-ip': '86.182.150.23',
  'x-global-transaction-id': '337431315'
};

var deleteBatchHeaders = {
  'x-backside-transport': 'OK OK',
  connection: 'Keep-Alive',
  'access-control-allow-headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
  'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'access-control-allow-origin': '*',
  date: 'Wed, 17 Jun 2015 11:17:09 GMT',
  etag: 'W/"a-b541a50d"',
  'x-cf-requestid': 'a8055782-7306-4105-4ca3-a0ad2cd10d7b',
  'x-powered-by': 'Express',
  'x-client-ip': '195.212.29.80',
  'x-global-transaction-id': '167468064'
};

module.exports.createBatch = function() {
  return nock(fileStorageUrl)
    .post('/batches', "batch_id=" + testModel.file_batch_id)
    .reply(201, {
      ok: true,
      id: testModel.file_batch_id,
      tenant_id: testConstants.testTenantId,
      rev: testConstants.test_batch_rev
    }, createBatchPostHeaders);
}

module.exports.deleteBatch = function() {
  return nock(fileStorageUrl)
    .delete('/batches/' + testModel.file_batch_id)
    .reply(204, "", deleteBatchHeaders);
}

module.exports.getFilesForBadBatch = function() {
  return nock(fileStorageUrl)
    .get('/batches/' + testModel.file_batch_id + '/files')
    .reply(404, {
      "message": "missing",
      "stack": "Error: missing\n    at Request._callback (/home/vcap/app/node_modules/nano/lib/nano.js:234:15)\n    at Request.self.callback (/home/vcap/app/node_modules/nano/node_modules/request/request.js:354:22)\n    at Request.emit (events.js:98:17)\n    at Request.<anonymous> (/home/vcap/app/node_modules/nano/node_modules/request/request.js:1207:14)\n    at Request.emit (events.js:117:20)\n    at IncomingMessage.<anonymous> (/home/vcap/app/node_modules/nano/node_modules/request/request.js:1153:12)\n    at IncomingMessage.emit (events.js:117:20)\n    at _stream_readable.js:944:16\n    at process._tickCallback (node.js:448:13)",
      "name": "Error",
      "error": "not_found",
      "reason": "missing",
      "scope": "couch",
      "statusCode": 404,
      "request": {
        "method": "GET",
        "headers": {
          "content-type": "application/json",
          "accept": "application/json"
        },
        "uri": fileStorageUrl + "/mt_files/NoBatchId"
      },
      "headers": {
        "x-couch-request-id": "199d75b6e9",
        "date": "Wed, 24 Jun 2015 11:15:45 GMT",
        "content-type": "application/json",
        "cache-control": "must-revalidate",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff;",
        "statusCode": 404,
        "uri": fileStorageUrl + "/mt_files/NoBatchId"
      },
      "errid": "non_200",
      "description": "couch returned 404"
    }, getBatchFailsHeaders);
};

module.exports.getFilesForBatch = function() {
  return nock(fileStorageUrl)
    .get('/batches/' + testModel.file_batch_id + '/files')
    .reply(200, [{
      file_name: 'file1.tmx',
      uuid: testConstants.file1_uuid,
      last_modified: '2015-10-26T21:26:44.743Z',
      training_file_option: 'forced_glossary'
    }, {
      file_name: 'file2.tmx',
      uuid: testConstants.file2_uuid,
      last_modified: '2015-10-26T21:30:44.743Z',
      training_file_option: 'forced_glossary'
    }], createBatchPostHeaders);
};

module.exports.getFileContents = function(uuid) {
  return nock(fileStorageUrl)
    .get('/batches/' + testModel.file_batch_id + '/files/' + uuid)
    .reply(200, 'I am the contents of file with uuid ' + uuid, getFileContentsPostHeaders);
};

module.exports.cloneBatch = function() {
  return nock(fileStorageUrl)
    .post('/batches/' + testModel.file_batch_id + '/clone', "batch_id=" + testClonedModel.file_batch_id)
    .reply(201, {
      ok: true,
      id: testClonedModel.file_batch_id,
      tenant_id: testConstants.testTenantId,
      rev: testConstants.test_batch_rev
    }, createBatchPostHeaders);
}
