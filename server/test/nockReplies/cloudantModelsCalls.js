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
var testModel = testConstants.testModel;
var testBadBatchModel = testConstants.testBadBatchModel;
var testClonedModel = testConstants.testClonedModel;
var constants = require('../../api//models/constants');
var statuses = constants.statuses;
var service = require('../../config/db');
var dbUrl = service.url;
var dbName = 'mt_custom_models';

var internalTestModel = {
  _id: testModel.custom_model_id,
  _rev: testConstants.test_rev,
  name: testModel.name,
  description: testModel.description,
  base_model_id: testModel.base_model_id,
  domain: testModel.domain,
  source: testModel.source,
  target: testModel.target,
  metadata: {
    _project: testModel.project
  },
  tenant_id: testConstants.testTenantId,
  type: 'model',
  trained_model_id: testModel.trained_model_id,
  status: testModel.status,
  status_date: 'NOW',
  file_batch_id: testModel.file_batch_id
};

var internalCreatedTestModel = {
  _id: testModel.custom_model_id,
  _rev: testConstants.test_rev,
  name: testModel.name,
  description: testModel.description,
  base_model_id: testModel.base_model_id,
  domain: testModel.domain,
  source: testModel.source,
  target: testModel.target,
  metadata: {
    _project: testModel.project
  },
  tenant_id: testConstants.testTenantId,
  type: 'model',
  trained_model_id: constants.UNTRAINED_MODELID,
  status: statuses.CREATED,
  status_date: 'NOW',
  file_batch_id: testModel.file_batch_id
};

var internalCreatedTestModelNoMetadata=function(){
  var tempModel=internalCreatedTestModel;
  delete tempModel.metadata;
  return tempModel;
};

var internalBadBatchTestModel  = {
  _id: testBadBatchModel.custom_model_id,
  _rev: testConstants.test_rev,
  name: testBadBatchModel.name,
  description: testBadBatchModel.description,
  base_model_id: testBadBatchModel.base_model_id,
  domain: testBadBatchModel.domain,
  source: testBadBatchModel.source,
  target: testBadBatchModel.target,
  metadata: {
    _project: testBadBatchModel.project
  },
  tenant_id: testConstants.testTenantId,
  type: 'model',
  trained_model_id: testBadBatchModel.trained_model_id,
  status: testBadBatchModel.status,
  status_date: 'NOW',
  file_batch_id: testBadBatchModel.file_batch_id
};

var getByIdHeaders = {
  'x-couch-request-id': '8576b92f2c',
  server: 'CouchDB/1.0.2 (Erlang OTP/R14B)',
  date: 'Tue, 16 Jun 2015 21:17:27 GMT',
  'content-type': 'application/json',
  'content-length': '41',
  'cache-control': 'must-revalidate',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff;'
};

var createTestModelPostHeaders = {
    'x-couch-request-id': '803c0fd09c',
    server: 'CouchDB/1.0.2 (Erlang OTP/R14B)',
    location: 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/775dcc8af83591c059262a3285959155',
    date: 'Wed, 10 Jun 2015 16:13:29 GMT',
    'content-type': 'application/json',
    'content-length': '95',
    'cache-control': 'must-revalidate',
    'strict-transport-security': 'max-age=31536000',
    'x-content-type-options': 'nosniff;'
};

var createClonedModelPostReply = {
  ok: true,
  id: testConstants.testClonedModel.custom_model_id,
  rev: testConstants.test_rev
};

var getModelsHeaders = {
  'x-couch-request-id': '6ad2ae9a0f',
  'transfer-encoding': 'chunked',
  server: 'CouchDB/1.0.2 (Erlang OTP/R14B)',
  etag: '"14e561f8a7675a9a94306648c0c12d5e"',
  date: 'Thu, 23 Jul 2015 21:37:21 GMT',
  'content-type': 'application/json',
  'cache-control': 'must-revalidate',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff;'
};

var updateTestModelPostReply = {
  ok: true,
  id: testConstants.testModel.custom_model_id,
  rev: testConstants.test_rev_postUpdate
};

var createTestModelPostReply = {
    ok: true,
    id: testConstants.testModel.custom_model_id,
    rev: testConstants.test_rev
};

var getAllOneModelReply = {
  total_rows: 1,
  offset: 0,
  rows: [{
    id: testModel.custom_model_id,
    key: [testConstants.testTenantId],
    value: internalTestModel
  }]
};

