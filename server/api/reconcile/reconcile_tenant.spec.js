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

var chai = require('chai');
var nock = require('nock');
var sinon = require('sinon');
var HTTPStatus = require('http-status');
var request = require('supertest');
var express = require('express');
var promise = require('bluebird');

//Setup to use test implementations of a few methods
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

var testConstants = require('../../test/testConstants');
var cloudantModelsNock = require('../../test/nockReplies/cloudantModelsCalls');
var nockCloudantBatches = require('../../test/nockReplies/cloudantBatchesCalls');
var objectStorageCalls = require('../../test/nockReplies/objectStorageCalls');
var ltNock = require('../../test/nockReplies/ltCalls');
var modelReconcileNocks = require('../../test/nockReplies/modelReconcileNocks');
var bluemixOAuthNock = require('../../test/nockReplies/bluemixOAuthNock');

var cloudantService = require('../../config/db');
var cloudantUrl = cloudantService.url;

var constants = require('../models/constants.js');

var urlPrefix = '/api/reconcile' + '/' + testConstants.testTenantId;

var mocks = require('../../test/mocks');
//Setup mock ensureAuthenticated function
var mockrest = new mocks.RESTMock();

function setup (batchStore, modelStore, callback) {
  batchStore.setupDB(function (err, response) {
    modelStore.setupDB(function (err, response) {
      callback();
    });
  });
}

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

//RECONCILE TENANT TESTS

