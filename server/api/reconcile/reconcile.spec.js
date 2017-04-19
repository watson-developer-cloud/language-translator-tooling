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
var promise = require('bluebird');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var express = require('express');
var mocks = require('../../test/mocks');
var testConstants = require('../../test/testConstants');
var cloudantModelsNock = require('../../test/nockReplies/cloudantModelsCalls');
var nockCloudantBatches = require('../../test/nockReplies/cloudantBatchesCalls');
var objectStorageCalls = require('../../test/nockReplies/objectStorageCalls');
var ltNock = require('../../test/nockReplies/ltCalls');
var modelReconcileNocks = require('../../test/nockReplies/modelReconcileNocks');
var bluemixOAuthNock = require('../../test/nockReplies/bluemixOAuthNock');

var constants = require('../models/constants.js');
var statuses = constants.statuses;
var cloudantService = require('../../config/db');
var cloudantUrl = cloudantService.url;
var urlPrefix = '/api/reconcile/' + testConstants.testTenantId;
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
describe('Reconciliation ', function () {
// this.timeout(2000000)
  before(function (done) {
    this.originalExportTesting = process.env.EXPORT_ALL_FOR_TESTING;
    process.env.EXPORT_ALL_FOR_TESTING = 'true';
    this.modelStore = require('../../components/modelStore');
    this.batchStore = require('../../components/batchStore');
    this.lt = require('../../components/lt');
    this.batches = require('../batches/batches');
    this.fileStore = require('../../components/fileStore');
    this.reconcileController = proxyquire('./reconcile.controller.js', {
      '../../components/lt' : this.lt,
      '../../components/modelStore' : this.modelStore,
      '../batches/batches' : this.batches,
      '../../components/fileStore' : this.fileStore
    });
    this.reconcile = proxyquire('./index', {'../../config/rest' : mockrest});
    this.routes = proxyquire('../../routes', {'./api/reconcile' : this.reconcile});
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

  describe('Reconciliation - status', function () {
    // this.timeout(2000000)

    describe('Given a tenant with no custom models and everything reconciled ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllNoModels();

          var nockScope2 = nockCloudantBatches.getAllBatchesNone();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.emptyContainer();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              if (!(res.body.reconciled instanceof Array)) return 'Not an Array';
              if (res.body.reconciled.length !== 0) return 'Array not empty';
              if (Object.keys(res.body.unreconciled).length !== 0) return 'There shoul dbe nothing unreconciled'
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model and everything reconciled ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatch();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.emptyContainer();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 0) return 'There should be nothing unreconciled';
              var customModel = reconciled[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
//Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 0) return 'Expected batch details batch to be empty';
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model (with no metadata) and everything reconciled ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreatedNoMetadata();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatch();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.emptyContainer();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 0) return 'There should be nothing unreconciled';
              var customModel = reconciled[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
//Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 0) return 'Expected batch details batch to be empty';
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model and a missing filebatch ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesNone();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.emptyContainer();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 0) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 1) return 'There should be an unreconiled customModel';
              if (!(unreconciled.customModels instanceof Array)) return 'unreconciled.customModels is not an Array';
              if (unreconciled.customModels.length !== 1) return 'unreconciled.customModels Array should have one entries';
              var customModel = unreconciled.customModels[0];
              //Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              if (customModel.reconcileProblem !== 'MISSING BATCH') return 'reconcileProblem should be be MISSING BATCH';
              delete customModel.reconcileProblem;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model and an extra filebatch ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesTwoBatches();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.emptyContainer();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 1) return 'There should be an unreconiled batch';
              if (Object.keys(unreconciled.batches).length !== 1) return 'unreconciled.batches does not have a batch';
              var unreconciledBatches = unreconciled.batches;
              var customModel = reconciled[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              //Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 0) return 'Expected batch details batch to be empty';
              //Check unreconciled batch details
              if (!(unreconciledBatches[testConstants.testModel.file_batch_id + '2'] instanceof Array)) return 'Expected unreconciled batch to be an empty array and have id' + testConstants.testModel.file_batch_id + '2';
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model with two files loaded and everything reconciled ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatchWithFiles();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.containerWithTwoFiles();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 0) return 'There should be nothing unreconciled';
              var customModel = reconciled[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              delete customModel.filesMissing;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              //Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 2) return 'Expected batch details batch to be length 2';
              var file1 = file_batch_details[0];
              if (file1.file_name !== 'esen.tmx') return ' file1.file_name should be esen.tmx';
              if (file1.uuid !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.uuid should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file1.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file1.file_details.last_modified !== '2015-09-22T10:37:02.420100') return ' file1.file_details.last_modified should be 2015-09-22T10:37:02.420100';
              if (file1.file_details.bytes !== 7674) return ' file1.file_details.bytes should be 7674';
              if (file1.file_details.name !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.file_details.name should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.content_type !== 'application/octet-stream') return ' file1.file_details.content_type should be application/octet-stream';
              if (Object.keys(file1.file_details).length !== 5) return 'Too many properties for file1.file_details';
              var file2 = file_batch_details[1];
              if (file2.file_name !== 'pten.tmx') return ' file2.file_name should be pten.tmx';
              if (file2.uuid !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.uuid should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (file2.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file2.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file2.file_details.last_modified !== '2015-10-22T10:37:02.420100') return ' file2.file_details.last_modified should be 2015-10-22T10:37:02.420100';
              if (file2.file_details.bytes !== 5633) return ' file1.file_details.bytes should be 5633';
              if (file2.file_details.name !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.file_details.name should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (file2.file_details.content_type !== 'application/octet-stream') return ' file2.file_details.content_type should be application/octet-stream';
              if (Object.keys(file2.file_details).length !== 5) return 'Too many properties for file2.file_details'
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model with two files loaded but only details for one ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatchWithFiles();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.containerWithOneFile();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 0) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 1) return 'There should be one model unreconciled';
              if (!(unreconciled.customModels instanceof Array)) return 'unreconciled.customModels is not an Array';
              if (unreconciled.customModels.length !== 1) return 'unreconciled.customModels Array should have one entries';
              var customModel = unreconciled.customModels[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              if (customModel.reconcileProblem !== 'MISSING FILE') return 'reconcileProblem should be be MISSING FILE';
              delete customModel.reconcileProblem;
              if (customModel.filesMissing.length !== 1) return 'filesMissing length should be 1';
              delete customModel.filesMissing;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              //Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 2) return 'Expected batch details batch to be length 2';
              var file1 = file_batch_details[0];
              if (file1.file_name !== 'esen.tmx') return ' file1.file_name should be esen.tmx';
              if (file1.uuid !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.uuid should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file1.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file1.file_details.last_modified !== '2015-09-22T10:37:02.420100') return ' file1.file_details.last_modified should be 2015-09-22T10:37:02.420100';
              if (file1.file_details.bytes !== 7674) return ' file1.file_details.bytes should be 7674';
              if (file1.file_details.name !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.file_details.name should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.content_type !== 'application/octet-stream') return ' file1.file_details.content_type should be application/octet-stream';
              if (Object.keys(file1.file_details).length !== 5) return 'Too many properties for file1.file_details';
              var file2 = file_batch_details[1];
              if (file2.file_name !== 'pten.tmx') return ' file2.file_name should be pten.tmx';
              if (file2.uuid !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.uuid should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (typeof file2.file_details !== 'undefined') return ' file2.file_details should be undefined ';
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one custom model reconciled and one unreconciled files ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatch();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.containerWithOneFile();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 1) return 'There should be a file unreconciled';
              var customModel = reconciled[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              delete customModel.filesMissing;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;

              //Prepare response for checking;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 0) return 'Expected batch details batch to be empty';
              //Check unreconciled File
              if (Object.keys(unreconciled.files).length !== 1) return 'unreconciled.files should have one entries';
              var file1 = unreconciled.files['1c6c85c0-cbe8-4f76-8aff-78104277828f'];
              if (file1.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file1.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file1.last_modified !== '2015-09-22T10:37:02.420100') return ' file1.last_modified should be 2015-09-22T10:37:02.420100';
              if (file1.bytes !== 7674) return ' file1.bytes should be 7674';
              if (file1.name !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.name should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.content_type !== 'application/octet-stream') return ' file1.content_type should be application/octet-stream';
              if (Object.keys(file1).length !== 5) return 'wrong number of properties for file1'

            }).end(done);
        });
      })
    });

    describe('Given a tenant with one trained custom model with two files loaded and everything reconciled ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModel();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatchWithFiles();
          var nockScope3 = ltNock.getCustomModelsOne();
          var nockScope4 = objectStorageCalls.containerWithTwoFiles();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'Array should have one entries';
              if (Object.keys(unreconciled).length !== 0) return 'There should be nothing unreconciled';
              var customModel = reconciled[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              var trained_model_details = customModel.trained_model_details;
              delete customModel.trained_model_details;
              delete customModel.filesMissing;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              //Prepare response for checking;
              if (customModel.status !== statuses.TRAINED) return 'Expected status to be' + statuses.TRAINED;
              customModel.status = testConstants.testModel.status;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 2) return 'Expected batch details batch to length 2';
              var file1 = file_batch_details[0];
              if (file1.file_name !== 'esen.tmx') return ' file1.file_name should be esen.tmx';
              if (file1.uuid !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.uuid should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file1.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file1.file_details.last_modified !== '2015-09-22T10:37:02.420100') return ' file1.file_details.last_modified should be 2015-09-22T10:37:02.420100';
              if (file1.file_details.bytes !== 7674) return ' file1.file_details.bytes should be 7674';
              if (file1.file_details.name !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.file_details.name should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.content_type !== 'application/octet-stream') return ' file1.file_details.content_type should be application/octet-stream';
              if (Object.keys(file1.file_details).length !== 5) return 'Too many properties for file1.file_details';
              var file2 = file_batch_details[1];
              if (file2.file_name !== 'pten.tmx') return ' file2.file_name should be pten.tmx';
              if (file2.uuid !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.uuid should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (file2.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file2.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file2.file_details.last_modified !== '2015-10-22T10:37:02.420100') return ' file2.file_details.last_modified should be 2015-10-22T10:37:02.420100';
              if (file2.file_details.bytes !== 5633) return ' file1.file_details.bytes should be 5633';
              if (file2.file_details.name !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.file_details.name should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (file2.file_details.content_type !== 'application/octet-stream') return ' file2.file_details.content_type should be application/octet-stream';
              if (Object.keys(file2.file_details).length !== 5) return 'Too many properties for file2.file_details';
              //Check Trained Model details
              if (Object.keys(trained_model_details).length !== 10) return 'wrong number of properties for trained_model_details';
              if (trained_model_details.model_id !== testConstants.testModel.trained_model_id) return ' trained_model_details.trained_model_id should be ' + testConstants.testModel.trained_model_id;
              if (trained_model_details.source !== 'en') return ' trained_model_details.source should be en';
              if (trained_model_details.target !== 'es') return ' trained_model_details.target should be es';
              if (trained_model_details.base_model_id !== 'en-es') return ' trained_model_details.base_model_id should be en-es';
              if (trained_model_details.domain !== 'news') return ' trained_model_details.domain should be news';
              if (trained_model_details.customizable !== false) return ' trained_model_details.customizable should be false';
              if (trained_model_details.default_model !== false) return ' trained_model_details.default_model should be false';
              if (trained_model_details.owner === '') return ' trained_model_details.owner should be setupDB';
              if (trained_model_details.status !== 'available') return ' trained_model_details.status should be available';
              if (trained_model_details.name !== testConstants.testModel.name) return ' trained_model_details.name should be ' + testConstants.testModel.name;
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one trained custom model with two files loaded and missing a trained model from runtime ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModel();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatchWithFiles();
          var nockScope3 = ltNock.getCustomModelsNone();
          var nockScope4 = objectStorageCalls.containerWithTwoFiles();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 0) return 'Array should have no entries';
              if (Object.keys(unreconciled).length !== 1) return 'There should be one model unreconciled';
              if (!(unreconciled.customModels instanceof Array)) return 'unreconciled.customModels is not an Array';
              if (unreconciled.customModels.length !== 1) return 'unreconciled.customModels Array should have one entries';
              var customModel = unreconciled.customModels[0];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              if (customModel.trained_model_details !== undefined) return 'customModel.trained_model_details should be undefined';
              delete customModel.trained_model_details;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              //Prepare response for checking;
              if (customModel.status !== statuses.TRAINED) return 'Expected status to be' + statuses.TRAINED;
              customModel.status = testConstants.testModel.status;
              if (customModel.reconcileProblem !== 'MISSING TRAINED MODEL') return 'reconcileProblem should be be MISSING TRAINED MODEL';
              delete customModel.reconcileProblem;
              delete customModel.filesMissing;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 2) return 'Expected batch details batch to length 2';
              var file1 = file_batch_details[0];
              if (file1.file_name !== 'esen.tmx') return ' file1.file_name should be esen.tmx';
              if (file1.uuid !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.uuid should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file1.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file1.file_details.last_modified !== '2015-09-22T10:37:02.420100') return ' file1.file_details.last_modified should be 2015-09-22T10:37:02.420100';
              if (file1.file_details.bytes !== 7674) return ' file1.file_details.bytes should be 7674';
              if (file1.file_details.name !== '1c6c85c0-cbe8-4f76-8aff-78104277828f') return ' file1.file_details.name should be 1c6c85c0-cbe8-4f76-8aff-78104277828f';
              if (file1.file_details.content_type !== 'application/octet-stream') return ' file1.file_details.content_type should be application/octet-stream';
              if (Object.keys(file1.file_details).length !== 5) return 'Too many properties for file1.file_details';
              var file2 = file_batch_details[1];
              if (file2.file_name !== 'pten.tmx') return ' file2.file_name should be pten.tmx';
              if (file2.uuid !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.uuid should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (file2.file_details.hash !== '0034eaacfc2e422d9d5b24b51e3bb81f') return ' file2.file_details.hash should be 0034eaacfc2e422d9d5b24b51e3bb81f';
              if (file2.file_details.last_modified !== '2015-10-22T10:37:02.420100') return ' file2.file_details.last_modified should be 2015-10-22T10:37:02.420100';
              if (file2.file_details.bytes !== 5633) return ' file1.file_details.bytes should be 5633';
              if (file2.file_details.name !== '7201e3e5-079f-48df-9929-5ab6472a7e4e') return ' file2.file_details.name should be 7201e3e5-079f-48df-9929-5ab6472a7e4e';
              if (file2.file_details.content_type !== 'application/octet-stream') return ' file2.file_details.content_type should be application/octet-stream';
              if (Object.keys(file2.file_details).length !== 5) return 'Too many properties for file2.file_details'
            }).end(done);
        });
      })
    });

    describe('Given a tenant with one created custom model, no files and a runtime with an extra trainedmodel ', function () {
      describe('When I get reconcile status', function () {
        it('Then it should return status ' + HTTPStatus.OK, function (done) {
          var nockScope1 = cloudantModelsNock.getAllOneModelCreated();
          var nockScope2 = nockCloudantBatches.getAllBatchesSingleBatch();
          var nockScope3 = ltNock.getCustomModelsOne();
          var nockScope4 = objectStorageCalls.emptyContainer();
          request(this.app).get(urlPrefix + '/status')
            .expect(function (res) {
              if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
              nockScope1.done();
              nockScope2.done();
              nockScope3.done();
              nockScope4.done();
              var reconciled = res.body.reconciled;
              var unreconciled = res.body.unreconciled;
              if (!(reconciled instanceof Array)) return 'reconciled is not an Array';
              if (reconciled.length !== 1) return 'reconciled Array should have one entries';
              var customModel = reconciled[0];
              if (Object.keys(unreconciled).length !== 1) return 'There should be one trainedmodel unreconciled';

              if (Object.keys(unreconciled.trainedModels).length !== 1) return 'unreconciled.trainedModels does not have a trainedModel';
              var unreconciledBatches = unreconciled.batches;
              var trained_model_details = unreconciled.trainedModels[testConstants.testModel.trained_model_id];
              var file_batch_details = customModel.file_batch_details;
              delete customModel.file_batch_details;
              if (customModel.trained_model_details !== undefined) return 'customModel.trained_model_details should be undefined';
              delete customModel.trained_model_details;
              delete customModel.trained_model_details;
              delete customModel.type;
              delete customModel._rev;
              delete customModel._id;
              delete customModel.tenant_id;
              //Prepare response for checking;
              if (customModel.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
              customModel.status = testConstants.testModel.status;
              if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be ' + constants.UNTRAINED_MODELID;
              customModel.trained_model_id = testConstants.testModel.trained_model_id;
              var response = testConstants.checkModel(customModel);
              if (response !== undefined) return response;
              //Check batch details
              if (!(file_batch_details instanceof Array)) return 'file_batch_details is not an Array';
              if (file_batch_details.length !== 0) return 'Expected batch details batch to be empty';
              //Check Trained Model details
              if (Object.keys(trained_model_details).length !== 10) return 'wrong number of properties for trained_model_details';
              if (trained_model_details.model_id !== testConstants.testModel.trained_model_id) return ' trained_model_details.trained_model_id should be ' + testConstants.testModel.trained_model_id;
              if (trained_model_details.source !== 'en') return ' trained_model_details.source should be en';
              if (trained_model_details.target !== 'es') return ' trained_model_details.target should be es';
              if (trained_model_details.base_model_id !== 'en-es') return ' trained_model_details.base_model_id should be en-es';
              if (trained_model_details.domain !== 'news') return ' trained_model_details.domain should be news';
              if (trained_model_details.customizable !== false) return ' trained_model_details.customizable should be false';
              if (trained_model_details.default_model !== false) return ' trained_model_details.default_model should be false';
              if (trained_model_details.owner === '') return ' trained_model_details.owner should be setupDB';
              if (trained_model_details.status !== 'available') return ' trained_model_details.status should be available';
              if (trained_model_details.name !== testConstants.testModel.name) return ' trained_model_details.name should be ' + testConstants.testModel.name;
            }).end(done);
        });
      })
    });
  });


  describe('/server/api/reconcile/reconcile.controller', function () {

    var testUser = {
      username : 'testuser',
      password : 'password',
      serviceGUID : 'UNIT_TESTS'
    };

    afterEach(function () {
      this.modelStore.getAll.restore();
      this.lt.getModels.restore();
      this.batches.getAllBatches.restore();
      this.fileStore.examineContainer.restore();
    });

    describe('#getReconcilliationStatus() empty', function () {

      before(function () {
        sinon.stub(this.modelStore, 'getAll').returns(promise.resolve([]));
        sinon.stub(this.lt, 'getModels').returns(promise.resolve([]));
        sinon.stub(this.batches, 'getAllBatches').callsArgWith(1, null, []);
        sinon.stub(this.fileStore, 'examineContainer').callsArgWith(1, null, []);
      });

      it('should handle all services return empty ', function (done) {
        this.reconcileController.getReconcilliationStatus(testUser, testConstants.testTenantId).then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    });

    describe('#getReconcilliationStatus() trigger exception', function () {

      before(function () {
        sinon.stub(this.modelStore, 'getAll').returns(promise.resolve('handbag'));
        sinon.stub(this.lt, 'getModels').returns(promise.resolve([]));
        sinon.stub(this.batches, 'getAllBatches').callsArgWith(1, null, []);
        sinon.stub(this.fileStore, 'examineContainer').callsArgWith(1, null, []);
      });

      it('should handle exception ', function (done) {
        this.reconcileController.getReconcilliationStatus(testUser, testConstants.testTenantId).then(function (response) {
            chai.assert.notOk(response, 'should throw an exception');
            done();
          })
          .catch(function (e) {
            chai.assert.ok(e, 'should throw an exception:' + e);
            done();
          })
      });

    });

    describe('#getReconcilliationStatus() contention over batch owner', function () {

      before(function () {

        sinon.stub(this.modelStore, 'getAll').returns(promise.resolve([{
          _id : 'a6c6480f2aff163f8ec172ccac640194',
          name : 'TestMod01',
          status : 'CREATED',
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          trained_model_id : constants.UNTRAINED_MODELID,
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640194',
          project : 'TestProj01'
        }, {
          _id : 'a6c6480f2aff163f8ec172ccac640195',
          name : 'TestMod02',
          status : 'CREATED',
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          trained_model_id : constants.UNTRAINED_MODELID,
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640195',
          project : 'TestProj01'
        }, {
          _id : 'a6c6480f2aff163f8ec172ccac640196',
          name : 'TestMod02',
          status : 'CREATED',
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          trained_model_id : constants.UNTRAINED_MODELID,
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640196',
          project : 'TestProj01'
        }]));

        sinon.stub(this.lt, 'getModels').returns(promise.resolve([]));

        sinon.stub(this.batches, 'getAllBatches').callsArgWith(1, null, [{
          '_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          '_rev' : '7-3e89da6d26d4503620af776fc7b3bafa',
          'batch_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          'batch' : [],
          'tenant_id' : 'ca74df5e-3a62-4d92-85fc-809d85a30436'
        }]);

        sinon.stub(this.fileStore, 'examineContainer').callsArgWith(1, null, []);
      });

      it('should have a response', function (done) {
        this.reconcileController.getReconcilliationStatus(testUser, testConstants.testTenantId).then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });

    });

    describe('#getReconcilliationStatus() contention over batch owner 2', function () {

      before(function () {

        sinon.stub(this.modelStore, 'getAll').returns(promise.resolve([{
          _id : 'a6c6480f2aff163f8ec172ccac640194',
          name : 'TestMod01',
          status : 'CREATED',
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          trained_model_id : constants.UNTRAINED_MODELID,
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640194',
          project : 'TestProj01'
        }]));

        sinon.stub(this.lt, 'getModels').returns(promise.resolve([]));

        sinon.stub(this.batches, 'getAllBatches').callsArgWith(1, null, [{
          '_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          '_rev' : '7-3e89da6d26d4503620af776fc7b3bafa',
          'batch_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          'batch' : [],
          'tenant_id' : 'ca74df5e-3a62-4d92-85fc-809d85a30436'
        }]);

        sinon.stub(this.fileStore, 'examineContainer').callsArgWith(1, null, []);
      });

      it('should have a response', function (done) {
        this.reconcileController.getReconcilliationStatus(testUser, testConstants.testTenantId).then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });
    });

    describe('#getReconcilliationStatus() contention over trained model owner', function () {

      before(function () {

        sinon.stub(this.modelStore, 'getAll').returns(promise.resolve([{
          _id : 'a6c6480f2aff163f8ec172ccac640195',
          name : 'TestMod01',
          status : 'TRAINED',
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          trained_model_id : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00',
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640195',
          project : 'TestProj01'
        }, {
          _id : 'a6c6480f2aff163f8ec172ccac640196',
          name : 'TestMod01',
          status : 'TRAINED',
          tenant_id : 'ca74df5e-3a62-4d92-85fc-809d85a30436',
          metadata : {_project : 'TestProj01'},
          trained_model_id : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00',
          file_batch_id : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          custom_model_id : 'a6c6480f2aff163f8ec172ccac640196',
          project : 'TestProj01'
        }]));

        sinon.stub(this.lt, 'getModels').returns(promise.resolve([{
          model_id : '1189d4cb-0d6a-4c32-91c6-fd5a4c99cf00'
        }]));

        sinon.stub(this.batches, 'getAllBatches').callsArgWith(1, null, [{
          '_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          '_rev' : '7-3e89da6d26d4503620af776fc7b3bafa',
          'batch_id' : 'a6c6480f2aff163f8ec172ccac640195BatchId',
          'batch' : [],
          'tenant_id' : 'ca74df5e-3a62-4d92-85fc-809d85a30436'
        }]);

        sinon.stub(this.fileStore, 'examineContainer').callsArgWith(1, null, []);
      });

      it('should have a response ', function (done) {
        this.reconcileController.getReconcilliationStatus(testUser, testConstants.testTenantId).then(function (response) {
            chai.assert.ok(response, 'a response is returned');
            done();
          })
          .catch(function (e) {
            chai.assert.notOk(e, 'throws an exception:' + e);
            done();
          })
      });
    });
  });
});