var getAllOneModelCreatedReply = {
  total_rows: 1,
  offset: 0,
  rows: [{
    id: testModel.custom_model_id,
    key: [testConstants.testTenantId],
    value: internalCreatedTestModel
  }]
};

var getAllOneModelCreatedReplyNoMetadata = {
  total_rows: 1,
  offset: 0,
  rows: [{
    id: testModel.custom_model_id,
    key: [testConstants.testTenantId],
    value: internalCreatedTestModelNoMetadata()
  }]
};

var getAllByProjectOneModelReply = {
  total_rows: 1,
  offset: 0,
  rows: [{
    id: testModel.custom_model_id,
    key: [testConstants.testTenantId, testModel.project],
    value: internalTestModel
  }]
};


nock(dbUrl)
.persist()
.get('/_session')
.reply(200, {"ok":true,"info":{"authentication_db":"_users","authentication_handlers":["cookie","default"],"authenticated":"default"},"userCtx":{"name":"f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix","roles":["_admin","_reader","_writer"]}}, { 'x-couch-request-id': '5b3a947b35',
server: 'CouchDB/1.0.2 (Erlang OTP/17)',
date: 'Tue, 22 Sep 2015 19:36:47 GMT',
'content-type': 'application/json',
'content-length': '228',
'cache-control': 'must-revalidate',
'strict-transport-security': 'max-age=31536000',
'x-content-type-options': 'nosniff;' });


nock(dbUrl)
.persist()
  .get('/')
  .reply(200, {"couchdb":"Welcome","version":"1.0.2","cloudant_build":"2505"}, { 'x-couch-request-id': '4c764e0c18',
  server: 'CouchDB/1.0.2 (Erlang OTP/17)',
  date: 'Tue, 22 Sep 2015 19:36:47 GMT',
  'content-type': 'application/json',
  'content-length': '64',
  'cache-control': 'must-revalidate',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff;' });

  nock(dbUrl)
  .persist()
    .get('/mt_custom_models')
    .reply(200, {"update_seq":"2256-g1AAAAHMeJzLYWBg4MhgTmGQS0lKzi9KdUhJMtPLTMo1MLDUS87JL01JzCvRy0styQGqY0pkSJL___9_VhIDA2MBqiYjnJqSFIBkkj1MXyxInzxcnyEejQ4gjfEwjUqoFhri1pcA0lcP0pf4D1WTOU5NeSxAkqEBSAH1zc9KfEus9yAaF0A07s9KPE-0_yA6D0B03gf7UYZYP0L0PoDohYQPdxYAEDmR6w","db_name":"mt_custom_models","sizes":{"file":4593245,"external":22537,"active":245769},"purge_seq":0,"other":{"data_size":22537},"doc_del_count":446,"doc_count":34,"disk_size":4593245,"disk_format_version":6,"compact_running":false,"instance_start_time":"0"}, { 'x-couch-request-id': 'd1ad8cfbf1',
    server: 'CouchDB/1.0.2 (Erlang OTP/17)',
    date: 'Tue, 22 Sep 2015 19:36:48 GMT',
    'content-type': 'application/json',
    'content-length': '507',
    'cache-control': 'must-revalidate',
    'strict-transport-security': 'max-age=31536000',
    'x-content-type-options': 'nosniff;' });

//Get the models view document
nock(dbUrl)
  .get('/' + dbName + '/_design/models')
  .reply(200, {
    "_id" : "_design/models",
    "_rev" : "6-84e7e1a457466c4ca7b0e445c5a72ef6",
    "views" : {
      "byTenant" : {
        "version" : 1,
        "map" : "function (doc) { if (doc.type === 'model')  emit([doc.tenant_id], doc) }"
      },
      "byTenantId" : {
        "version" : 1,
        "map" : "function (doc) { if (doc.type === 'model')  emit([doc.tenant_id, doc._id], doc) }"
      },
      "byTenantProject" : {
        "version" : 1,
        "map" : "function (doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.metadata._project], doc) }"
      },
      "countTenantName" : {
        "version" : 1,
        "map" : "function (doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.name],1) }",
        "reduce" : "_count"
      },
      "byCustomModelName" : {
        "version" : 1,
        "map" : "function (doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.name], doc) }"
      }
    }
  }, {
    'x-couch-request-id' : '1b1ed4b3ce',
    server : 'CouchDB/1.0.2 (Erlang OTP/17)',
    etag : '"6-84e7e1a457466c4ca7b0e445c5a72ef6"',
    date : 'Tue, 29 Sep 2015 19:40:43 GMT',
    'content-type' : 'application/json',
    'content-length' : '574',
    'cache-control' : 'must-revalidate',
    'strict-transport-security' : 'max-age=31536000',
    'x-content-type-options' : 'nosniff;'
  });


module.exports.createTestModel = function() {
    return nock(dbUrl)
        .filteringRequestBody(function(body) {
            var newbody = JSON.parse(body);
            newbody.status_date = 'NOW';
            return JSON.stringify(newbody);
        })
        .post('/' + dbName, {
            name: testModel.name,
            description: testModel.description,
            base_model_id: testModel.base_model_id,
            domain: testModel.domain,
            source: testModel.source,
            target: testModel.target,
            metadata: {
                _project: testModel.project
            },
            tenant_id: testConstants.testTenantId,
            type: 'model',
            trained_model_id: constants.UNTRAINED_MODELID,
            status: statuses.CREATED,
            status_date: 'NOW'
        })
        .reply(201, createTestModelPostReply, createTestModelPostHeaders)
}

module.exports.ensureUniqueness_respond1 = function() {
    return nock(dbUrl)
        .get('/' + dbName +'/_design/models/_view/countTenantName')
        .query({
            key: '["' + testConstants.testTenantId + '","' + testModel.name + '"]',
            group: 'true'
        })
        .reply(200, {
                rows: [{
                    key: [testConstants.testTenantId, testModel.name],
                    value: 1
                }]
            },
            getModelsHeaders);
}

module.exports.ensureUniqueness_respond2 = function() {
  return nock(dbUrl)
    .get('/' + dbName +'/_design/models/_view/countTenantName')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testModel.name + '"]',
      group: 'true'
    })
    .reply(200, {
        rows: [{
          key: [testConstants.testTenantId, testModel.name],
          value: 2
        }]
      },
      getModelsHeaders);
}

