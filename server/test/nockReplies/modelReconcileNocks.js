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
var testConstants = require('../testConstants');
var service = require('../../config/db');
var dbUrl = service.url;
var env = require('../../config/environment');
var ltFullUrl = env.endpoints.language_translator;
var index = ltFullUrl.indexOf('/language-translator');
var ltUrl = ltFullUrl.substring(0, index);


module.exports.getModelNock = function () {
  return nock(dbUrl)
    .get('/mt_custom_models/_design/models/_view/byTenantId')
    .query({"key" : '["' + testConstants.testTenantId + '","1d6203bd1698e89ebc7c8f19a5efbac6"]'})
    .reply(200, {
      "total_rows" : 208,
      "offset" : 182,
      "rows" : [{
        "id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
        "key" : ["82d44554-13c0-4c62-b7a4-43b47dcaa807", "1d6203bd1698e89ebc7c8f19a5efbac6"],
        "value" : {
          "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
          "_rev" : "18-64d4bb801d08370468086c2d2452993a",
          "name" : "TestMod01",
          "description" : "",
          "domain" : "news",
          "source" : "es",
          "target" : "en",
          "base_model_id" : "es-en",
          "status" : "TRAINED",
          "editname" : true,
          "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
          "metadata" : {"_project" : "TestProj01"},
          "type" : "model",
          "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
          "status_date" : 1450109027504,
          "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId"
        }
      }]
    }, {
      'x-couch-request-id' : '788ab471c7',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"10aae22baddc391246904e4b047d034a"',
      date : 'Tue, 15 Dec 2015 09:49:49 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getModelMarkedForDeletionNock = function () {
  return nock(dbUrl)
    .get('/mt_custom_models/_design/models/_view/byTenantId')
    .query({"key" : '["' + testConstants.testTenantId + '","1d6203bd1698e89ebc7c8f19a5efbac6"]'})
    .reply(200, {
      "total_rows" : 208,
      "offset" : 182,
      "rows" : [{
        "id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
        "key" : ["82d44554-13c0-4c62-b7a4-43b47dcaa807", "1d6203bd1698e89ebc7c8f19a5efbac6"],
        "value" : {
          "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
          "_rev" : "18-64d4bb801d08370468086c2d2452993a",
          "name" : "TestMod01",
          "description" : "",
          "domain" : "news",
          "source" : "es",
          "target" : "en",
          "base_model_id" : "es-en",
          "status" : "TRAINED",
          "editname" : true,
          "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
          "metadata" : {"_project" : "TestProj01"},
          "type" : "model",
          "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
          "status_date" : 1450109027504,
          "marked_for_deletion" : true,
          "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId"
        }
      }]
    }, {
      'x-couch-request-id' : '788ab471c7',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"10aae22baddc391246904e4b047d034a"',
      date : 'Tue, 15 Dec 2015 09:49:49 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getModelDisconnectedBatchNock = function () {
  return nock(dbUrl)
    .get('/mt_custom_models/_design/models/_view/byTenantId')
    .query({"key" : '["' + testConstants.testTenantId + '","1d6203bd1698e89ebc7c8f19a5efbac6"]'})
    .reply(200, {
      "total_rows" : 208,
      "offset" : 182,
      "rows" : [{
        "id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
        "key" : ["82d44554-13c0-4c62-b7a4-43b47dcaa807", "1d6203bd1698e89ebc7c8f19a5efbac6"],
        "value" : {
          "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
          "_rev" : "18-64d4bb801d08370468086c2d2452993a",
          "name" : "TestMod01",
          "description" : "",
          "domain" : "news",
          "source" : "es",
          "target" : "en",
          "base_model_id" : "es-en",
          "status" : "TRAINED",
          "editname" : true,
          "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
          "metadata" : {"_project" : "TestProj01"},
          "type" : "model",
          "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
          "status_date" : 1450109027504,
          "file_batch_id" : ""
        }
      }]
    }, {
      'x-couch-request-id' : '788ab471c7',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"10aae22baddc391246904e4b047d034a"',
      date : 'Tue, 15 Dec 2015 09:49:49 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getMissingModelNock = function () {
  return nock(dbUrl)
    .get('/mt_custom_models/_design/models/_view/byTenantId')
    .query({"key" : '["' + testConstants.testTenantId + '","1d6203bd1698e89ebc7c8f19a5efbac7"]'})
    .reply(200, {"total_rows" : 209, "offset" : 209, "rows" : []}, {
      'x-couch-request-id' : '1b2b9d04ea',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"42fd65c8488bdce2259c3dca0ecfc8c3"',
      date : 'Tue, 15 Dec 2015 13:44:48 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getDuplicateModelsByNameNock = function () {
  return nock(dbUrl)
    .get('/mt_custom_models/_design/models/_view/byCustomModelName')
    .query({"key" : '["82d44554-13c0-4c62-b7a4-43b47dcaa807","TestMod01"]'})
    .reply(200, {
      "total_rows" : 208,
      "offset" : 182,
      "rows" : [{
        "id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
        "key" : ["82d44554-13c0-4c62-b7a4-43b47dcaa807", "TestMod01"],
        "value" : {
          "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
          "_rev" : "18-64d4bb801d08370468086c2d2452993a",
          "name" : "TestMod01",
          "description" : "",
          "domain" : "news",
          "source" : "es",
          "target" : "en",
          "base_model_id" : "es-en",
          "status" : "TRAINED",
          "editname" : true,
          "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
          "metadata" : {"_project" : "TestProj01"},
          "type" : "model",
          "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
          "status_date" : 1450109027504,
          "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId"
        }
      }]
    }, {
      'x-couch-request-id' : '32503df5af',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"25b3c5b893eed2fad0923f196c9e8107"',
      date : 'Tue, 15 Dec 2015 09:49:52 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.writeModelReconnectingBatchNock = function () {
  return nock(dbUrl)
    .filteringRequestBody(function(body) {
      try {
        var newbody = JSON.parse(body);
        newbody.status_date = 'NOW';
        return JSON.stringify(newbody);
      } catch (e) {
        return body;
      }
      return body;
    })
    .post('/mt_custom_models', {
      "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
      //"_rev" : "19-7a92644a9e08b8786d5959de3af8a9f0",
      "_rev" : "18-64d4bb801d08370468086c2d2452993a",
      "name" : "TestMod01",
      "description" : "",
      "domain" : "news",
      "source" : "es",
      "target" : "en",
      "base_model_id" : "es-en",
      "status" : "TRAINED",
      "editname" : true,
      "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
      "metadata" : {"_project" : "TestProj01"},
      "type" : "model",
      "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
      "status_date" : "NOW",
      "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId"
    })
    .reply(201, {
      "ok" : true,
      "id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
      //"rev" : "20-05cc46e822d6963d5925b7171a082e8d"
      "rev" : "19-7a92644a9e08b8786d5959de3af8a9f0"
    }, {
      'x-couch-request-id' : '5f5f19797a',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/1d6203bd1698e89ebc7c8f19a5efbac6',
      date : 'Tue, 15 Dec 2015 14:46:58 GMT',
      'content-type' : 'application/json',
      'content-length' : '96',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.updateModelForDeletionNock = function () {
  return nock(dbUrl)
    .filteringRequestBody(function(body) {
      try {
        var newbody = JSON.parse(body);
        newbody.status_date = 'NOW';
        return JSON.stringify(newbody);
      } catch (e) {
        return body;
      }
      return body;
    })
    .post('/mt_custom_models', {
      "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
      //"_rev" : "19-7a92644a9e08b8786d5959de3af8a9f0",
      "_rev" : "18-64d4bb801d08370468086c2d2452993a",
      "name" : "TestMod01",
      "description" : "",
      "domain" : "news",
      "source" : "es",
      "target" : "en",
      "base_model_id" : "es-en",
      "status" : "TRAINED",
      "editname" : true,
      "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
      "metadata" : {"_project" : "TestProj01"},
      "type" : "model",
      "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
      "status_date" : "NOW",
      "marked_for_deletion" : true,
      "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId"
    })
    .reply(201, {
      "ok" : true,
      "id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
      //"rev" : "20-05cc46e822d6963d5925b7171a082e8d"
      "rev" : "19-7a92644a9e08b8786d5959de3af8a9f0"
    }, {
      'x-couch-request-id' : '5f5f19797a',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/1d6203bd1698e89ebc7c8f19a5efbac6',
      date : 'Tue, 15 Dec 2015 14:46:58 GMT',
      'content-type' : 'application/json',
      'content-length' : '96',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.deleteCustomModelNock = function () {
  return nock(dbUrl)
  .delete('/mt_custom_models/1d6203bd1698e89ebc7c8f19a5efbac6')
  .query({"rev" : "19-7a92644a9e08b8786d5959de3af8a9f0"})
  .reply(200, {"ok" : true, "id" : "1d6203bd1698e89ebc7c8f19a5efbac6", "rev" : "19-2ca9921be23a2dff4bbb3528d21a5dcb"}, {
    'x-couch-request-id' : '2013b8c583',
    server : 'CouchDB/1.0.2 (Erlang OTP/17)',
    etag : '"19-2ca9921be23a2dff4bbb3528d21a5dcb"',
    date : 'Tue, 15 Dec 2015 16:28:09 GMT',
    'content-type' : 'application/json',
    'content-length' : '96',
    'cache-control' : 'must-revalidate',
    'strict-transport-security' : 'max-age=31536000',
    'x-content-type-options' : 'nosniff;'
  });
}

module.exports.getBatchNock = function () {
  return nock(dbUrl)
    .get('/mt_files/_design/batches/_view/byTenantId')
    .query({"key" : '["' + testConstants.testTenantId + '","1d6203bd1698e89ebc7c8f19a5efbac6BatchId"]'})
    .reply(200, {
      "total_rows" : 199,
      "offset" : 176,
      "rows" : [{
        "id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
        "key" : ["82d44554-13c0-4c62-b7a4-43b47dcaa807", "1d6203bd1698e89ebc7c8f19a5efbac6BatchId"],
        "value" : {
          "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
          "_rev" : "14-b90654a409b5c594f3724d5acdbd8f01",
          "batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
          "batch" : [{
            "file_name" : "esen.tmx",
            "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
            "last_modified" : "2015-12-14T16:02:33.994Z",
            "training_file_option" : "forced_glossary"
          }],
          "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807"
        }
      }]
    }, {
      'x-couch-request-id' : '521dcb9ac0',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"330e80500278c5e01383fe7a1bc4303e"',
      date : 'Tue, 15 Dec 2015 09:49:50 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getNoBatchNock = function () {
  return nock(dbUrl)
    .get('/mt_files/_design/batches/_view/byTenantId')
    .query({"key" : '["' + testConstants.testTenantId + '","1d6203bd1698e89ebc7c8f19a5efbac6BatchId"]'})
    .reply(200, {"total_rows" : 199, "offset" : 199, "rows" : []}, {
      'x-couch-request-id' : 'efded7b38d',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"a3160289fc9491718681c38f05c16e59"',
      date : 'Tue, 15 Dec 2015 15:19:16 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getFileCountForDeletion = function () {
  return nock(dbUrl)
    .get('/mt_files/_design/files/_view/countFileUse')
    .query({"key" : '["' + testConstants.testTenantId + '","112ceed4-6331-4f00-bc5d-e91c81ed7291"]'})
    //.query({"key" : "%5B%2282d44554-13c0-4c62-b7a4-43b47dcaa807%22%2C%227a679aa5-139b-45b5-a788-f086262f07ac%22%5D"})
    .reply(200, {"rows" : [{"key" : null, "value" : 1}]}, {
      'x-couch-request-id' : '8fe7b30e50',
      'transfer-encoding' : 'chunked',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"31b8800e900bf45990c4bd2f93928bf8"',
      date : 'Tue, 15 Dec 2015 16:28:06 GMT',
      'content-type' : 'application/json',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.createBatchNock = function () {
  return nock(dbUrl)
  .put('/mt_files/1d6203bd1698e89ebc7c8f19a5efbac6BatchId', {
    "batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
    "batch" : [],
    "tenant_id" : testConstants.testTenantId
  })
  .reply(201, {
    "ok" : true,
    "id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
    "rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131"
  }, {
    'x-couch-request-id' : 'd1655ead83',
    server : 'CouchDB/1.0.2 (Erlang OTP/17)',
    location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_files/4f19eaa41a4d8cdf8d7819cab6e1d538BatchId',
    etag : '"9-6cf6a3a979534c2de0c41b4cf7ce1131"',
    date : 'Tue, 15 Dec 2015 15:19:18 GMT',
    'content-type' : 'application/json',
    'content-length' : '102',
    'cache-control' : 'must-revalidate',
    'strict-transport-security' : 'max-age=31536000',
    'x-content-type-options' : 'nosniff;'
  });
}

module.exports.deleteBatch = function () {
  return nock(dbUrl)
    .delete('/mt_files/1d6203bd1698e89ebc7c8f19a5efbac6BatchId')
    .query({"rev" : "14-b90654a409b5c594f3724d5acdbd8f01"})
    .reply(200, {
      "ok" : true,
      "id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
      "rev" : "30-bc25d3f868b3aaeeb5be356dea71e268"
    }, {
      'x-couch-request-id' : 'a8b97bb00d',
      server : 'CouchDB/1.0.2 (Erlang OTP/17)',
      etag : '"30-bc25d3f868b3aaeeb5be356dea71e268"',
      date : 'Tue, 15 Dec 2015 16:28:08 GMT',
      'content-type' : 'application/json',
      'content-length' : '103',
      'cache-control' : 'must-revalidate',
      'strict-transport-security' : 'max-age=31536000',
      'x-content-type-options' : 'nosniff;'
    });
}

module.exports.getFileNock = function () {
  return nock('https://dal05.objectstorage.softlayer.net:443')
    .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/' + testConstants.testTenantId)
    .reply(200, [{
      "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
      "last_modified" : "2015-12-14T16:02:35.313740",
      "bytes" : 4964,
      "name" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
      "content_type" : "false"
    }], {
      'content-length' : '181',
      'x-container-object-count' : '1',
      'accept-ranges' : 'bytes',
      'x-storage-policy' : 'standard',
      'x-container-bytes-used' : '4964',
      'x-timestamp' : '1449850097.00724',
      'content-type' : 'application/json; charset=utf-8',
      'x-trans-id' : 'tx1c9ca7c763de457c95d6b-00566fe23f',
      date : 'Tue, 15 Dec 2015 09:49:51 GMT',
      connection : 'keep-alive'
    });
}

module.exports.getFileForDeletion = function () {
  return nock('https://dal05.objectstorage.softlayer.net:443')
    //.get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/82d44554-13c0-4c62-b7a4-43b47dcaa807')
    .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/'+ testConstants.testTenantId)
    .reply(200, [{
      "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
      "last_modified" : "2015-12-14T16:02:35.313740",
      "bytes" : 4964,
      "name" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
      "content_type" : "false"
    }, {
      "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
      "last_modified" : "2015-12-15T16:25:17.805280",
      "bytes" : 4964,
      "name" : "7a679aa5-139b-45b5-a788-f086262f07ac",
      "content_type" : "false"
    }], {
      'content-length' : '362',
      'x-container-object-count' : '2',
      'accept-ranges' : 'bytes',
      'x-storage-policy' : 'standard',
      'x-container-bytes-used' : '9928',
      'x-timestamp' : '1449850097.00724',
      'content-type' : 'application/json; charset=utf-8',
      'x-trans-id' : 'tx6f3fd687941341c89ef99-0056703f96',
      date : 'Tue, 15 Dec 2015 16:28:06 GMT',
      connection : 'keep-alive'
    });
}

module.exports.deleteFileForDeletion = function () {
  return nock('https://dal05.objectstorage.softlayer.net:443')
    .delete('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/'+ testConstants.testTenantId + '/112ceed4-6331-4f00-bc5d-e91c81ed7291')
    .reply(204, "", {
      'content-length' : '0',
      'content-type' : 'text/html; charset=UTF-8',
      'x-trans-id' : 'txb9bd0726954545bca00fa-0056703f97',
      date : 'Tue, 15 Dec 2015 16:28:07 GMT',
      connection : 'keep-alive'
    });
}

module.exports.getTrainedModelsNock = function () {
  return nock(ltUrl)
  .get('/language-translator/api/v2/models')
  .query({"default" : "false"})
  .reply(200, {
    "models" : [{
      "model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
      "source" : "es",
      "target" : "en",
      "base_model_id" : "es-en",
      "domain" : "news",
      "customizable" : false,
      "default_model" : false,
      "owner" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
      "status" : "available",
      "name" : "TestMod01",
      "train_log" : null
    }, {
      "model_id" : "ar-en-conversational",
      "source" : "ar",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "en-ar-conversational",
      "source" : "en",
      "target" : "ar",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "en-es-conversational",
      "source" : "en",
      "target" : "es",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "en-fr-conversational",
      "source" : "en",
      "target" : "fr",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "en-pt-conversational",
      "source" : "en",
      "target" : "pt",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "es-en-conversational",
      "source" : "es",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "es-en-patent",
      "source" : "es",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "patent",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "fr-en-conversational",
      "source" : "fr",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "ko-en-patent",
      "source" : "ko",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "patent",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "pt-en-conversational",
      "source" : "pt",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "conversational",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "pt-en-patent",
      "source" : "pt",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "patent",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }, {
      "model_id" : "zh-en-patent",
      "source" : "zh",
      "target" : "en",
      "base_model_id" : "",
      "domain" : "patent",
      "customizable" : false,
      "default_model" : false,
      "owner" : "",
      "status" : "available",
      "name" : "",
      "train_log" : null
    }]
  }, {
    'x-backside-transport' : 'OK OK',
    connection : 'Keep-Alive',
    'transfer-encoding' : 'chunked',
    'content-disposition' : 'inline',
    'x-watson-userinfo' : 'bluemix-instance-id=82d44554-13c0-4c62-b7a4-43b47dcaa807',
    'x-service-api-version' : '2.2-SNAPSHOT',
    vary : 'Accept-Encoding',
    pragma : 'no-cache',
    date : 'Tue, 15 Dec 2015 09:49:51 GMT',
    'content-type' : 'application/json;charset=utf-8',
    server : '-',
    'set-cookie' : ['Watson-DPAT=Rc43bPwrSO92AUdildieAg164ChMEcL2YTEImM4hpbeP0PSZmSyAljUVnLV9iNViDZ88416%2Bg2%2BiZdvU8c4862iHz7ICvvzfDJYv%2B3FlM9rEGCKl9MPIj5O5aZ3UBV0NEqBBSFsLDAwBPEDcWAFPGdeGBT0qM5E4IUoKrRZXL7IIo3l9yYT4xBgShDMzWlUynN%2FgBGvopruA%2FnvT6IFydZWouGcxQZsPi3JgTWp9pmHTWqQRMWjx3M9mB1HrKob89ttjuw4gbWEna9S664CaX4msQibH0ydd5IXs6bnkK6rrhD40WkyqJ0IU0dEuQhRahjWGR7enX%2BvZna%2FTHbt0TCjPFlIU2Nab4P21VDiOnZLYjR2OEqKkPHWNexIO07%2BVFLw6aFbSlCDVRXPwLtOWFnDWQMa183YHb%2BEBTniCbPTLuyU4ki2wH3%2BoDdW3SYUQ67oWMip3Gz9Bz0mwIbN4%2FGpBbjDFifcR9X5cDDeburS1%2BlfqeY8jRxRHs%2FV9ZvasHObF0DijindQx8906yooicJrvrm7mKBPE%2B44tlFsQm54GqLNIflBOEVS5gzJvy2iyr7clCMzEA0LxVP2nAL87U7U4VHSBJJ%2BwjwntZyBlinzldrV2i%2FuQcAJ62vFhmwxloVNM3788Z5wB7vC1LzlIiWQsyFol%2F6WDOi7Ht%2FzWPdvu6G8zU45UhwRgXGLmREGAbA4X3rwuSXUeS6GlnoMfsxw2cEbsGy6THKaAoe%2BQJHvoPNkFTSM0nSU%2BoEInBsJjc2wzgJQ0ErXYvRJFe9sqpOd7bzGmu4FpW2%2BQaOsUJMIoNn1TTMBIeNgDoiyb5chvAE%2BRbKa9frwskjrF5xvViytttagJuozrSZeWk5mKmOxmd2qzyYg8Q%3D%3D; path=/language-translator/api; secure; HttpOnly'],
    'x-client-ip' : '86.22.205.225',
    'x-global-transaction-id' : '338304981',
    'x-dp-watson-tran-id' : 'csf_platform_prod_dp01-338304981',
    'x-watson-user-customize-allowed': 'true'
  });
}

module.exports.deleteTrainedModel = function () {
  return nock(ltUrl)
    .delete('/language-translator/api/v2/models/7d705343-d503-4e82-9232-c6be75db03fc')
    .reply(200, {"status" : "OK"}, {
      'x-backside-transport' : 'OK OK',
      connection : 'Keep-Alive',
      'transfer-encoding' : 'chunked',
      'content-disposition' : 'inline',
      'x-service-api-version' : '2.2-SNAPSHOT',
      pragma : 'no-cache',
      date : 'Tue, 15 Dec 2015 16:28:05 GMT',
      'content-type' : 'text/plain;charset=utf-8',
      server : '-',
      'set-cookie' : ['Watson-DPAT=1rZsB%2B0C2XT3xDN%2FjP6pPkEDxaWDHl%2BfkaWQorANtb%2BxlsHJV8BE28X1oXebvruaglL5hvy%2BxJUnHD5AtQHur1aM1Xj0ne0hmpJZdIcw035vtSb%2B%2FhGpzXjG%2BpwijxQZGcBSsy41N2wywS1s4Qx1elYMsxeRdma2vRK7Ve1TPS2dYCiZjqGe1tVtoWHEccD7WolxmL6cdqe%2BTiAPRBXunEqDhBMsL7oEEzB3oUAXgduWEw0yncRPQgS%2Fq6E3osw9zml2WizzeakD0AVO8p2DtID14iJbUnyj2DrHC0fF0zyNgdOOb6g6LfD%2BOrZvn0UrpubtCb8rSocgIyJS4c81sml%2B6PpFeHcQetyI0TfvcZ8TQrINxQGBuukjkL7SiQR8K9iIQ0A5DskS%2BK347EfUC2oAc4S9Dqf2hGCfAeG12QgADbozsBXN%2Fx7VXGUoYvnXaAQSmATUzW24l8mB%2BqXqQbNGM1PHeMzb%2FpscaL9rGi7%2FyTRUH9anxZVDx9nOe75PxhL3le0v0hB87MvwY7TTq16nkCI7WxwjNtBUGuoo%2FEeFdhjrEWl2R5AeiypaucHTKQM8iIpi%2B4Wr3TGytwtP9EBsVC3Pz%2B%2FZgkEkRuDPnVrBy0RTlXn1ZB8OD9b%2BO1EhQzxP2aVheEtbnG3H8TTddV4Lepdg91%2BWoNCp%2BsU9qfS2EhbfmDF3vhyvd7zVs1zuba8B9aPeGmSnQux5m6auFrvt2%2FOrRYXaKNWbLFO1oEIddU1izIE7G012BMUAav4sFLq0%2BeVMEvDp9cpgms8DvPJ1NtgObx9nLswucjGd8u%2BxEPeIdJdmZlphzpeLe%2F9cIPtyRX0asCU8AT1k6LX2gLOcwhfZvS%2FwjXbQ5S5nJJANrHsZu47O40%2FdM6Xd8%2FvZ1d3fgehc2YSa9vFBVo4Jzw%3D%3D; path=/language-translator/api; secure; HttpOnly'],
      'x-client-ip' : '86.22.205.225',
      'x-global-transaction-id' : '358786517',
      'x-dp-watson-tran-id' : 'csf_platform_prod_dp01-358786517'
    });
}

