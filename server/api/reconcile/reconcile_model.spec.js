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
var modelReconcileNocks = require('../../test/nockReplies/modelReconcileNocks');
var bluemixOAuthNock = require('../../test/nockReplies/bluemixOAuthNock');
var mocks = require('../../test/mocks');
var constants = require('../models/constants.js');

var urlPrefix = '/api/reconcile' + '/' + testConstants.testTenantId;

var testUser = {
  username : 'testuser',
  password : 'password',
  serviceGUID : 'UNIT_TESTS'
};

//Setup mock ensureAuthenticated function
var mockrest = new mocks.RESTMock();

function setup (batchStore, modelStore, callback) {
  batchStore.setupDB(function (err, response) {
    modelStore.setupDB(function (err, response) {
      callback();
    });
  });
}

//nock.recorder.rec();
nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

describe('Reconciliation - model specific ', function () {//Model specific reconcile tests


  before(function (done) {
    this.originalExportTesting = process.env.EXPORT_ALL_FOR_TESTING;
    process.env.EXPORT_ALL_FOR_TESTING = 'true';

    this.modelStore = require('../../components/modelStore');
    this.batchStore = require('../../components/batchStore');

    this.modelsController = require('../models/models.controller');

    this.reconcileController = proxyquire('./reconcile.controller.js', {
      '../models/models.controller' : this.modelsController
    });

    this.batches = require('../batches/batches');

    //Now pull this up the require chain
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

//CORRECT STATUS OF CUSTOM MODELS TESTS

  describe('ModelReconciler: Repair a custom model: Given a custom model that is correctly structured', function () {
    describe('When I get a response', function () {
      it('Then it should return status ' + HTTPStatus.OK, function (done) {

        var getModelNock = modelReconcileNocks.getModelNock();
        var getDuplicateModelsByNameNock = modelReconcileNocks.getDuplicateModelsByNameNock();
        var getBatchNock = modelReconcileNocks.getBatchNock();
        var getFileNock = modelReconcileNocks.getFileNock();
        var getTrainedModelsNock = modelReconcileNocks.getTrainedModelsNock();

        request(this.app).get(urlPrefix + '/reconcile/1d6203bd1698e89ebc7c8f19a5efbac6')
          .expect(function (res) {
            chai.assert.equal(res.statusCode, HTTPStatus.OK, 'Should be a ' + HTTPStatus.OK + ' return code');
            getModelNock.done();
            getBatchNock.done();
            getFileNock.done();
            getTrainedModelsNock.done();
            getDuplicateModelsByNameNock.done();
            chai.assert.notEqual(res.body.customModelDetails, null, 'customModelDetails should not be empty');
            chai.assert.notEqual(res.body.fileBatchDetails, null, 'fileBatchDetails should not be empty');
            chai.assert.notEqual(res.body.trainedModelDetails, null, 'trainedModelDetails should not be empty');
            chai.assert.notEqual(res.body.batchFiles, null, 'batchFiles should not be empty');
            chai.assert.notEqual(res.body.duplicateModels, null, 'duplicateModels should not be empty');
            chai.assert.equal(res.body.batchFiles.length, 1, 'batchFiles should contain 1 element');
            chai.assert.equal(res.body.duplicateModels.length, 1, 'duplicateModels should contain 1 element');
            chai.assert.equal(res.body.customModelDetails.status, constants.statuses.TRAINED, 'customModelDetails status should ' + constants.statuses.TRAINED);
          }).end(done);
      });
    })
  });

  describe('ModelReconciler: Repair a custom model: Given an invalid custom model', function () {
    describe('When I get a response', function () {
      it('Then it should return status ' + HTTPStatus.INTERNAL_SERVER_ERROR, function (done) {

        var getMissingModelNock = modelReconcileNocks.getMissingModelNock();

        request(this.app).get(urlPrefix + '/reconcile/1d6203bd1698e89ebc7c8f19a5efbac7')
          .expect(function (res) {
            getMissingModelNock.done();
            chai.assert.equal(res.statusCode, HTTPStatus.NOT_FOUND, 'Should be a ' + HTTPStatus.NOT_FOUND + ' return code');
          }).end(done);
      });
    })
  });

  describe('ModelReconciler: Repair a custom model: Given a custom model with an unlinked batch', function () {
    describe('When I get a response', function () {
      it('Then it should return status ' + HTTPStatus.OK, function (done) {

        var getModelDiconnectedBatchNock = modelReconcileNocks.getModelDisconnectedBatchNock();
        var getDuplicateModelsByNameNock = modelReconcileNocks.getDuplicateModelsByNameNock();
        var getBatchNock = modelReconcileNocks.getBatchNock();
        var getFileNock = modelReconcileNocks.getFileNock();
        var getTrainedModelsNock = modelReconcileNocks.getTrainedModelsNock();
        var writeModelReconnectingBatchNock = modelReconcileNocks.writeModelReconnectingBatchNock();

        request(this.app).get(urlPrefix + '/reconcile/1d6203bd1698e89ebc7c8f19a5efbac6')
          .expect(function (res) {
            getModelDiconnectedBatchNock.done();
            getBatchNock.done();
            getFileNock.done();
            getTrainedModelsNock.done();
            getDuplicateModelsByNameNock.done();
            writeModelReconnectingBatchNock.done();
            chai.assert.equal(res.statusCode, HTTPStatus.OK, 'Should be a ' + HTTPStatus.OK + ' return code');
            chai.assert.equal(res.body.customModelDetails.file_batch_id, res.body.fileBatchDetails.batch_id, 'batchID should match between model and batch');
            chai.assert.notEqual(res.body.customModelDetails, null, 'customModelDetails should not be empty');
            chai.assert.notEqual(res.body.fileBatchDetails, null, 'fileBatchDetails should not be empty');
            chai.assert.notEqual(res.body.trainedModelDetails, null, 'trainedModelDetails should not be empty');
            chai.assert.notEqual(res.body.batchFiles, null, 'batchFiles should not be empty');
            chai.assert.notEqual(res.body.duplicateModels, null, 'duplicateModels should not be empty');
            chai.assert.equal(res.body.batchFiles.length, 1, 'batchFiles should contain 1 element');
            chai.assert.equal(res.body.duplicateModels.length, 1, 'duplicateModels should contain 1 element');
            chai.assert.equal(res.body.customModelDetails.status, constants.statuses.TRAINED, 'customModelDetails status should ' + constants.statuses.TRAINED);
          }).end(done);
      });
    })
  });

  describe('ModelReconciler: Repair a custom model: Given a custom model with a missing batch and not cloned', function () {
    describe('When I get a response', function () {
      it('Then it should return status ' + HTTPStatus.OK, function (done) {

        var getModelDiconnectedBatchNock = modelReconcileNocks.getModelDisconnectedBatchNock();
        var getDuplicateModelsByNameNock = modelReconcileNocks.getDuplicateModelsByNameNock();
        var getNoBatchNock = modelReconcileNocks.getNoBatchNock();
        var getTrainedModelsNock = modelReconcileNocks.getTrainedModelsNock();
        var createBatchNock = modelReconcileNocks.createBatchNock();
        var writeModelReconnectingBatchNock = modelReconcileNocks.writeModelReconnectingBatchNock();

        request(this.app).get(urlPrefix + '/reconcile/1d6203bd1698e89ebc7c8f19a5efbac6')
          .expect(function (res) {
            getModelDiconnectedBatchNock.done();
            getNoBatchNock.done();
            getTrainedModelsNock.done();
            getDuplicateModelsByNameNock.done();
            createBatchNock.done();
            writeModelReconnectingBatchNock.done();
            chai.assert.equal(res.statusCode, HTTPStatus.OK, 'Should be a ' + HTTPStatus.OK + ' return code');
            chai.assert.equal(res.body.customModelDetails.file_batch_id, res.body.fileBatchDetails.id, 'batchID should match between model and batch');
            chai.assert.notEqual(res.body.customModelDetails, null, 'customModelDetails should not be empty');
            chai.assert.notEqual(res.body.fileBatchDetails, null, 'fileBatchDetails should not be empty');
            chai.assert.notEqual(res.body.trainedModelDetails, null, 'trainedModelDetails should not be empty');
            chai.assert.equal(res.body.batchFiles, null, 'batchFiles should be empty');
            chai.assert.notEqual(res.body.duplicateModels, null, 'duplicateModels should not be empty');
            chai.assert.equal(res.body.duplicateModels.length, 1, 'duplicateModels should contain 1 element');
            chai.assert.equal(res.body.customModelDetails.status, constants.statuses.TRAINED, 'customModelDetails status should ' + constants.statuses.TRAINED);
          }).end(done);
      });
    })
  });

  describe('ModelReconciler: Repair a custom model: Delete a model marked for deletion', function () {
    describe('When I get a response', function () {
      it('Then it should return status ' + HTTPStatus.OK, function (done) {

        var getModelMarkedForDeletionNock = modelReconcileNocks.getModelMarkedForDeletionNock();
        var getDuplicateModelsByNameNock = modelReconcileNocks.getDuplicateModelsByNameNock();
        var getBatchNock = modelReconcileNocks.getBatchNock();
        var getFileNock = modelReconcileNocks.getFileNock();
        var getTrainedModelsNock = modelReconcileNocks.getTrainedModelsNock();

        var getModelForDeletionNock = modelReconcileNocks.getModelMarkedForDeletionNock();
        var updateModelForDeletionNock = modelReconcileNocks.updateModelForDeletionNock();
        var getBatchForDeletionNock = modelReconcileNocks.getBatchNock();
        var getFileCountForDeletion = modelReconcileNocks.getFileCountForDeletion();
        var getFileForDeletion = modelReconcileNocks.getFileForDeletion();
        var deleteFileForDeletion = modelReconcileNocks.deleteFileForDeletion();
        var deleteBatch = modelReconcileNocks.deleteBatch();
        var deleteTrainedModel = modelReconcileNocks.deleteTrainedModel();
        var deleteCustomModelNock = modelReconcileNocks.deleteCustomModelNock();

        request(this.app).get(urlPrefix + '/reconcile/1d6203bd1698e89ebc7c8f19a5efbac6')
          .expect(function (res) {
            getModelMarkedForDeletionNock.done();
            getBatchNock.done();
            getFileNock.done();
            getTrainedModelsNock.done();
            getDuplicateModelsByNameNock.done();

            getModelForDeletionNock.done();
            updateModelForDeletionNock.done();
            getBatchForDeletionNock.done();
            getFileCountForDeletion.done();
            getFileForDeletion.done();
            deleteFileForDeletion.done();
            deleteBatch.done();
            deleteTrainedModel.done();
            deleteCustomModelNock.done();

            chai.assert.equal(res.statusCode, HTTPStatus.OK, 'Should be a ' + HTTPStatus.OK + ' return code');
            chai.assert.equal(res.body.id, '1d6203bd1698e89ebc7c8f19a5efbac6', 'id should contain deleted custom model id');
            chai.assert.equal(res.body.ok, true, 'ok should be true');
          }).end(done);
      });
    })
  });

  describe('ModelReconciler: Repair a custom model: Trigger youngestModel logic with creation dates', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getCompleteModel").returns(promise.resolve({
          "customModelDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
            "_rev" : "15-eb70bb1dd5fd7a7dcbd37c8bd38051da",
            "name" : "TestMod02",
            "description" : "",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1450114093747,
            "creation_date" : 1450114093747,
            "editname" : true,
            "tenant_id" : testConstants.testTenantId,
            "metadata" : {
              "_project" : "TestProj01"
            },
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "base_model_id" : "en-es",
            "file_batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId"
          },
          "fileBatchDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "_rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131",
            "batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "batch" : [],
            "tenant_id" : testConstants.testTenantId
          },
          "batchFiles" : [
            {
              "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
              "last_modified" : "2015-12-14T16:02:35.313740",
              "bytes" : 4964,
              "name" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
              "content_type" : "false"
            }
          ],
          "trainedModelDetails" : null,
          "duplicateModels" : [
            {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
              "creation_date" : 1450114093747
            }, {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d539",
              "creation_date" : 14501140937478
            }, {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d537",
              "creation_date" : 14501140937476
            }

          ]
        }));

        sinon.stub(this.modelsController, "deleteCustomModelInternal").returns(promise.resolve([{
          "model deleted" : 'yes'
        }]));
      });

      after(function () {
        this.reconcileController.getCompleteModel.restore();
        this.modelsController.deleteCustomModelInternal.restore();
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.doReconcileCustomModel(testUser, testConstants.testTenantId, '4f19eaa41a4d8cdf8d7819cab6e1d538').then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    })
  });

  describe('ModelReconciler: Repair a custom model: Trigger youngestModel logic without creation dates', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getCompleteModel").returns(promise.resolve({
          "customModelDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
            "_rev" : "15-eb70bb1dd5fd7a7dcbd37c8bd38051da",
            "name" : "TestMod02",
            "description" : "",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1450114093747,
            "editname" : true,
            "tenant_id" : testConstants.testTenantId,
            "metadata" : {
              "_project" : "TestProj01"
            },
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "base_model_id" : "en-es",
            "file_batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId"
          },
          "fileBatchDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "_rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131",
            "batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "batch" : [],
            "tenant_id" : testConstants.testTenantId
          },
          "batchFiles" : [
            {
              "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
              "last_modified" : "2015-12-14T16:02:35.313740",
              "bytes" : 4964,
              "name" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
              "content_type" : "false"
            }
          ],
          "trainedModelDetails" : null,
          "duplicateModels" : [
            {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
              "status_date" : 1450114093747
            }, {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d539",
              "status_date" : 14501140937478
            }, {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d537",
              "status_date" : 14501140937476
            }

          ]
        }));

        sinon.stub(this.modelsController, "deleteCustomModelInternal").returns(promise.resolve([{
          "model deleted" : 'yes'
        }]));
      });

      after(function () {
        this.reconcileController.getCompleteModel.restore();
        this.modelsController.deleteCustomModelInternal.restore();
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.doReconcileCustomModel(testUser, testConstants.testTenantId, '4f19eaa41a4d8cdf8d7819cab6e1d538').then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    })
  });

  describe('ModelReconciler: Repair a custom model: Trigger missing batch from cloned model logic', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getCompleteModel").returns(promise.resolve({
          "customModelDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
            "_rev" : "15-eb70bb1dd5fd7a7dcbd37c8bd38051da",
            "name" : "TestMod02",
            "description" : "",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1450114093747,
            "tenant_id" : testConstants.testTenantId,
            "metadata" : {
              "_project" : "TestProj01"
            },
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "base_model_id" : "en-es",
            "file_batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "cloned_from" : "aclone"
          },
          "fileBatchDetails" : null,
          "trainedModelDetails" : null,
          "duplicateModels" : [
            {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
              "status_date" : 1450114093747
            }
          ]
        }));

        sinon.stub(this.modelsController, "deleteCustomModelInternal").returns(promise.resolve([{
          "model deleted" : 'yes'
        }]));
      });

      after(function () {
        this.reconcileController.getCompleteModel.restore();
        this.modelsController.deleteCustomModelInternal.restore();
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.doReconcileCustomModel(testUser, testConstants.testTenantId, '4f19eaa41a4d8cdf8d7819cab6e1d538').then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    })
  });

  describe('ModelReconciler: Repair a custom model: Trigger linking model and trained model logic', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getCompleteModel").returns(promise.resolve({
          "customModelDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
            "_rev" : "15-eb70bb1dd5fd7a7dcbd37c8bd38051da",
            "name" : "TestMod02",
            "description" : "",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1450114093747,
            "tenant_id" : testConstants.testTenantId,
            "metadata" : {
              "_project" : "TestProj01"
            },
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "base_model_id" : "en-es",
            "file_batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "cloned_from" : "aclone"
          },
          "fileBatchDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "_rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131",
            "batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "batch" : [],
            "tenant_id" : testConstants.testTenantId
          },
          "trainedModelDetails" : {"model_id" : "notLinked"},
          "duplicateModels" : [
            {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
              "status_date" : 1450114093747
            }
          ]
        }));

        sinon.stub(this.modelStore, "update").returns(promise.resolve([{
          "model updated" : 'yes'
        }]));
      });

      after(function () {
        this.reconcileController.getCompleteModel.restore();
        this.modelStore.update.restore();
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.doReconcileCustomModel(testUser, testConstants.testTenantId, '4f19eaa41a4d8cdf8d7819cab6e1d538').then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    })
  });

  describe('ModelReconciler: Repair a custom model: Trigger removing trained model from custom model logic', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getCompleteModel").returns(promise.resolve({
          "customModelDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
            "_rev" : "15-eb70bb1dd5fd7a7dcbd37c8bd38051da",
            "name" : "TestMod02",
            "description" : "",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "CREATED",
            "status_date" : 1450114093747,
            "tenant_id" : testConstants.testTenantId,
            "metadata" : {
              "_project" : "TestProj01"
            },
            "type" : "model",
            "trained_model_id" : "TRAINED",
            "base_model_id" : "en-es",
            "file_batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "cloned_from" : "aclone"
          },
          "fileBatchDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "_rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131",
            "batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "batch" : [],
            "tenant_id" : testConstants.testTenantId
          },
          "trainedModelDetails" : null,
          "duplicateModels" : [
            {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
              "status_date" : 1450114093747
            }
          ]
        }));

        sinon.stub(this.modelStore, "update").returns(promise.resolve([{
          "model updated" : 'yes'
        }]));
      });

      after(function () {
        this.reconcileController.getCompleteModel.restore();
        this.modelStore.update.restore();
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.doReconcileCustomModel(testUser, testConstants.testTenantId, '4f19eaa41a4d8cdf8d7819cab6e1d538').then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    })
  });

  describe('ModelReconciler: Repair a custom model: delete missing files from batch', function () {
    describe('When I get a response', function () {

      before(function () {
        sinon.stub(this.reconcileController, "getCompleteModel").returns(promise.resolve({
          "customModelDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
            "_rev" : "15-eb70bb1dd5fd7a7dcbd37c8bd38051da",
            "name" : "TestMod02",
            "description" : "",
            "domain" : "news",
            "source" : "es",
            "target" : "en",
            "status" : "FILESLOADED",
            "status_date" : 1450114093747,
            "tenant_id" : testConstants.testTenantId,
            "metadata" : {
              "_project" : "TestProj01"
            },
            "type" : "model",
            "trained_model_id" : "UNTRAINED",
            "base_model_id" : "en-es",
            "file_batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId"
          },
          "fileBatchDetails" : {
            "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "_rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131",
            "batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
            "batch" : [
              {
                "file_name" : "esen.tmx",
                "uuid" : "112ceed4-6331-4f00-bc5d-e91c81ed7291",
                "last_modified" : "2015-12-14T16:02:33.994Z",
                "training_file_option" : "forced_glossary"
              }
            ],
            "tenant_id" : testConstants.testTenantId
          },
          "batchFiles" : [
            {
              "hash" : "d23edea42d27c005a796e4d6a64fa8a9",
              "last_modified" : "2015-12-14T16:02:35.313740",
              "bytes" : 4964,
              "name" : "112ceed4-6331-4f00-bc5d-e91c81ed7292",
              "content_type" : "false"
            }
          ],
          "trainedModelDetails" : null,
          "duplicateModels" : [
            {
              "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538",
              "status_date" : 1450114093747
            }
          ]
        }));

        sinon.stub(this.batches, 'deleteBatch').callsArgWith(3, null, {
          "file deleted" : 'yes'
        });

        sinon.stub(this.batchStore, "getBatch").callsArgWith(2, null, {
          "_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
          "_rev" : "9-6cf6a3a979534c2de0c41b4cf7ce1131",
          "batch_id" : "4f19eaa41a4d8cdf8d7819cab6e1d538BatchId",
          "batch" : [],
          "tenant_id" : testConstants.testTenantId
        });

        sinon.stub(this.modelStore, "update").returns(promise.resolve([{
          "model updated" : 'yes'
        }]));
      });

      after(function () {
        this.reconcileController.getCompleteModel.restore();
        this.batches.deleteBatch.restore();
        this.batchStore.getBatch.restore();
        this.modelStore.update.restore();
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.doReconcileCustomModel(testUser, testConstants.testTenantId, '4f19eaa41a4d8cdf8d7819cab6e1d538').then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    })
  });

});