module.exports.ensureUniquenessCloned_respond1 = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/countTenantName')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testClonedModel.name + '"]',
      group: 'true'
    })
    .reply(200, {
        rows: [{
          key: [testConstants.testTenantId, testClonedModel.name],
          value: 1
        }]
      },
      getModelsHeaders);
}

module.exports.updateModelTestModel = function() {
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
    .post('/' + dbName, {
      _id: testModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: testModel.name,
      description: testModel.description,
      base_model_id: testModel.base_model_id,
      domain: testModel.domain,
      source: testModel.source,
      target: testModel.target,
      metadata: {
        _project: testModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: constants.UNTRAINED_MODELID,
      status: statuses.CREATED,
      status_date: 'NOW',
      file_batch_id: testModel.file_batch_id
    })
    .reply(201, updateTestModelPostReply, createTestModelPostHeaders);
};

module.exports.deleteTestModel = function() {
  return nock(dbUrl)
    .delete('/' + dbName + '/' + testModel.custom_model_id + '?rev=' + testConstants.test_rev)
    .reply(200, {
      ok: true,
      id: testModel.custom_model_id,
      rev: testConstants.test_rev_postUpdate
    }, getModelsHeaders);
}

module.exports.getAllNoModels = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenant')
    .query({
      key: '["' + testConstants.testTenantId + '"]',
      group: 'true'
    })
    .reply(200, {
      "total_rows": 0,
      "offset": 0,
      "rows": []
    }, getModelsHeaders);
}

module.exports.getAllOneModel = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenant')
    .query({
      key: '["' + testConstants.testTenantId + '"]',
      group: 'true'
    })
    .reply(200, getAllOneModelReply, getModelsHeaders);
}


module.exports.getAllOneModelCreated = function() {
   return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenant')
    .query({
      key: '["' + testConstants.testTenantId + '"]',
      group: 'true'
    })
    .reply(200, getAllOneModelCreatedReply, getModelsHeaders);
}

module.exports.getAllOneModelCreatedNoMetadata = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenant')
    .query({
      key: '["' + testConstants.testTenantId + '"]',
      group: 'true'
    })
    .reply(200, getAllOneModelCreatedReplyNoMetadata, getModelsHeaders);
}


module.exports.getAllByProjectOneModel = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantProject')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testModel.project + '"]',
      group: 'true'
    })
    .reply(200, getAllByProjectOneModelReply, getModelsHeaders);
}