describe('Reconciliation - tenant specific', function () {

  before(function (done) {

    this.originalExportTesting = process.env.EXPORT_ALL_FOR_TESTING;
    process.env.EXPORT_ALL_FOR_TESTING = 'true';

    this.modelStore = require('../../components/modelStore');
    this.batchStore = require('../../components/batchStore');

    this.reconcileController = require('./reconcile.controller.js');

    this.reconcile = proxyquire('./index', {
      '../../config/rest' : mockrest
    });

    this.routes = proxyquire('../../routes', {
      './api/reconcile' : this.reconcile
    });

    this.expressSettings = require('../../config/express');

    this.app = express();
    this.expressSettings(this.app);
    this.routes(this.app);

    setup(this.batchStore, this.modelStore, done);

  });

  after(function () {
    if (this.originalExportTesting) {
      process.env.EXPORT_ALL_FOR_TESTING = this.originalExportTesting;
    }
  });

  describe('Reconciler: Empty run through: Given a valid tenantid ', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getReconcilliationStatus").returns(promise.resolve({
          "reconciled" : [],
          "unreconciled" : {}
        }));
      });

      after(function () {
        this.reconcileController.getReconcilliationStatus.restore();
      });

      it('Then it should return status ' + HTTPStatus.OK, function (done) {
        request(this.app).get('/api/reconcile/ca74df5e-3a62-4d92-85fc-809d85a30436/reconcile')
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          }).end(done);
      });

    })
  });

  describe('Reconciler: Empty run through to raise an error: Given a valid tenantid ', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getReconcilliationStatus").returns(promise.resolve({
          "reconciled" : [],
          "unreconciled" : {
            "customModels" : 'handbag'
          }
        }));
      });

      after(function () {
        this.reconcileController.getReconcilliationStatus.restore();
      });

      it('Then it should return status ' + 500, function (done) {
        request(this.app).get('/api/reconcile/ca74df5e-3a62-4d92-85fc-809d85a30436/reconcile')
          .expect(function (res) {
            if (res.statusCode !== 500) return 'Expected a ' + 500 + ' return code';
          }).end(done);
      });

    })
  });

  describe('Reconciler: Run through with an orphan file and orphan batch: Given a valid tenantid ', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getReconcilliationStatus").returns(promise.resolve({
          "reconciled" : [],
          "unreconciled" : {
            "customModels" : [
              {
                "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "_rev" : "22-93c38000c508c12152b4caf8b24855da",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : constants.UNTRAINED_MODELID,
                "editname" : true,
                "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
                "metadata" : {
                  "_project" : "TestProj01"
                },
                "type" : "model",
                "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
                "status_date" : "​1450109027504",
                "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
                "custom_model_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "project" : "TestProj01",
                "file_batch_details" : [
                  {
                    "file_name" : "esen.tmx",
                    "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7292",
                    "last_modified" : "2015-12-14T16:02:33.994Z",
                    "training_file_option" : "forced_glossary"
                  }
                ],
                "filesMissing" : [
                  "112ceed4-6331-4f00-bc5d-e91c81ed7292"
                ],
                "reconcileProblem" : "MISSING FILE",
              }, {
                "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "_rev" : "22-93c38000c508c12152b4caf8b24855da",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : constants.UNTRAINED_MODELID,
                "editname" : true,
                "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
                "metadata" : {
                  "_project" : "TestProj01"
                },
                "type" : "model",
                "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
                "status_date" : "​1450109027504",
                "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
                "custom_model_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "project" : "TestProj01",
                "file_batch_details" : [
                  {
                    "file_name" : "esen.tmx",
                    "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7292",
                    "last_modified" : "2015-12-14T16:02:33.994Z",
                    "training_file_option" : "forced_glossary"
                  }
                ],
                "reconcileProblem" : "MISSING BATCH",
              }, {
                "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "_rev" : "22-93c38000c508c12152b4caf8b24855da",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : constants.UNTRAINED_MODELID,
                "editname" : true,
                "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
                "metadata" : {
                  "_project" : "TestProj01"
                },
                "type" : "model",
                "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
                "status_date" : "​1450109027504",
                "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
                "custom_model_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "project" : "TestProj01",
                "file_batch_details" : [
                  {
                    "file_name" : "esen.tmx",
                    "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7292",
                    "last_modified" : "2015-12-14T16:02:33.994Z",
                    "training_file_option" : "forced_glossary"
                  }
                ],
                "reconcileProblem" : "BATCH USED ELSEWHERE",
              }, {
                "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "_rev" : "22-93c38000c508c12152b4caf8b24855da",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : constants.UNTRAINED_MODELID,
                "editname" : true,
                "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
                "metadata" : {
                  "_project" : "TestProj01"
                },
                "type" : "model",
                "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
                "status_date" : "​1450109027504",
                "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
                "custom_model_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "project" : "TestProj01",
                "file_batch_details" : [
                  {
                    "file_name" : "esen.tmx",
                    "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7292",
                    "last_modified" : "2015-12-14T16:02:33.994Z",
                    "training_file_option" : "forced_glossary"
                  }
                ],
                "reconcileProblem" : "MISSING TRAINED MODEL",
              }, {
                "_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "_rev" : "22-93c38000c508c12152b4caf8b24855da",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : constants.UNTRAINED_MODELID,
                "editname" : true,
                "tenant_id" : "82d44554-13c0-4c62-b7a4-43b47dcaa807",
                "metadata" : {
                  "_project" : "TestProj01"
                },
                "type" : "model",
                "trained_model_id" : "7d705343-d503-4e82-9232-c6be75db03fc",
                "status_date" : "​1450109027504",
                "file_batch_id" : "1d6203bd1698e89ebc7c8f19a5efbac6BatchId",
                "custom_model_id" : "1d6203bd1698e89ebc7c8f19a5efbac6",
                "project" : "TestProj01",
                "file_batch_details" : [
                  {
                    "file_name" : "esen.tmx",
                    "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7292",
                    "last_modified" : "2015-12-14T16:02:33.994Z",
                    "training_file_option" : "forced_glossary"
                  }
                ],
                "reconcileProblem" : "INCORRECT STATUS",
              }
            ],
            "batches" : {
              "1d6203bd1698e89ebc7c8f19a5efbac6BatchId" : [
                {
                  "file_name" : "esen.tmx",
                  "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
                  "last_modified" : "2015-12-14T16:02:33.994Z",
                  "training_file_option" : "forced_glossary"
                }
              ]
            },
            "files" : {
              "112ceed4-6331-4f00-bc5d-e91c81ed7291" : {
                "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
                "last_modified" : "2015-12-14T16:02:35.313740",
                "bytes" : 4964,
                "name" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
                "content_type" : "false"
              }
            }
          }
        }));
        sinon.stub(this.reconcileController, "deleteFiles").returns(promise.resolve([{
          "file deleted" : 'yes'
        }]));
        sinon.stub(this.reconcileController, "deleteBatches").returns(promise.resolve([{
          "batch deleted" : 'yes'
        }]));
        sinon.stub(this.reconcileController, "repairIncompleteBatchesInCustomModels").returns(promise.resolve([{
          "repaired IncompleteBatchesInCustomModels" : 'yes'
        }]));
        sinon.stub(this.reconcileController, "repairMissingBatchesInCustomModels").returns(promise.resolve([{
          "repaired MissingBatchesInCustomModels" : 'yes'
        }]));
        sinon.stub(this.reconcileController, "repairDuplicateBatchesInCustomModels").returns(promise.resolve([{
          "repaired DuplicateBatchesInCustomModels" : 'yes'
        }]));
        sinon.stub(this.reconcileController, "removeMissingTrainedModelsFromCustomModels").returns(promise.resolve([{
          "removed MissingTrainedModelsFromCustomModels" : 'yes'
        }]));
        sinon.stub(this.reconcileController, "fixCustomModelStatus").returns(promise.resolve([{
          "fixed CustomModelStatus" : 'yes'
        }]));


      });

      after(function () {
        this.reconcileController.getReconcilliationStatus.restore();
        this.reconcileController.deleteFiles.restore();
        this.reconcileController.deleteBatches.restore();
        this.reconcileController.repairIncompleteBatchesInCustomModels.restore();
        this.reconcileController.repairMissingBatchesInCustomModels.restore();
        this.reconcileController.repairDuplicateBatchesInCustomModels.restore();
        this.reconcileController.removeMissingTrainedModelsFromCustomModels.restore();
        this.reconcileController.fixCustomModelStatus.restore();
      });

      it('Then it should return status ' + HTTPStatus.OK, function (done) {
        request(this.app).get('/api/reconcile/ca74df5e-3a62-4d92-85fc-809d85a30436/reconcile')
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          }).end(done);
      });

    })
  });

  describe('Reconciler: Deleting an orphan file: Given an array with a single valid fileuuid and a valid tenantID and there is no error deleting the file', function () {
    describe('When I get a response', function () {


      it('Then it should return an array of one element', function () {

        var countFileNock =
          nock(cloudantUrl)
            .get('/mt_files/_design/files/_view/countFileUse')
            .query({key : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","5f70b139-6db3-4b53-93a0-63713a570fe4"]'})
            .reply(200, {"rows" : []}, {
              'x-couch-request-id' : 'b3a74c512c',
              'transfer-encoding' : 'chunked',
              server : 'CouchDB/1.0.2 (Erlang OTP/17)',
              etag : '"e1593b4a7564dc5a5346a2761fa7506d"',
              date : 'Tue, 10 Nov 2015 10:49:53 GMT',
              'content-type' : 'application/json',
              'cache-control' : 'must-revalidate',
              'strict-transport-security' : 'max-age=31536000',
              'x-content-type-options' : 'nosniff;'
            });

        var getFileNock = nock('https://dal05.objectstorage.softlayer.net:443')
          .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/ca74df5e-3a62-4d92-85fc-809d85a30436%')
          .reply(200, [{
            "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
            "last_modified" : "2015-11-06T17:13:19.768680",
            "bytes" : 4964,
            "name" : "1ef612a0-6664-4f72-acea-fda20f5543bf",
            "content_type" : "false"
          }, {
            "hash" : "0034eaacfc2e422d9d5b24b51e3bb81f",
            "last_modified" : "2015-11-10T10:48:38.765000",
            "bytes" : 7674,
            "name" : "5f70b139-6db3-4b53-93a0-63713a570fe4",
            "content_type" : "false"
          }], {
            'content-length' : '362',
            'x-container-object-count' : '2',
            'accept-ranges' : 'bytes',
            'x-storage-policy' : 'standard',
            'x-container-bytes-used' : '12638',
            'x-timestamp' : '1446559154.35936',
            'content-type' : 'application/json; charset=utf-8',
            'x-trans-id' : 'tx362b3aacb4c34455bc1b0-005641cbd2',
            date : 'Tue, 10 Nov 2015 10:49:54 GMT',
            connection : 'keep-alive'
          });

        var deleteFileNock = nock('https://dal05.objectstorage.softlayer.net:443')
          .delete('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/ca74df5e-3a62-4d92-85fc-809d85a30436%/5f70b139-6db3-4b53-93a0-63713a570fe4')
          .reply(204, "", {
            'content-length' : '0',
            'content-type' : 'text/html; charset=UTF-8',
            'x-trans-id' : 'txa6521bb7976f46a7b60da-005641cbd3',
            date : 'Tue, 10 Nov 2015 10:49:55 GMT',
            connection : 'keep-alive'
          });

        return this.reconcileController.deleteFiles('ca74df5e-3a62-4d92-85fc-809d85a30436%', ['5f70b139-6db3-4b53-93a0-63713a570fe4']).then(function (data) {
          countFileNock.done();
          getFileNock.done();
          deleteFileNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.equal(data[0]._settledValue.deleted, 'yes', 'Deleted should be yes');
        });

      });

    });
  });

  describe('Reconciler: Deleting an orphan file: Given an empty array', function () {
    describe('When I get a response', function () {

      it('Then it should return an empty array', function () {
        //return reconcileController.deleteFiles')('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
        return this.reconcileController.deleteFiles('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });
    });
  });

  describe('Reconciler: Deleting an orphan file: Given an array with a single valid fileuuid and a valid tenantID but the file count>0', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var countFileNock =
          nock(cloudantUrl)
            .get('/mt_files/_design/files/_view/countFileUse')
            .query({key : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","5f70b139-6db3-4b53-93a0-63713a570fe4"]'})
            .reply(200, {"rows" : ['1']}, {
              'x-couch-request-id' : 'b3a74c512c',
              'transfer-encoding' : 'chunked',
              server : 'CouchDB/1.0.2 (Erlang OTP/17)',
              etag : '"e1593b4a7564dc5a5346a2761fa7506d"',
              date : 'Tue, 10 Nov 2015 10:49:53 GMT',
              'content-type' : 'application/json',
              'cache-control' : 'must-revalidate',
              'strict-transport-security' : 'max-age=31536000',
              'x-content-type-options' : 'nosniff;'
            });

        return this.reconcileController.deleteFiles('ca74df5e-3a62-4d92-85fc-809d85a30436%', ['5f70b139-6db3-4b53-93a0-63713a570fe4']).then(function (data) {
          countFileNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.equal(data[0]._settledValue.deleted, 'no', 'Deleted should be no');
        });

      });

    });
  });

  //BATCH RECONCILE TESTS

  describe('Reconciler: Deleting an orphan batch: Given an array with a single valid batchuuid and a valid tenantID and there is no error deleting the batch', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var getBatchNock = nock(cloudantUrl)
          .get('/mt_files/_design/batches/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","52daa30bac7d266b4add5c2039d8d5caBatchId"]'})
          .reply(200, {
            "total_rows" : 175,
            "offset" : 148,
            "rows" : [{
              "id" : "52daa30bac7d266b4add5c2039d8d5caBatchId",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "52daa30bac7d266b4add5c2039d8d5caBatchId"],
              "value" : {
                "_id" : "52daa30bac7d266b4add5c2039d8d5caBatchId",
                "_rev" : "7-3e89da6d26d4503620af776fc7b3bafa",
                "batch_id" : "52daa30bac7d266b4add5c2039d8d5caBatchId",
                "batch" : [],
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436"
              }
            }]
          }, {
            'x-couch-request-id' : '5a121ada02',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"c76083a2b66668e35e4a85da06bede9a"',
            date : 'Wed, 11 Nov 2015 14:29:21 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var deleteBatchNock = nock(cloudantUrl)
          .delete('/mt_files/52daa30bac7d266b4add5c2039d8d5caBatchId')
          .query({"rev" : "7-3e89da6d26d4503620af776fc7b3bafa"})
          .reply(200, {
            "ok" : true,
            "id" : "52daa30bac7d266b4add5c2039d8d5caBatchId",
            "rev" : "8-e5c203927fa4b16b43303f594eded8eb"
          }, {
            'x-couch-request-id' : '622edecb4e',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"8-e5c203927fa4b16b43303f594eded8eb"',
            date : 'Wed, 11 Nov 2015 14:29:22 GMT',
            'content-type' : 'application/json',
            'content-length' : '102',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        return this.reconcileController.deleteBatches('ca74df5e-3a62-4d92-85fc-809d85a30436%', ['52daa30bac7d266b4add5c2039d8d5caBatchId']).then(function (data) {
          getBatchNock.done();
          deleteBatchNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.equal(data[0]._settledValue.deleted, 'yes', 'Deleted should be yes');
        });
      });
    });
  });

  describe('Reconciler: Deleting an orphan batch: Given an empty array', function () {
    describe('When I get a response', function () {

      it('Then it should return an empty array', function () {
        return this.reconcileController.deleteBatches('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });
    });
  });


//REPAIR MISSING FILES IN BATCH TESTS

  describe('Reconciler: Repair an incomplete batch: Given an array with a single valid batchuuid and a valid tenantID and there is no error repairing the batch', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var getBatchNock = nock(cloudantUrl)
          .get('/mt_files/_design/batches/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","a6c6480f2aff163f8ec172ccac640195BatchId"]'})
          .reply(200, {
            "total_rows" : 174,
            "offset" : 142,
            "rows" : [{
              "id" : "a6c6480f2aff163f8ec172ccac640195BatchId",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "a6c6480f2aff163f8ec172ccac640195BatchId"],
              "value" : {
                "_id" : "a6c6480f2aff163f8ec172ccac640195BatchId",
                "_rev" : "3-0ae0e91c3f98e9585fa5ad466223c4f6",
                "batch_id" : "a6c6480f2aff163f8ec172ccac640195BatchId",
                "batch" : [{
                  "file_name" : "esen.tmx",
                  "uuid" : "1ef612a0-6664-4f72-acea-fda20f5543bg",
                  "last_modified" : "2015-11-06T17:13:18.423Z",
                  "training_file_option" : "forced_glossary"
                }],
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436"
              }
            }]
          }, {
            'x-couch-request-id' : 'ab1bcaab98',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"78736195bd7d3bd68abee2c60f3b0cf8"',
            date : 'Wed, 11 Nov 2015 15:49:39 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var putBatchNock = nock(cloudantUrl)
          .put('/mt_files/a6c6480f2aff163f8ec172ccac640195BatchId')
          .reply(201, {
            "ok" : true,
            "id" : "a6c6480f2aff163f8ec172ccac640195BatchId",
            "rev" : "4-20b6ac420ec038b277bf1673431f0f55"
          }, {
            'x-couch-request-id' : '68db2f304d',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_files/a6c6480f2aff163f8ec172ccac640195BatchId',
            etag : '"4-20b6ac420ec038b277bf1673431f0f55"',
            date : 'Wed, 11 Nov 2015 15:49:40 GMT',
            'content-type' : 'application/json',
            'content-length' : '102',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var Models = [{
          _id : 'a6c6480f2aff163f8ec172ccac640195',
          _rev : '5-d1cba70ff2517457e93b5e3df36fe24b',
          name : 'TestMod01',
          description : '',
          domain : 'news',
          source : 'es',
          target : 'en',
          base_model_id : 'es-en',
          status : 'TRAINED',
          editname : true,
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          type : 'model',
          trained_model_id : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00',
          status_date : 1447152537126,
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640195',
          project : 'TestProj01',
          file_batch_details : [{
            "file_name" : "esen.tmx",
            "uuid" : "1ef612a0-6664-4f72-acea-fda20f5543bg",
            "last_modified" : "2015-11-06T17:13:18.423Z",
            "training_file_option" : "forced_glossary"
          }],
          filesMissing : ['1ef612a0-6664-4f72-acea-fda20f5543bg'],
          reconcileProblem : 'MISSING FILE',
          trained_model_details : {
            model_id : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00',
            source : 'es',
            target : 'en',
            base_model_id : 'es-en',
            domain : 'news',
            customizable : false,
            default_model : false,
            owner : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
            status : 'available',
            name : 'TestMod01',
            train_log : null
          }
        }];

        return this.reconcileController.repairIncompleteBatchesInCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', Models).then(function (data) {
          getBatchNock.done();
          putBatchNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.isDefined(data[0]._settledValue.deleted, 'Deleted should be yes');
        });
      });
    });
  });

  describe('Reconciler: Repair an incomplete batch: Given an empty array', function () {
    describe('When I get a response', function () {
      it('Then it should return an empty array', function () {
        return this.reconcileController.repairIncompleteBatchesInCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });

    });
  });

