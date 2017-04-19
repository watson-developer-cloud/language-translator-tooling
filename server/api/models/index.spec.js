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
var supertest = require('supertest');
var HTTPStatus = require('http-status');
var chai = require('chai');
var nock = require('nock');
var request = require('supertest');
var express = require('express');

var constants = require('./constants.js');
var statuses = constants.statuses;
var testConstants = require('../../test/testConstants');
var urlPrefix = testConstants.urlModelsPrefix + '/' + testConstants.testTenantId;
var ltNock = require('../../test/nockReplies/ltCalls');
var cloudantModelsNock = require('../../test/nockReplies/cloudantModelsCalls');
var batchFileClientNock = require('../../test/nockReplies/batchFileClientCalls');
var bluemixOAuthNock = require('../../test/nockReplies/bluemixOAuthNock');
//Setup to use test implementations of a few methods
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
//Setup mock ensureAuthenticated function
var mocks = require('../../test/mocks');
var mockrest = new mocks.RESTMock();

// nock.recorder.rec();
nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

describe('Models Service', function () {


  before(function (done) {
    this.modelStore = require('../../components/modelStore');

    this.mockBatchFileInternal = require('../../test/mocks/mockBatchFileInternal');
    this.controller = proxyquire('./models.controller', {
      './batchFileInternal' : this.mockBatchFileInternal
    });

    ////Now pull this up the require chain
    this.models = proxyquire('./index', {
      '../../config/rest' : mockrest,
      './models.controller' : this.controller
    });
    this.routes = proxyquire('../../routes', {
      './api/models' : this.models
    });

    this.expressSettings = require('../../config/express');

    this.app = express();
    this.expressSettings(this.app);
    this.routes(this.app);


    //setup database first
    this.modelStore.setupDB(function (err, response) {
      done();
    })

  });

  describe('Given a language translator instance with some base models ', function () {

    describe('When I list base models', function () {
      //- GET /baseModels

      it('Then I receive a ' + HTTPStatus.OK + ' status and a json array of base models', function (done) {
        var nockScope = ltNock.getBaseModels();
        request(this.app).get(urlPrefix + '/baseModels').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a 200 return code';
          if (!(res.body instanceof Array)) return 'Not an Array';
          if (res.body.length !== 2) return 'Array should have two entries';
          var base_model = res.body[0];
          if (!(base_model instanceof Object)) return 'Not an Object';
          if (base_model.model_id !== 'com.ibm.mt.models.en-es-news') return ' model_id should be com.ibm.mt.models.en-es-news ';
          if (base_model.source !== 'en') return ' source language should be en ';
          if (base_model.target !== 'es') return ' target language should be es ';
          if (base_model.domain !== 'news') return ' domain should be news ';
          if (base_model.name !== 'IBM news model English to Spanish') return ' name should be IBM news model English to Spanish ';
          if (Object.keys(base_model).length !== 5) return 'Too many keys for client object returned';
          base_model = res.body[1];
          if (!(base_model instanceof Object)) return 'Not an Object';
          if (base_model.model_id !== 'com.ibm.mt.models.zh-en-patent') return ' model_id should be com.ibm.mt.models.zh-en-patent ';
          if (base_model.source !== 'zh') return ' source language should be zh';
          if (base_model.target !== 'en') return ' target language should be en ';
          if (base_model.domain !== 'patent') return ' domain should be patent ';
          if (base_model.name !== 'IBM patent model Chinese to English ') return ' name should be IBM patent model Chinese to English ';
          if (Object.keys(base_model).length !== 5) return 'Too many keys for client object returned';
          nockScope.done();
        }).end(done);
      });
    });

  });

  describe('Given a functioning customModel cloudant store ', function () {
    //Setup our initial copy of Test Model for Creation
    var modelToCreate = JSON.parse(JSON.stringify(testConstants.testModel));
    delete modelToCreate.custom_model_id;
    delete modelToCreate.trained_model_id;
    delete modelToCreate.file_batch_id;
    delete modelToCreate.status;
    delete modelToCreate.status_date;

    describe('When I create a model ', function () {
      //- POST: ' + urlPrefix + '/customModels

      it('Then I receive a ' + HTTPStatus.CREATED + ' status code and a JSON payload containing the created model', function (done) {

        var nockScope1 = cloudantModelsNock.createTestModel();
        var nockScope2 = cloudantModelsNock.ensureUniqueness_respond1();
        var nockScope3 = cloudantModelsNock.updateModelTestModel();
        request(this.app).post(urlPrefix + '/customModels').send(modelToCreate)
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.CREATED) return 'Expected a ' + HTTPStatus.CREATED + ' return code but got ' + res.statusCode;
            nockScope1.done();
            nockScope2.done();
            nockScope3.done();                    //Prepare response for checking;
            if (res.body.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be' + constants.UNTRAINED_MODELID;
            res.body.trained_model_id = testConstants.testModel.trained_model_id;
            if (res.body.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
            res.body.status = testConstants.testModel.status;
            var response = testConstants.checkModel(res.body);
            if (response !== undefined) return response;
          }).end(done);
      });
    });
    describe('When I create a model that already exists ', function () {
      //- POST: ' + urlPrefix + '/customModels
      it('Then it should fail with a status ' + HTTPStatus.CONFLICT, function (done) {
        var nockScope1 = cloudantModelsNock.createTestModel();
        var nockScope2 = cloudantModelsNock.ensureUniqueness_respond2();
        var nockScope3 = cloudantModelsNock.deleteTestModel();
        request(this.app).post(urlPrefix + '/customModels').send(modelToCreate).expect(function (res) {
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
          if (res.statusCode !== HTTPStatus.CONFLICT) return 'Expected a ' + HTTPStatus.CONFLICT + ' return code';
        }).end(done);
      });
    })

  });

  describe('Given a functioning customModel cloudant store ', function () {
    describe('When there are no models for my tenancy and I list them ', function () {
      //- GET: ' + urlPrefix + '/:tenant_id/customModels
      it('Then it should return status ' + HTTPStatus.OK + ' and an empty array', function (done) {
        var nockScope = cloudantModelsNock.getAllNoModels();
        request(this.app).get(urlPrefix + '/customModels').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope.done();
          if (!(res.body instanceof Array)) return 'Not an Array';
          if (res.body.length !== 0) return 'Array not empty';
        }).end(done);
      });
    });

    describe('When one model exists for my tenancy and I list all models ', function () {
      //- GET: ' + urlPrefix + '/:tenant_id/customModels
      it('Then it should return status ' + HTTPStatus.OK + ' and an array with one entry', function (done) {
        var nockScope = cloudantModelsNock.getAllOneModel();
        request(this.app).get(urlPrefix + '/customModels')
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
            if (!(res.body instanceof Array)) return 'Not an Array';
            if (res.body.length !== 1) return 'Array should have one entry';
            nockScope.done();
            var model = res.body[0];
            var response = testConstants.checkModel(model);
            if (response !== undefined) return response;
          }).end(done);
      });
    });

    describe('When a model exists for a project for my tenancy and I list all models for a project ', function () {
      //- GET: ' + urlPrefix + '/:tenant_id/customModels?project=' + testConstants.testModel.project
      it('Then should return status ' + HTTPStatus.OK + ' and an array with one entry', function (done) {
        var nockScope = cloudantModelsNock.getAllByProjectOneModel();
        request(this.app).get(urlPrefix + '/customModels?project=' + testConstants.testModel.project)
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
            if (!(res.body instanceof Array)) return 'Not an Array';
            if (res.body.length !== 1) return 'Array should have one entry';
            nockScope.done();
            var model = res.body[0];
            var response = testConstants.checkModel(model);
            if (response !== undefined) return response;
          }).end(done);
      });
    })
  });

  describe('Given a functioning customModel cloudant store and a delete call ', function () {
    //- DELETE: ' + urlPrefix + '/:tenant_id/customModels/:custom_model_id
    describe('When the model to be deleted does not exist', function () {
      it('Then it should return status ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).delete(urlPrefix + '/customModels/ImaginaryCustomModel').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });
    });

    describe('When the model to delete exists and is untrained ', function () {
      it('Then it should return status ' + HTTPStatus.NO_CONTENT, function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelFilesLoaded();
        var nockScope2 = cloudantModelsNock.deleteTestModel();
        var nockScope3 = cloudantModelsNock.updateTestModelFilesLoadedMarkedForDeletion();
        request(this.app).delete(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id).expect(function (res) {
          if (res.statusCode !== HTTPStatus.NO_CONTENT) return 'Expected a ' + HTTPStatus.NO_CONTENT + ' return code';
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
        }).end(done);
      });
    });

    describe('When the model to delete exists and is trained ', function () {
      it('Then it should return status ' + HTTPStatus.NO_CONTENT, function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = cloudantModelsNock.deleteTestModel();
        var nockScope3 = ltNock.deleteModel();
        var nockScope4 = cloudantModelsNock.updateTestModelFilesLoadedMarkedForDeletion();
        request(this.app).delete(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id).expect(function (res) {
          if (res.statusCode !== HTTPStatus.NO_CONTENT) return 'Expected a ' + HTTPStatus.NO_CONTENT + ' return code';
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
          nockScope4.done();
        }).end(done);
      });
    })
  });

  describe('Given a functioning customModel cloudant store and a train call ', function () {
    //GET: ' + constants.urlPrefix + ':tenant_id/customModels/:custom_model_id/train

    describe('When the model to train doesn\'t exist', function () {
      it('Then it should return status ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).get(urlPrefix + '/customModels/ImaginaryCustomModel/train').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });
    });

    describe('When the model to train has a batch id which is unknown to filestorage', function () {
      it('Then it should return status ' + HTTPStatus.INTERNAL_SERVER_ERROR + ' bad batch id', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdBadBatchTestModel();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testBadBatchModel.custom_model_id + '/train').expect(function (res) {
          if (res.statusCode !== HTTPStatus.INTERNAL_SERVER_ERROR) return 'Expected a ' + HTTPStatus.INTERNAL_SERVER_ERROR + ' return code';
          nockScope1.done();
        }).end(done);
      });
    });

    describe('When the model to train is ready for training and consists of glossary, parallel and monolingual corpus training files', function () {
      // this.timeout(2000000)
      it('Then it should return an updated model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = ltNock.trainModel();
        var nockScope3 = cloudantModelsNock.updateModelTestModelAfterTraining();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/train').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
          if (res.body.status !== statuses.TRAINING) return 'Expected status to be' + statuses.TRAINING;
          res.body.status = testConstants.testModel.status;
          var response = testConstants.checkModel(res.body);
          if (response !== undefined) return response;
        }).end(done);
      });
    });

  });

  describe('Given a functioning customModel cloudant store and a clone call', function () {
//'POST: ' + constants.urlPrefix + '/:tenant_id/customModels/:custom_model_id/clone'
    var newModel = {
      name : testConstants.testClonedModel.name,
      description : testConstants.testClonedModel.description
    };

    var newModelExtraProperty = {
      name : testConstants.testClonedModel.name,
      description : testConstants.testClonedModel.description,
      files : ['myfile.tmx']
    };


    describe('When I clone a model which doesn\'t exist', function () {
      it('Then it should return status ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdNonExisting();
        request(this.app).post(urlPrefix + '/customModels/ImaginaryCustomModel/clone').send(newModel).expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope1.done();
        }).end(done);
      });
    });

    describe('When I clone a model which does exist', function () {
      it('Then it should return status ' + HTTPStatus.OK + ' and created model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = cloudantModelsNock.createClonedModel();
        var nockScope3 = cloudantModelsNock.ensureUniquenessCloned_respond1();
        var nockScope4 = cloudantModelsNock.updateModelClonedModel();
        request(this.app).post(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/clone').send(newModel)
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.CREATED) return 'Expected a ' + HTTPStatus.CREATED + ' return code';
            nockScope1.done();
            nockScope2.done();
            nockScope3.done();
            nockScope4.done();
            //Prepare response for checking;
            if (res.body.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be' + constants.UNTRAINED_MODELID;
            res.body.trained_model_id = testConstants.testModel.trained_model_id;
            if (res.body.name !== testConstants.testClonedModel.name) return 'Expected name to be ' + testConstants.testClonedModel.name;
            res.body.name = testConstants.testModel.name;
            if (res.body.description !== testConstants.testClonedModel.description) return 'Expected description to be ' + testConstants.testClonedModel.description;
            res.body.description = testConstants.testModel.description;
            if (res.body.custom_model_id !== testConstants.testClonedModel.custom_model_id) return 'Expected custom_model_id to be ' + testConstants.testClonedModel.custom_model_id;
            res.body.custom_model_id = testConstants.testModel.custom_model_id;
            if (res.body.file_batch_id !== testConstants.testClonedModel.file_batch_id) return 'Expected file_batch_id to be ' + testConstants.testClonedModel.file_batch_id;
            res.body.file_batch_id = testConstants.testModel.file_batch_id;
            if (res.body.status !== statuses.FILESLOADED) return 'Expected status to be' + statuses.FILESLOADED;
            res.body.status = testConstants.testModel.status;
            if (res.body.cloned_from !== testConstants.testClonedModel.cloned_from) return 'Expected clone from to be ' + testConstants.testClonedModel.cloned_from;
            delete res.body.cloned_from;
            if (typeof res.body.cloned_date === 'undefined') return ' No cloned_date defined';
            delete res.body.cloned_date;
            var response = testConstants.checkModel(res.body);
            if (response !== undefined) return response;
          }).end(done);
      });
    });

    describe('When I clone a model which has no files loaded', function () {
      it('Then it should return status ' + HTTPStatus.OK + ' and created model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelCreated();
        var nockScope2 = cloudantModelsNock.createClonedModelCreated();
        var nockScope3 = cloudantModelsNock.ensureUniquenessCloned_respond1();
        var nockScope4 = cloudantModelsNock.updateModelClonedModelCreated();
        request(this.app).post(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + 'CREATED/clone').send(newModel)
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.CREATED) return 'Expected a ' + HTTPStatus.CREATED + ' return code';
            nockScope1.done();
            nockScope2.done();
            nockScope3.done();
            nockScope4.done();
            //Prepare response for checking;
            if (res.body.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be' + constants.UNTRAINED_MODELID;
            res.body.trained_model_id = testConstants.testModel.trained_model_id;
            if (res.body.name !== testConstants.testClonedModel.name) return 'Expected name to be ' + testConstants.testClonedModel.name;
            res.body.name = testConstants.testModel.name;
            if (res.body.description !== testConstants.testClonedModel.description) return 'Expected description to be ' + testConstants.testClonedModel.description;
            res.body.description = testConstants.testModel.description;
            if (res.body.custom_model_id !== testConstants.testClonedModel.custom_model_id) return 'Expected custom_model_id to be ' + testConstants.testClonedModel.custom_model_id;
            res.body.custom_model_id = testConstants.testModel.custom_model_id;
            if (res.body.file_batch_id !== testConstants.testClonedModel.file_batch_id) return 'Expected file_batch_id to be ' + testConstants.testClonedModel.file_batch_id;
            res.body.file_batch_id = testConstants.testModel.file_batch_id;
            if (res.body.status !== statuses.CREATED) return 'Expected status to be' + statuses.CREATED;
            res.body.status = testConstants.testModel.status;
            if (res.body.cloned_from !== testConstants.testClonedModel.cloned_from + 'CREATED') return 'Expected clone from to be ' + testConstants.testClonedModel.cloned_from;
            delete res.body.cloned_from;
            if (typeof res.body.cloned_date === 'undefined') return ' No cloned_date defined';
            delete res.body.cloned_date;
            var response = testConstants.checkModel(res.body);
            if (response !== undefined) return response;
          }).end(done);
      });
    });


    describe('When I clone a model which does exist but provide an unexpected Property', function () {
      it('Then it should return status ' + HTTPStatus.OK + ' and created model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = cloudantModelsNock.createClonedModel();
        var nockScope3 = cloudantModelsNock.ensureUniquenessCloned_respond1();
        var nockScope4 = cloudantModelsNock.updateModelClonedModel();
        request(this.app).post(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/clone').send(newModelExtraProperty)
          .expect(function (res) {
            if (res.statusCode !== HTTPStatus.CREATED) return 'Expected a ' + HTTPStatus.CREATED + ' return code';
            nockScope1.done();
            nockScope2.done();
            nockScope3.done();
            nockScope4.done();

            //Prepare response for checking;
            if (res.body.trained_model_id !== constants.UNTRAINED_MODELID) return 'Expected trained_model_id to be' + constants.UNTRAINED_MODELID;
            res.body.trained_model_id = testConstants.testModel.trained_model_id;
            if (res.body.name !== testConstants.testClonedModel.name) return 'Expected name to be ' + testConstants.testClonedModel.name;
            res.body.name = testConstants.testModel.name;
            if (res.body.description !== testConstants.testClonedModel.description) return 'Expected description to be ' + testConstants.testClonedModel.description;
            res.body.description = testConstants.testModel.description;
            if (res.body.custom_model_id !== testConstants.testClonedModel.custom_model_id) return 'Expected custom_model_id to be ' + testConstants.testClonedModel.custom_model_id;
            res.body.custom_model_id = testConstants.testModel.custom_model_id;
            if (res.body.file_batch_id !== testConstants.testClonedModel.file_batch_id) return 'Expected file_batch_id to be ' + testConstants.testClonedModel.file_batch_id;
            res.body.file_batch_id = testConstants.testModel.file_batch_id;
            if (res.body.status !== statuses.FILESLOADED) return 'Expected status to be' + statuses.FILESLOADED;
            res.body.status = testConstants.testModel.status;
            if (res.body.cloned_from !== testConstants.testClonedModel.cloned_from) return 'Expected clone from to be ' + testConstants.testClonedModel.cloned_from;
            delete res.body.cloned_from;
            if (typeof res.body.cloned_date === 'undefined') return ' No cloned_date defined';
            delete res.body.cloned_date;
            var response = testConstants.checkModel(res.body);
            if (response !== undefined) return response;
          }).end(done);
      });
    });


  });

  describe('Given a functioning customModel cloudant store and a status call', function () {
    //GET: ' + constants.urlPrefix + '/:tenant_id/customModels/:custom_model_id/status
    describe('When I get status of a model which doesn\'t exist', function () {
      it('Then it should return ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).get(urlPrefix + '/customModels/ImaginaryCustomModel/status').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });

    });

    describe('When I get status of an untrained model', function () {
      it('Then it should return HTTP Status ' + HTTPStatus.OK + ' and status= ' + statuses.FILESLOADED + ' and a date ', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelFilesLoaded();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/status').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          if (typeof res.body.status === 'undefined') return ' No status defined';
          if (typeof res.body.status_date === 'undefined') return ' No status_date defined';
          if (res.body.status !== statuses.FILESLOADED) return ' Expected status to be Ready for Training';
        }).end(done);
      });
    });
    describe('When I get status of a trained model', function () {
      it('Then it should return HTTP Status ' + HTTPStatus.OK + ' and status= ' + statuses.TRAINED + ' and a date ', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/status').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          if (typeof res.body.status === 'undefined') return ' No status defined';
          if (typeof res.body.status_date === 'undefined') return ' No status_date defined';
          if (res.body.status !== statuses.TRAINED) return ' Expected status to be Trained';
        }).end(done);
      });
    });

    describe('When I get status of a model which has just finished training', function () {
      it('Then it should return HTTP Status ' + HTTPStatus.OK + ' and status= ' + statuses.TRAINED + ' and a date ', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelTraining();
        var nockScope2 = ltNock.status_available();
        var nockScope3 = cloudantModelsNock.updateModelTestModelTrained();

        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/status').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          nockScope2.done();
          if (typeof res.body.status === 'undefined') return ' No status defined';
          if (typeof res.body.status_date === 'undefined') return ' No status_date defined';
          if (res.body.status !== statuses.TRAINED) return ' Expected status to be Trained';
        }).end(done);
      });
    });
  });

  describe('Given a functioning customModel cloudant store and a trainingLog call', function () {
    //GET: ' + constants.urlPrefix + '/:tenant_id/customModels/:custom_model_id/trainingLog
    describe('When I get trainingLog of a model which doesn\'t exist', function () {
      it('Then it should return ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).get(urlPrefix + '/customModels/ImaginaryCustomModel/trainingLog').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });

    });
    describe('When I get trainingLog of an model with no trainedModelId', function () {
      it('Then it should return HTTP Status ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelFilesLoaded();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/trainingLog').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope1.done();
        }).end(done);
      });
    });
    describe('When I get trainingLog of a trained model', function () {
      it('Then it should return HTTP Status ' + HTTPStatus.OK + ' and log=' + ltNock.sucessfulTrainingLog, function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = ltNock.getTrainingLog(testConstants.testModel.trained_model_id);
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/trainingLog').expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          nockScope2.done();
          if (typeof res.body === 'undefined') return ' No log returned';
          if (typeof res.body.trainingLog === 'undefined') return ' No log returned';
          if (res.body.trainingLog !== ltNock.sucessfulTrainingLog) return ' Log contents not as expected';
        }).end(done);
      });
    });
  });

  describe('Given a functioning customModel cloudant store and a translate call', function () {
    // GET: ' + constants.urlPrefix + '/:tenant_id/customModels/:custom_model_id/translate
    var textToTranslate = {
      text : 'The quick brown fox jumped over the lazy dog'
    };
    describe('When I try to translate using a model which doesn\'t exist', function () {
      it('Then it should return ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).post(urlPrefix + '/customModels/ImaginaryCustomModel/translate').send(textToTranslate).expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });
    });
    describe('When I try to translate using a model has been trained', function () {
      it('should return ' + HTTPStatus.OK + ' and the translated text', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelTraining();
        var nockScope2 = ltNock.translate();
        request(this.app).post(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/translate').send(textToTranslate).expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          nockScope2.done();
          if (typeof res.body === 'undefined') return ' No response';
          if (res.body.text !== textToTranslate.text) return ' text to translate doesn\'t match';
          if (typeof res.body.translation === 'undefined') return ' No translation returned';
          if (res.body.translation !== 'this is the translation output') return ' text to translate doesn\'t match';
        }).end(done);
      });
    });

    describe('When I try to translate using a model has not yet been trained', function () {
      it('should return ' + HTTPStatus.OK + ' and the translated text resulting from using the base model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModelFilesLoaded();
        var nockScope2 = ltNock.translateBaseModel();
        request(this.app).post(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/translate').send(textToTranslate).expect(function (res) {
          if (res.statusCode !== HTTPStatus.OK) return 'Expected a ' + HTTPStatus.OK + ' return code';
          nockScope1.done();
          nockScope2.done();
          if (typeof res.body === 'undefined') return ' No response';
          if (res.body.text !== textToTranslate.text) return ' text to translate doesn\'t match';
          if (typeof res.body.translation === 'undefined') return ' No translation returned';
          if (res.body.translation !== 'this is the translation output') return ' text to translate doesn\'t match';
        }).end(done);
      });

    });
  });

  describe('Given a functioning customModel cloudant store and an update custom model call', function () {
    // PUT: ' + constants.urlPrefix + '/:tenant_id/customModels/:custom_model_id
    var date = Date.now();

    var newModelDetails = {
      name : 'MyUpdatedModel',
      description : 'I am updated model',
      status : statuses.TRAINED,
      status_date : date.toString()
    };

    var newModelDetailsExtraProperty = {
      name : 'MyUpdatedModel',
      description : 'I am updated model',
      status : statuses.TRAINED,
      status_date : date.toString(),
      files : ['myfile.tmx']
    };


    describe('When I update a model which doesn\'t exist', function () {
      it('Then it should return ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).put(urlPrefix + '/customModels/ImaginaryCustomModel').send(newModelDetails).expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });
    });

    describe('When I Update a model which does exist', function () {
      it('Then it should return status ' + HTTPStatus.CREATED + ' and the updated model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = cloudantModelsNock.updateTestModel();
        request(this.app).put(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id).send(newModelDetails).expect(function (res) {
          if (res.statusCode !== HTTPStatus.CREATED) return 'Expected a ' + HTTPStatus.CREATED + ' return code';
          nockScope1.done();
          nockScope2.done();
          if (res.body.status !== statuses.TRAINED) return 'Expected status to be' + statuses.TRAINED;
          res.body.status = testConstants.testModel.status;
          if (res.body.name !== newModelDetails.name) return 'Expected name to be' + newModelDetails.name;
          res.body.name = testConstants.testModel.name;
          if (res.body.description !== newModelDetails.description) return 'Expected description to be' + newModelDetails.description;
          res.body.description = testConstants.testModel.description;
          var response = testConstants.checkModel(res.body);
          if (response !== undefined) return response;
        }).end(done);
      });
    });

    describe('When I Update a model which does exist with an unexpected property', function () {
      it('Then it should return status ' + HTTPStatus.CREATED + ' and the updated model', function (done) {
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = cloudantModelsNock.updateTestModel();
        request(this.app).put(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id).send(newModelDetailsExtraProperty).expect(function (res) {
          if (res.statusCode !== HTTPStatus.CREATED) return 'Expected a ' + HTTPStatus.CREATED + ' return code';
          nockScope1.done();
          nockScope2.done();
          if (res.body.status !== statuses.TRAINED) return 'Expected status to be' + statuses.TRAINED;
          res.body.status = testConstants.testModel.status;
          if (res.body.name !== newModelDetails.name) return 'Expected name to be' + newModelDetails.name;
          res.body.name = testConstants.testModel.name;
          if (res.body.description !== newModelDetails.description) return 'Expected description to be' + newModelDetails.description;
          res.body.description = testConstants.testModel.description;
          var response = testConstants.checkModel(res.body);
          if (response !== undefined) return response;
        }).end(done);
      });
    });
  });

  describe('Given a functioning customModel cloudant store and a resetTraining call ', function () {

    describe('When the model to have training reset does not exist', function () {
      it('Then it should return status ' + HTTPStatus.NOT_FOUND + ' not found', function (done) {
        var nockScope = cloudantModelsNock.getByIdNonExisting();
        request(this.app).get(urlPrefix + '/customModels/ImaginaryCustomModel/resetTraining').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NOT_FOUND) return 'Expected a ' + HTTPStatus.NOT_FOUND + ' return code';
          nockScope.done();
        }).end(done);
      });
    });

    describe('When the model to have training reset is files loaded', function () {
      it('Then it should return status ' + HTTPStatus.BAD_REQUEST + ' bad request', function (done) {
        var nockScope = cloudantModelsNock.getByIdTestModelFilesLoaded();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/resetTraining').expect(function (res) {
          if (res.statusCode !== HTTPStatus.BAD_REQUEST) return 'Expected a ' + HTTPStatus.BAD_REQUEST + ' return code';
          nockScope.done();
        }).end(done);
      });
    });

    describe('When the model to have training reset is training', function () {
      it('Then it should return status ' + HTTPStatus.NO_CONTENT + ' OK', function (done) {
        var nockScope3 = cloudantModelsNock.updateModelTestModelReadyForTraining();
        var nockScope1 = cloudantModelsNock.getByIdTestModel();
        var nockScope2 = ltNock.deleteModel();
        request(this.app).get(urlPrefix + '/customModels/' + testConstants.testModel.custom_model_id + '/resetTraining').expect(function (res) {
          if (res.statusCode !== HTTPStatus.NO_CONTENT) return 'Expected a ' + HTTPStatus.NO_CONTENT + ' return code';
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
        }).end(done);
      });
    });
  });

});