module.exports.getByIdNonExisting = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantId')
    .query({
      key: '["' + testConstants.testTenantId + '","' + 'ImaginaryCustomModel' + '"]',
      group: 'true'
    })
    .reply(200, {
      "total_rows": 0,
      "offset": 0,
      "rows": []
    }, getByIdHeaders);
}

module.exports.getByIdTestModel = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantId')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testModel.custom_model_id + '"]',
      group: 'true'
    })
    .reply(200, {
      total_rows: 4,
      offset: 4,
      rows: [{
        id: testModel.custom_model_id,
        key: [testConstants.testTenantId, testModel.custom_model_id],
        value: internalTestModel
      }]
    }, getByIdHeaders);
}

module.exports.getByIdBadBatchTestModel = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantId')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testBadBatchModel.custom_model_id + '"]',
      group: 'true'
    })
    .reply(200, {
      total_rows: 4,
      offset: 4,
      rows: [{
        id: testBadBatchModel.custom_model_id,
        key: [testConstants.testTenantId, testBadBatchModel.custom_model_id],
        value: internalBadBatchTestModel
      }]
    }, getByIdHeaders);
}

module.exports.getByIdTestModelFilesLoaded = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantId')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testModel.custom_model_id + '"]',
      group: 'true'
    })
    .reply(200, {
      total_rows: 4,
      offset: 4,
      rows: [{
        id: testModel.custom_model_id,
        key: [testConstants.testTenantId, testModel.custom_model_id],
        value: {
          _id: testModel.custom_model_id,
          _rev: testConstants.test_rev,
          name: testModel.name,
          description: testModel.description,
          base_model_id: testModel.base_model_id,
          domain: testModel.domain,
          source: testModel.source,
          target: testModel.target,
          metadata: {
            _project: testModel.project
          },
          tenant_id: testConstants.testTenantId,
          type: 'model',
          trained_model_id: constants.UNTRAINED_MODELID,
          status: statuses.FILESLOADED,
          status_date: 'NOW',
          file_batch_id: testModel.file_batch_id
        }
      }]
    }, getByIdHeaders);
}

module.exports.updateTestModelFilesLoadedMarkedForDeletion = function () {
  return nock(dbUrl)
    .post('/' + dbName,
      function (body) {
        return (body._id === testModel.custom_model_id) &&
          (body._rev === testConstants.test_rev) &&
          (body.marked_for_deletion === true);
      })
    .reply(201, {
      "ok" : true,
      "id" : testModel.custom_model_id,
      "rev" : testConstants.test_rev
    }, createTestModelPostHeaders);
}