//REPAIR MISSING BATCHES IN MODEL TESTS

  describe('Reconciler: Repair an missing batch: Given an array with a single valid model and a valid tenantID and there is no error repairing the model', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {
        var getModelNock = nock(cloudantUrl)
          .get('/mt_custom_models/_design/models/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","a6c6480f2aff163f8ec172ccac640195"]'})
          .reply(200, {
            "total_rows" : 168,
            "offset" : 157,
            "rows" : [{
              "id" : "a6c6480f2aff163f8ec172ccac640195",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "a6c6480f2aff163f8ec172ccac640195"],
              "value" : {
                "_id" : "a6c6480f2aff163f8ec172ccac640195",
                "_rev" : "5-d1cba70ff2517457e93b5e3df36fe24b",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : "TRAINED",
                "editname" : true,
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
                "metadata" : {"_project" : "TestProj01"},
                "type" : "model",
                "trained_model_id" : "1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00",
                "status_date" : 1447152537126,
                "file_batch_id" : "a6c6480f2aff163f8ec172ccac640195BatchId"
              }
            }]
          }, {
            'x-couch-request-id' : '63b8219548',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"8a1654fb13376c442f3b23874516844c"',
            date : 'Wed, 11 Nov 2015 16:40:21 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var putBatchNock = nock(cloudantUrl)
          .put('/mt_files/a6c6480f2aff163f8ec172ccac640195BatchId')
          .reply(201, {
            "ok" : true,
            "id" : "a6c6480f2aff163f8ec172ccac640195BatchId",
            "rev" : "4-20b6ac420ec038b277bf1673431f0f55"
          }, {
            'x-couch-request-id' : '68db2f304d',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_files/a6c6480f2aff163f8ec172ccac640195BatchId',
            etag : '"4-20b6ac420ec038b277bf1673431f0f55"',
            date : 'Wed, 11 Nov 2015 15:49:40 GMT',
            'content-type' : 'application/json',
            'content-length' : '102',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var putModelNock = nock(cloudantUrl)
          .post('/mt_custom_models',
            {
              "_id" : "a6c6480f2aff163f8ec172ccac640195",
              "_rev" : "5-d1cba70ff2517457e93b5e3df36fe24b",
              "name" : "TestMod01",
              "description" : "",
              "domain" : "news",
              "source" : "es",
              "target" : "en",
              "base_model_id" : "es-en",
              "status" : "TRAINED",
              "editname" : true,
              "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
              "metadata" : {"_project" : "TestProj01"},
              "type" : "model",
              "trained_model_id" : "1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00",
              "status_date" : 1447152537126,
              "file_batch_id" : "a6c6480f2aff163f8ec172ccac640195BatchId"
            }
          )
          .reply(201, {
            "ok" : true,
            "id" : "a6c6480f2aff163f8ec172ccac640195",
            "rev" : "6-74f2c50021bc6b1d34196466e7c3de95"
          }, {
            'x-couch-request-id' : '5638956142',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/a6c6480f2aff163f8ec172ccac640195',
            date : 'Wed, 11 Nov 2015 16:40:22 GMT',
            'content-type' : 'application/json',
            'content-length' : '95',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var Models = [
          {
            '_id' : 'a6c6480f2aff163f8ec172ccac640195',
            '_rev' : '5-d1cba70ff2517457e93b5e3df36fe24b',
            'name' : 'TestMod01',
            'description' : '',
            'domain' : 'news',
            'source' : 'es',
            'target' : 'en',
            'base_model_id' : 'es-en',
            'status' : 'TRAINED',
            'editname' : true,
            'tenant_id' : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
            'metadata' : {
              '_project' : 'TestProj01'
            },
            'type' : 'model',
            'trained_model_id' : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00',
            'status_date' : 1447152537126,
            'file_batch_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
            'custom_model_id' : 'a6c6480f2aff163f8ec172ccac640195',
            'project' : 'TestProj01',
            'reconcileProblem' : 'MISSING BATCH',
            'trained_model_details' : {
              'model_id' : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00',
              'source' : 'es',
              'target' : 'en',
              'base_model_id' : 'es-en',
              'domain' : 'news',
              'customizable' : false,
              'default_model' : false,
              'owner' : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
              'status' : 'available',
              'name' : 'TestMod01',
              'train_log' : null
            }
          }
        ];

        return this.reconcileController.repairMissingBatchesInCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', Models).then(function (data) {
          putBatchNock.done();
          getModelNock.done();
          putModelNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.isDefined(data[0]._settledValue.file_batch_id, 'Should have a file_batch_id');
        });
      });
    });
  });

  describe('Reconciler: Repair a missing batch: Given an empty array', function () {
    describe('When I get a response', function () {
      it('Then it should return an empty array', function () {
        return this.reconcileController.repairMissingBatchesInCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });

    });
  });

