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
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache();
var sinonChai = require('sinon-chai');
var should = chai.should();
var expect = chai.expect;
chai.use(sinonChai);
var promise = require('bluebird');
// test dependencies
var mocks = require('../../test/mocks');
var constants = require('./constants.js');
var statuses = constants.statuses;
var errorDetails = constants.errorDetails;

var customModelTraining;

describe('/server/components/lt/index', function () {

  before(function () {
    this.originalExportTesting = process.env.EXPORT_ALL_FOR_TESTING;
    process.env.EXPORT_ALL_FOR_TESTING = 'true';
  });

  after(function () {
    if(this.originalExportTesting) {
      process.env.EXPORT_ALL_FOR_TESTING = this.originalExportTesting;
    }
  });

  beforeEach(function () {
    this.logMock = new mocks.LogMock();
    this.credentialsMock = mocks.credentialsMock;
    this.ltMock = new mocks.LTComponentMock();

    this.modelStoreMock = {};

    // local dependencies
    this.modelsController = proxyquire('./models.controller', {
      '../../components/lt' : this.ltMock,
      '../../components/modelStore' : this.modelStoreMock,
      '../../config/log' : this.logMock
    });
  });

  describe('#updateLatestStatus()', function () {

    beforeEach(function () {
      customModelTraining = {
        status : statuses.TRAINING,
        trained_model_id : 'MyTrainedModelId',
        status_date : 12847102847
      };
    });

    it('should do nothing if a model isn\'t training ', function (done) {
      var customModel = {
        status : 'NOTTRAINING'
      };
      this.modelsController.updateLatestStatus(this.credentialsMock, customModel).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(1);
        updatedModel.status.should.equal('NOTTRAINING');
        done();
      })
    });

    it('should just return an up to date status_date if status is training ', function (done) {
      var ltResponse = {status : 'training'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(3);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        done();
      })
    });

    it('should update status to ' + statuses.TRAINED + ' if model is now available ', function (done) {
      var ltResponse = {status : 'available'};

      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      sinon.stub(this.modelStoreMock, 'update', function (updatedModel) {
        return promise.resolve(updatedModel);
      });

      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(3);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINED);
        done();
      })
    });

    it('should add property status_detail : starting if model is now starting ', function (done) {
      var ltResponse = {status : 'starting'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('starting');
        done();
      })
    });

    it('should add property status_detail : starting if model is now uploading ', function (done) {
      var ltResponse = {status : 'uploading'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('uploading');
        done();
      })
    });

    it('should add property status_detail : starting if model is now uploaded ', function (done) {
      var ltResponse = {status : 'uploaded'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('uploaded');
        done();
      })
    });

    it('should add property status_detail : starting if model is now dispatching ', function (done) {
      var ltResponse = {status : 'dispatching'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('dispatching');
        done();
      })
    });

    it('should add property status_detail : starting if model is now trained ', function (done) {
      var ltResponse = {status : 'trained'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('trained');
        done();
      })
    });

    it('should add property status_detail : starting if model is now publishing ', function (done) {
      var ltResponse = {status : 'publishing'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('publishing');
        done();
      })
    });

    it('should add property status_detail : starting if model is now queued ', function (done) {
      var ltResponse = {status : 'queued@34'};
      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.TRAINING);
        updatedModel.status_detail.should.equal('queued@34');
        done();
      })
    });

    it('should update status to ' + statuses.WARNING + ' if model is now deleted ', function (done) {
      var ltResponse = {status : 'deleted'};

      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      sinon.stub(this.modelStoreMock, 'update', function (updatedModel) {
        return promise.resolve(updatedModel);
      });

      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.WARNING);
        updatedModel.status_detail.should.equal('deleted');
        done();
      })
    });

    it('should update status to ' + statuses.WARNING + ' if trained model status is unrecognised ', function (done) {
      var ltResponse = {status : 'rubbish'};

      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      sinon.stub(this.modelStoreMock, 'update', function (updatedModel) {
        return promise.resolve(updatedModel);
      });

      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.WARNING);
        updatedModel.status_detail.should.equal('rubbish');
        done();
      })
    });

    it('should update status to ' + statuses.WARNING + ' if trained model status is unavailable ', function (done) {
      var ltResponse = {status : 'unavailable'};

      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      sinon.stub(this.modelStoreMock, 'update', function (updatedModel) {
        return promise.resolve(updatedModel);
      });

      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.WARNING);
        updatedModel.status_detail.should.equal('unavailable');
        done();
      })
    });

    it('should pass up any exception from checking status with Lanaguage Translation Service ', function (done) {
      var ltResponse = function () {
        throw {errorCode : 999};
      };
      this.ltMock.getModel = promise.promisify(ltResponse);

      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining)
        .then(function (updatedModel) {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          expect(e.errorCode).to.eql(999);
          done();
        })
    })

    it('should update status to ' + statuses.WARNING + ' and status_detail to ' + errorDetails.UNKNOWN + ' if model is in error ', function (done) {
      var ltResponse = {status : 'error'};
      var ltUnparsableLog = {
        trainingLog : 'TRAINING SERVER LOG:\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        '>>>  Validating tmx files\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        'language pair      : en-us_es-es\n' +
        'template directory : /opt/ibm/rct/models/en-us_es-es\n' +
        'parallel corpus    : (none)\n' +
        'monolingual corpus : (none)\n' +
        'project directory  : /home/laser/rct-service-1.0.0-SNAPSHOT/workspace/REDACTED/build\n' +
        'forced glossary    : /home/laser/rct-service/workspace/REDACTED/dataset/forced_glossary/aren.tmx\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        '>>>  Tokenizing and parsing\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        'preserving these markup tags: (none)\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        '>>>  Packaging customized model\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n'
      };

      this.ltMock.getModel.returns(promise.resolve(ltResponse));
      this.ltMock.getTrainingLog.returns(promise.resolve(ltUnparsableLog));
      sinon.stub(this.modelStoreMock, 'update', function (updatedModel) {
        return promise.resolve(updatedModel);
      });

      this.modelsController.updateLatestStatus(this.credentialsMock, customModelTraining).then(function (updatedModel) {
        expect(Object.keys(updatedModel).length).to.eql(4);
        updatedModel.trained_model_id.should.equal('MyTrainedModelId');
        updatedModel.status_date.should.not.equal(12847102847);
        expect(updatedModel.status).to.eql(statuses.WARNING);
        updatedModel.status_detail.should.equal(errorDetails.UNKNOWN);
        done();
      })
    });

  });

  describe('#transformRequestModel()', function () {

    it('should handle missing metadata ', function (done) {
      var customModel = {
        project : 'project'
      };
      var newModel=this.modelsController.transformRequestModel(customModel);
      expect(newModel.metadata._project).to.eql('project');
      expect(newModel).to.not.have.property('project');
      done();
    });

  });

  describe('#prepareCustomModelForResponse()', function () {

    it('should handle missing metadata ', function (done) {
      var customModel = {
        project : 'project',
        type : 'type',
        _rev : '_rev',
        _id : '_id',
        tenant_id : 'tenant_id'
      };
      var newModel=this.modelsController.prepareCustomModelForResponse(customModel);
      expect(newModel.project).to.eql('project');
      expect(newModel).to.not.have.property('type');
      expect(newModel).to.not.have.property('_rev');
      expect(newModel).to.not.have.property('_id');
      expect(newModel).to.not.have.property('tenant_id');
      done();
    });

  });

  describe('#prepareStatusForResponse()', function () {

    it('should handle missing metadata ', function (done) {
      var customModel = {
        status : 'status',
        status_date : 'status_date',
        status_detail : 'status_detail'
      };
      var status=this.modelsController.prepareStatusForResponse(customModel);
      expect(status.status).to.eql('status');
      expect(status.status_date).to.eql('status_date');
      expect(status.status_detail).to.eql('status_detail');
      done();
    });

  });

  describe('#parseTrainingLogForErrorReason()', function () {

    it('should parse the log to establish status detail as ' + errorDetails.BADFILE, function (done) {
      var ltTrainingLog = 'TRAINING SERVER LOG:\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        '>>>  Validating tmx files\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        'language pair      : en-us_es-es\n' +
        'template directory : /opt/ibm/rct/models/en-us_es-es\n' +
        'parallel corpus    : (none)\n' +
        'monolingual corpus : (none)\n' +
        'project directory  : /home/laser/rct-service-1.0.0-SNAPSHOT/workspace/REDACTED/build\n' +
        'forced glossary    : /home/laser/rct-service/workspace/REDACTED/dataset/forced_glossary/aren.tmx\n' +
        '\n' +
        '\n' +
        'Bad TMX file: /home/laser/rct-service/workspace/REDACTED/dataset/forced_glossary/aren.tmx\n' +
        'Bad TMX format /home/laser/rct-service/workspace/REDACTED/dataset/forced_glossary/aren.tmx\n' +
        'RCT failed! See run.log for details\n';

      var status_detail = this.modelsController.parseTrainingLogForErrorReason(ltTrainingLog);
      status_detail.should.equal(errorDetails.BADFILE);
      done();
    });

    it('should parse the log to establish status detail as ' + errorDetails.INSUFFICIENTSEGMENTS, function (done) {
      var ltTrainingLog = 'FRONT END LOG:\n' +
        'T=2015-12-30 20:23:21.600 start event API_ADD in state STARTING\n' +
        'T+0.284s transition from UPLOADING to UPLOADED on event WS_OK\n' +
        'T+0.295s transition from UPLOADED to DISPATCHING on event XFER_OK\n' +
        'T+1.703s transition from DISPATCHING to ERROR on event MQ_ERR\n' +
        'TRAINING SERVER LOG:\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        '>>>  Wed Dec 30 20:23:22 2015	Validating tmx files\n' +
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
        'language pair      : en-us_es-es\n' +
        'template directory : /opt/ibm/rct/models/en-us_es-es\n' +
        'parallel corpus    : (none)\n' +
        'monolingual corpus : (none)\n' +
        'project directory  : /home/laser/rct-service-1.0.0-SNAPSHOT/workspace/REDACTED/build\n' +
        'forced glossary    : /home/laser/rct-service/workspace/REDACTED/dataset/forced_glossary/aren.tmx\n' +
        'A minimum of 5000 parallel segments is required for customization and you provided only 1000.\n' +
        'RCT failed! See run.log for details\n';

      var status_detail = this.modelsController.parseTrainingLogForErrorReason(ltTrainingLog);
      status_detail.should.equal(errorDetails.INSUFFICIENTSEGMENTS);
      done();
    });

  });

});