module.exports.updateModelTestModelAfterTraining = function() {
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
    .post('/' + dbName, {
      _id: testModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: testModel.name,
      description: testModel.description,
      base_model_id: testModel.base_model_id,
      domain: testModel.domain,
      source: testModel.source,
      target: testModel.target,
      metadata: {
        _project: testModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: testModel.trained_model_id,
      status: statuses.TRAINING,
      status_date: 'NOW',
      file_batch_id: testModel.file_batch_id
    })
    .reply(201, {
      "ok": true,
      "id": "88c822ab08f2fa302937dce19e20f1dd",
      "rev": "2-92c3d9e3339a007a14b97f8c1cfffad3"
    }, createTestModelPostHeaders);
};

module.exports.createClonedModel = function() {
  return nock(dbUrl)
    .filteringRequestBody(function(body) {
      try {
        var newbody = JSON.parse(body);
        newbody.status_date = 'NOW';
        newbody.cloned_date = 'NOW';
        return JSON.stringify(newbody);
      } catch (e) {
        return body;
      }
      return body;
    })
    .post('/' + dbName, {
      name: testClonedModel.name,
      description: testClonedModel.description,
      base_model_id: testClonedModel.base_model_id,
      domain: testClonedModel.domain,
      source: testClonedModel.source,
      target: testClonedModel.target,
      metadata: {
        _project: testClonedModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: constants.UNTRAINED_MODELID,
      status: constants.statuses.CREATED,
      status_date: 'NOW',
      cloned_from: testClonedModel.cloned_from,
      cloned_date: 'NOW'
    })
      .reply(201, createClonedModelPostReply, createTestModelPostHeaders);
};

module.exports.createClonedModelCreated = function() {
  return nock(dbUrl)
    .filteringRequestBody(function(body) {
      try {
        var newbody = JSON.parse(body);
        newbody.status_date = 'NOW';
        newbody.cloned_date = 'NOW';
        return JSON.stringify(newbody);
      } catch (e) {
        return body;
      }
      return body;
    })
    .post('/' + dbName, {
      name: testClonedModel.name,
      description: testClonedModel.description,
      base_model_id: testClonedModel.base_model_id,
      domain: testClonedModel.domain,
      source: testClonedModel.source,
      target: testClonedModel.target,
      metadata: {
        _project: testClonedModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: constants.UNTRAINED_MODELID,
      status: constants.statuses.CREATED,
      status_date: 'NOW',
      cloned_from: testClonedModel.cloned_from + 'CREATED',
      cloned_date: 'NOW'
    })
      .reply(201, createClonedModelPostReply, createTestModelPostHeaders);
};


module.exports.updateModelClonedModel = function() {
  return nock(dbUrl)
    .filteringRequestBody(function(body) {
      try {
        var newbody = JSON.parse(body);
        newbody.status_date = 'NOW';
        newbody.cloned_date = 'NOW';
        return JSON.stringify(newbody);
      } catch (e) {
        return body;
      }
      return body;
    })
    .post('/' + dbName, {
      _id: testClonedModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: testClonedModel.name,
      description: testClonedModel.description,
      base_model_id: testClonedModel.base_model_id,
      domain: testClonedModel.domain,
      source: testClonedModel.source,
      target: testClonedModel.target,
      metadata: {
        _project: testClonedModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: constants.UNTRAINED_MODELID,
      status: statuses.FILESLOADED,
      status_date: 'NOW',
      file_batch_id: testClonedModel.file_batch_id,
      cloned_from: testClonedModel.cloned_from,
      cloned_date: 'NOW'
    })
    .reply(201, updateTestModelPostReply, createTestModelPostHeaders);
};

module.exports.updateModelClonedModelCreated = function() {
  return nock(dbUrl)
    .filteringRequestBody(function(body) {
      try {
        var newbody = JSON.parse(body);
        newbody.status_date = 'NOW';
        newbody.cloned_date = 'NOW';
        return JSON.stringify(newbody);
      } catch (e) {
        return body;
      }
      return body;
    })
    .post('/' + dbName, {
      _id: testClonedModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: testClonedModel.name,
      description: testClonedModel.description,
      base_model_id: testClonedModel.base_model_id,
      domain: testClonedModel.domain,
      source: testClonedModel.source,
      target: testClonedModel.target,
      metadata: {
        _project: testClonedModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: constants.UNTRAINED_MODELID,
      status: statuses.CREATED,
      status_date: 'NOW',
      file_batch_id: testClonedModel.file_batch_id,
      cloned_from: testClonedModel.cloned_from+'CREATED',
      cloned_date: 'NOW'
    })
    .reply(201, updateTestModelPostReply, createTestModelPostHeaders);
};


module.exports.getByIdTestModelTraining = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantId')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testModel.custom_model_id + '"]',
      group: 'true'
    })
    .reply(200, {
      total_rows: 4,
      offset: 4,
      rows: [{
        id: testModel.custom_model_id,
        key: [testConstants.testTenantId, testModel.custom_model_id],
        value: {
          _id: testModel.custom_model_id,
          _rev: testConstants.test_rev,
          name: testModel.name,
          description: testModel.description,
          base_model_id: testModel.base_model_id,
          domain: testModel.domain,
          source: testModel.source,
          target: testModel.target,
          metadata: {
            _project: testModel.project
          },
          tenant_id: testConstants.testTenantId,
          type: 'model',
          trained_model_id: testModel.trained_model_id,
          status: statuses.TRAINING,
          status_date: 'NOW',
          file_batch_id: testModel.file_batch_id
        }
      }]
    }, getByIdHeaders);
}

module.exports.updateModelTestModelTrained = function() {
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
    .post('/' + dbName , {
      _id: testModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: testModel.name,
      description: testModel.description,
      base_model_id: testModel.base_model_id,
      domain: testModel.domain,
      source: testModel.source,
      target: testModel.target,
      metadata: {
        _project: testModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: testModel.trained_model_id,
      status: statuses.TRAINED,
      status_date: 'NOW',
      file_batch_id: testModel.file_batch_id
    })
    .reply(201, updateTestModelPostReply, createTestModelPostHeaders);
};

module.exports.updateTestModel = function() {
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
    .post('/' + dbName, {
      _id: testModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: 'MyUpdatedModel',
      description: 'I am updated model',
      base_model_id: testModel.base_model_id,
      domain: testModel.domain,
      source: testModel.source,
      target: testModel.target,
      metadata: {
        _project: testModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: testModel.trained_model_id,
      status: constants.statuses.TRAINED,
      status_date: 'NOW',
      file_batch_id: testModel.file_batch_id
    })
    .reply(201, updateTestModelPostReply, createTestModelPostHeaders);

};


module.exports.modelsViewNotFound = function() {
return nock(dbUrl)
  .get('/' + dbName + '/_design/models')
  .reply(404, {"error":"not_found","reason":"deleted"}, { 'x-couch-request-id': 'e743893cc1',
  server: 'CouchDB/1.0.2 (Erlang OTP/17)',
  date: 'Tue, 29 Sep 2015 19:36:54 GMT',
  'content-type': 'application/json',
  'content-length': '41',
  'cache-control': 'must-revalidate',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff;' });
};


module.exports.loadModelsView = function() {
return nock(dbUrl)
  .put('/' + dbName + '/_design/models', {"views":{"byTenant":{"version":1,"map":"function (doc) { if (doc.type === 'model')  emit([doc.tenant_id], doc) }"},"byTenantId":{"version":1,"map":"function (doc) { if (doc.type === 'model')  emit([doc.tenant_id, doc._id], doc) }"},"byTenantProject":{"version":1,"map":"function (doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.metadata._project], doc) }"},"countTenantName":{"version":1,"map":"function (doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.name],1) }","reduce":"_count"}}})
  .reply(201, {"ok":true,"id":"_design/models","rev":"6-84e7e1a457466c4ca7b0e445c5a72ef6"}, { 'x-couch-request-id': 'c3c5f70b93',
  server: 'CouchDB/1.0.2 (Erlang OTP/17)',
  location: 'http://c05f016b-219e-4250-82cc-0d7961c0b3a1-bluemix.cloudant.com/mt_custom_models/_design%2Fmodels',
  etag: '"6-84e7e1a457466c4ca7b0e445c5a72ef6"',
  date: 'Tue, 29 Sep 2015 19:36:55 GMT',
  'content-type': 'application/json',
  'content-length': '77',
  'cache-control': 'must-revalidate',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff;' });
};

module.exports.updateModelTestModelReadyForTraining = function() {
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
    .post('/' + dbName, {
      _id: testModel.custom_model_id,
      _rev: testConstants.test_rev,
      name: testModel.name,
      description: testModel.description,
      base_model_id: testModel.base_model_id,
      domain: testModel.domain,
      source: testModel.source,
      target: testModel.target,
      metadata: {
        _project: testModel.project
      },
      tenant_id: testConstants.testTenantId,
      type: 'model',
      trained_model_id: constants.UNTRAINED_MODELID,
      status: statuses.FILESLOADED,
      status_date: 'NOW',
      file_batch_id: testModel.file_batch_id
    })
    .reply(201, updateTestModelPostReply, createTestModelPostHeaders);
};

module.exports.getByIdTestModelCreated = function() {
  return nock(dbUrl)
    .get('/' + dbName + '/_design/models/_view/byTenantId')
    .query({
      key: '["' + testConstants.testTenantId + '","' + testModel.custom_model_id + 'CREATED"]',
      group: 'true'
    })
    .reply(200, {
      total_rows: 4,
      offset: 4,
      rows: [{
        id: testModel.custom_model_id + 'CREATED',
        key: [testConstants.testTenantId, testModel.custom_model_id + 'CREATED'],
        value: {
          _id: testModel.custom_model_id + 'CREATED',
          _rev: testConstants.test_rev,
          name: testModel.name,
          description: testModel.description,
          base_model_id: testModel.base_model_id,
          domain: testModel.domain,
          source: testModel.source,
          target: testModel.target,
          metadata: {
            _project: testModel.project
          },
          tenant_id: testConstants.testTenantId,
          type: 'model',
          trained_model_id: constants.UNTRAINED_MODELID,
          status: statuses.CREATED,
          status_date: 'NOW',
          file_batch_id: testModel.file_batch_id + 'CREATED'
        }
      }]
    }, getByIdHeaders);
}