//REPAIR Duplicate BATCHES IN MODEL TESTS

  describe('Reconciler: Repair an duplicate batch: Given an array with a single valid model and a valid tenantID and there is no error repairing the model', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var getBatchNock = nock(cloudantUrl)
          .get('/mt_files/_design/batches/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","0b0a5370586ee1948ed08090930d5da3BatchId"]'})
          .reply(200, {
            "total_rows" : 175,
            "offset" : 147,
            "rows" : [{
              "id" : "0b0a5370586ee1948ed08090930d5da3BatchId",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "0b0a5370586ee1948ed08090930d5da3BatchId"],
              "value" : {
                "_id" : "0b0a5370586ee1948ed08090930d5da3BatchId",
                "_rev" : "1-66189b74a4db0c1048b7fb6e86c8a3f5",
                "batch_id" : "0b0a5370586ee1948ed08090930d5da3BatchId",
                "batch" : [],
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436"
              }
            }]
          }, {
            'x-couch-request-id' : '8f29801360',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"34089058f56aec641c8a0c491611f438"',
            date : 'Thu, 12 Nov 2015 11:29:37 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var putBatchNock = nock(cloudantUrl)
          .put('/mt_files/0b0a5370586ee1948ed080909383f056BatchId',
            {
              "batch_id" : "0b0a5370586ee1948ed080909383f056BatchId",
              "batch" : [],
              "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436%"
            })
          .reply(201, {
            "ok" : true,
            "id" : "0b0a5370586ee1948ed080909383f056BatchId",
            "rev" : "3-e7257f6528e9c43ec68de8a3ac629a4b"
          }, {
            'x-couch-request-id' : '97a9607de2',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_files/0b0a5370586ee1948ed080909383f056BatchId',
            etag : '"3-e7257f6528e9c43ec68de8a3ac629a4b"',
            date : 'Thu, 12 Nov 2015 11:29:38 GMT',
            'content-type' : 'application/json',
            'content-length' : '102',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var getModelNock = nock(cloudantUrl)
          .get('/mt_custom_models/_design/models/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","0b0a5370586ee1948ed080909383f056"]'})
          .reply(200, {
            "total_rows" : 170,
            "offset" : 146,
            "rows" : [{
              "id" : "0b0a5370586ee1948ed080909383f056",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "0b0a5370586ee1948ed080909383f056"],
              "value" : {
                "_id" : "0b0a5370586ee1948ed080909383f056",
                "_rev" : "3-31a23d02c5a7af40cb3744970ab38ace",
                "name" : "TestMod02",
                "description" : "",
                "base_model_id" : "es-en",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "status" : "CREATED",
                "status_date" : 1447327593936,
                "editname" : true,
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
                "metadata" : {"_project" : "TestProj01"},
                "type" : "model",
                "trained_model_id" : "UNTRAINED",
                "file_batch_id" : "0b0a5370586ee1948ed08090930d5da3BatchId"
              }
            }]
          }, {
            'x-couch-request-id' : '8b3a1d61fd',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"12c4e8f39a87cb50b9dcb085e4a6e533"',
            date : 'Thu, 12 Nov 2015 11:29:37 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var postModelNock = nock(cloudantUrl)
          .post('/mt_custom_models', {
            "_id" : "0b0a5370586ee1948ed080909383f056",
            "_rev" : "3-31a23d02c5a7af40cb3744970ab38ace",
            "name" : "TestMod02",
            "description" : "",
            "base_model_id" : "es-en",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1447327593936,
            "editname" : true,
            "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
            "metadata" : {"_project" : "TestProj01"},
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "file_batch_id" : "0b0a5370586ee1948ed080909383f056BatchId"
          })
          .reply(201, {
            "ok" : true,
            "id" : "0b0a5370586ee1948ed080909383f056",
            "rev" : "4-56bb2d6345a4dbf7e94cfdb2d7a0e80e"
          }, {
            'x-couch-request-id' : 'f07c57a641',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/0b0a5370586ee1948ed080909383f056',
            date : 'Thu, 12 Nov 2015 11:29:38 GMT',
            'content-type' : 'application/json',
            'content-length' : '95',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var Models = [
          {
            "_id" : "0b0a5370586ee1948ed080909383f056",
            "_rev" : "3-31a23d02c5a7af40cb3744970ab38ace",
            "name" : "TestMod02",
            "description" : "",
            "base_model_id" : "es-en",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1447327593936,
            "editname" : true,
            "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
            "metadata" : {"_project" : "TestProj01"},
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "file_batch_id" : "0b0a5370586ee1948ed08090930d5da3BatchId",
            "custom_model_id" : '0b0a5370586ee1948ed080909383f056'
          }
        ];

        return this.reconcileController.repairDuplicateBatchesInCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', Models).then(function (data) {
          getBatchNock.done();
          putBatchNock.done();
          getModelNock.done();
          postModelNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.isDefined(data[0]._settledValue.file_batch_id, 'Should have a file_batch_id');
        });
      });
    });
  });

  describe('Reconciler: Repair a duplicate batch: Given an empty array', function () {
    describe('When I get a response', function () {
      it('Then it should return an empty array', function () {
        return this.reconcileController.repairDuplicateBatchesInCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });

    });
  });

//CREATE CUSTOM MODELS FOR ORPHAN TRAINED MODEL TESTS

  describe('Reconciler: Repair an orphaned trained model: Given an array with a single valid trained model and a valid tenantID and there is no error creating the custom model', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var createBatchNock = nock(cloudantUrl)
          .put('/mt_files/c9c5bf317764b1f17ea83b18672a85c2BatchId', {
            "batch_id" : "c9c5bf317764b1f17ea83b18672a85c2BatchId",
            "batch" : [],
            "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436%"
          })
          .reply(201, {
            "ok" : true,
            "id" : "c9c5bf317764b1f17ea83b18672a85c2BatchId",
            "rev" : "1-5fa17ecfd780c03f1459da6687417c62"
          }, {
            'x-couch-request-id' : 'de2b667ed9',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_files/c9c5bf317764b1f17ea83b18672a85c2BatchId',
            etag : '"1-5fa17ecfd780c03f1459da6687417c62"',
            date : 'Thu, 12 Nov 2015 12:25:41 GMT',
            'content-type' : 'application/json',
            'content-length' : '102',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var createModelNock = nock(cloudantUrl)
          .post('/mt_custom_models',
            function (body) {
              return (body.name.substring(0, 6) === "Orphan") && (!body.file_batch_id);
            })
          .reply(201, {
            "ok" : true,
            "id" : "c9c5bf317764b1f17ea83b18672a85c2",
            "rev" : "1-45a3ca921910f1ecb77d9128b37194bb"
          }, {
            'x-couch-request-id' : '222e1f2e38',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/c9c5bf317764b1f17ea83b18672a85c2',
            date : 'Thu, 12 Nov 2015 12:25:40 GMT',
            'content-type' : 'application/json',
            'content-length' : '95',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var getModelNock = nock(cloudantUrl)
          .get('/mt_custom_models/_design/models/_view/countTenantName')
          .query(true)
          .reply(200, {"rows" : [{"key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "TestMod01"], "value" : 1}]}, {
            'x-couch-request-id' : 'de4be57d2b',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"2933acefab40dff4867fd3b29d914007"',
            date : 'Thu, 12 Nov 2015 12:25:40 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var updateModelNock = nock(cloudantUrl)
          .post('/mt_custom_models',
            function (body) {
              return (body.name.substring(0, 6) === "Orphan") && (body.file_batch_id === "c9c5bf317764b1f17ea83b18672a85c2BatchId");
            })
          .reply(201, {
            "ok" : true,
            "id" : "c9c5bf317764b1f17ea83b18672a85c2",
            "rev" : "2-a05c59e9c2743c9d5263b932c521881f"
          }, {
            'x-couch-request-id' : '7f7307dbbb',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/c9c5bf317764b1f17ea83b18672a85c2',
            date : 'Thu, 12 Nov 2015 12:25:41 GMT',
            'content-type' : 'application/json',
            'content-length' : '95',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var trainedModels = {
          "aced15e5-83a7-44da-862a-8d3e668b9515" : {
            "model_id" : "aced15e5-83a7-44da-862a-8d3e668b9515",
            "source" : "es",
            "target" : "en",
            "base_model_id" : "es-en",
            "domain" : "news",
            "customizable" : false,
            "default_model" : false,
            "owner" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
            "status" : "available",
            "name" : "TestMod01",
            "train_log" : null
          }
        };

        return this.reconcileController.createCustomModelsForOrphanTrainedModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', trainedModels).then(function (data) {
          createBatchNock.done();
          createModelNock.done();
          getModelNock.done();
          updateModelNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.equal(data[0]._settledValue.status, constants.statuses.TRAINED, 'Should be trained');
        });
      });
    });
  });

  describe('Reconciler: Repair an orphaned trained model: Given an empty array', function () {
    describe('When I get a response', function () {
      it('Then it should return an empty array', function () {
        return this.reconcileController.createCustomModelsForOrphanTrainedModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });

    });
  });

//DELETE MISSING TRAINED MODELS FROM CUSTOM MODELS TESTS

  describe('Reconciler: Repair a custom model missing a trained model: Given an array with a single valid custom model and a valid tenantID and there is no error removing the trained model', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var getModelNock = nock(cloudantUrl)
          .get('/mt_custom_models/_design/models/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","c9c5bf317764b1f17ea83b18672a85c2"]'})
          .reply(200, {
            "total_rows" : 169,
            "offset" : 139,
            "rows" : [{
              "id" : "c9c5bf317764b1f17ea83b18672a85c2",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "c9c5bf317764b1f17ea83b18672a85c2"],
              "value" : {
                "_id" : "c9c5bf317764b1f17ea83b18672a85c2",
                "_rev" : "3-7af8c9615e379fbf25500ea8f9ee15fb",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : "TRAINED",
                "editname" : true,
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
                "metadata" : {"_project" : "Orphaned Training Models: es-en"},
                "type" : "model",
                "trained_model_id" : "aced15e5-83a7-44da-862a-8d3e668b9516",
                "status_date" : 1447331140121,
                "file_batch_id" : "c9c5bf317764b1f17ea83b18672a85c2BatchId"
              }
            }]
          }, {
            'x-couch-request-id' : '4fab2522f9',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"7cfe9693811d4107ed15ab645d767817"',
            date : 'Thu, 12 Nov 2015 13:43:11 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });


        var updateModelNock = nock(cloudantUrl)
          .post('/mt_custom_models',
            function (body) {
              return (body.name === "TestMod01") && (body.trained_model_id === constants.UNTRAINED_MODELID);
            })
          .reply(201, {
            "ok" : true,
            "id" : "c9c5bf317764b1f17ea83b18672a85c2",
            "rev" : "4-54cf88b1b41532d3ce6f6a361f79e4c7"
          }, {
            'x-couch-request-id' : 'eb89e60c70',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/c9c5bf317764b1f17ea83b18672a85c2',
            date : 'Thu, 12 Nov 2015 13:43:12 GMT',
            'content-type' : 'application/json',
            'content-length' : '95',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var customModels = [{
          "_id" : "c9c5bf317764b1f17ea83b18672a85c2",
          "_rev" : "3-7af8c9615e379fbf25500ea8f9ee15fb",
          "name" : "TestMod01",
          "description" : "",
          "domain" : "news",
          "source" : "es",
          "target" : "en",
          "base_model_id" : "es-en",
          "status" : "TRAINED",
          "editname" : true,
          "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
          "metadata" : {"_project" : "Orphaned Training Models: es-en"},
          "type" : "model",
          "trained_model_id" : "aced15e5-83a7-44da-862a-8d3e668b9516",
          "status_date" : 1447331140121,
          "file_batch_id" : "c9c5bf317764b1f17ea83b18672a85c2BatchId",
          "custom_model_id" : "c9c5bf317764b1f17ea83b18672a85c2",
          "project" : "Orphaned Training Models: es-en",
          "file_batch_details" : [],
          "reconcileProblem" : "MISSING TRAINED MODEL"
        }];

        return this.reconcileController.removeMissingTrainedModelsFromCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', customModels).then(function (data) {
          getModelNock.done();
          updateModelNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.equal(data[0]._settledValue.trained_model_id, constants.UNTRAINED_MODELID, 'Should be UNTRAINED');
          chai.assert.isDefined(data[0]._settledValue.file_batch_id, 'Should have a file_batch_id');
        });
      });
    });
  });

  describe('Reconciler: Repair a custom model missing a trained model: Given an empty array', function () {
    describe('When I get a response', function () {
      it('Then it should return an empty array', function () {
        return this.reconcileController.removeMissingTrainedModelsFromCustomModels('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });

    });
  });

//CORRECT STATUS OF CUSTOM MODELS TESTS

  describe('Reconciler: Repair a custom model status: Given an array with a single custom model mis-labled', function () {
    describe('When I get a response', function () {

      it('Then it should return an array of one element', function () {

        var getModelNock = nock(cloudantUrl)
          .get('/mt_custom_models/_design/models/_view/byTenantId')
          .query({"key" : '["ca74df5e-3a62-4d92-85fc-809d85a30436%","c9c5bf317764b1f17ea83b18672a85c2"]'})
          .reply(200, {
            "total_rows" : 169,
            "offset" : 139,
            "rows" : [{
              "id" : "c9c5bf317764b1f17ea83b18672a85c2",
              "key" : ["ca74df5e-3a62-4d92-85fc-809d85a30436", "c9c5bf317764b1f17ea83b18672a85c2"],
              "value" : {
                "_id" : "c9c5bf317764b1f17ea83b18672a85c2",
                "_rev" : "7-61b2e7a3ab1ab3ef800323dca817f5d0",
                "name" : "TestMod01",
                "description" : "",
                "domain" : "news",
                "source" : "es",
                "target" : "en",
                "base_model_id" : "es-en",
                "status" : "FILESLOADED",
                "editname" : true,
                "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
                "metadata" : {"_project" : "Orphaned Training Models: es-en"},
                "type" : "model",
                "trained_model_id" : "UNTRAINED",
                "status_date" : 1447331140121,
                "file_batch_id" : "c9c5bf317764b1f17ea83b18672a85c2BatchId"
              }
            }]
          }, {
            'x-couch-request-id' : 'd59aaf296d',
            'transfer-encoding' : 'chunked',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            etag : '"34ab963ed4fdb908adb573a4b1830ce2"',
            date : 'Thu, 12 Nov 2015 15:15:42 GMT',
            'content-type' : 'application/json',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var updateModelNock = nock(cloudantUrl)
          .post('/mt_custom_models',
            function (body) {
              return (body.name === "TestMod01") && (body.status === constants.statuses.CREATED);
            })
          .reply(201, {
            "ok" : true,
            "id" : "c9c5bf317764b1f17ea83b18672a85c2",
            "rev" : "8-c6047e1f532e464f3da49f4066dfcbcc"
          }, {
            'x-couch-request-id' : '3468b39bf0',
            server : 'CouchDB/1.0.2 (Erlang OTP/17)',
            location : 'http://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com/mt_custom_models/c9c5bf317764b1f17ea83b18672a85c2',
            date : 'Thu, 12 Nov 2015 15:15:43 GMT',
            'content-type' : 'application/json',
            'content-length' : '95',
            'cache-control' : 'must-revalidate',
            'strict-transport-security' : 'max-age=31536000',
            'x-content-type-options' : 'nosniff;'
          });

        var customModels = [{
          "_id" : "c9c5bf317764b1f17ea83b18672a85c2",
          "_rev" : "7-61b2e7a3ab1ab3ef800323dca817f5d0",
          "name" : "TestMod01",
          "description" : "",
          "domain" : "news",
          "source" : "es",
          "target" : "en",
          "base_model_id" : "es-en",
          "status" : "FILESLOADED",
          "editname" : true,
          "tenant_id" : "ca74df5e-3a62-4d92-85fc-809d85a30436",
          "metadata" : {"_project" : "Orphaned Training Models: es-en"},
          "type" : "model",
          "trained_model_id" : "UNTRAINED",
          "status_date" : 1447331140121,
          "file_batch_id" : "c9c5bf317764b1f17ea83b18672a85c2BatchId",
          "custom_model_id" : "c9c5bf317764b1f17ea83b18672a85c2",
          "project" : "Orphaned Training Models: es-en",
          "file_batch_details" : [],
          "reconcileProblem" : "INCORRECT STATUS"
        }];

        return this.reconcileController.fixCustomModelStatus('ca74df5e-3a62-4d92-85fc-809d85a30436%', customModels).then(function (data) {
          getModelNock.done();
          updateModelNock.done();
          chai.assert.equal(data.length, 1, 'Should be only 1 element returned in array');
          chai.assert.equal(data[0]._settledValue.status, constants.statuses.CREATED, 'Should be UNTRAINED');
          chai.assert.isDefined(data[0]._settledValue.file_batch_id, 'Should have a file_batch_id');
        });
      });
    });
  });

  describe('Reconciler: Repair a custom model status: Given an empty array', function () {
    describe('When I get a response', function () {
      it('Then it should return an empty array', function () {
        return this.reconcileController.fixCustomModelStatus('ca74df5e-3a62-4d92-85fc-809d85a30436%', []).then(function (data) {
          chai.assert.equal(data.length, 0, 'Should be 0 elements returned in array');
        });
      });
    });
  });
});

