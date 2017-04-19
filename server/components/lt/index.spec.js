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
/*eslint func-names: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var ltErrors = require('../ltErrors');
var env = require('../../config/environment');
var LTServiceError = require('../common').LTServiceError;
// test dependencies
var mocks = require('../../test/mocks');

var serviceUrl = env.endpoints.language_translator + '/v2';

var should = chai.should();
chai.use(sinonChai);

var failedResponseHeader = {
  'x-backside-transport' : 'FAIL FAIL',
  connection : 'Keep-Alive',
  'transfer-encoding' : 'chunked',
  'server' : '-',
  date : 'Wed, 18 Nov 2015 15:17:28 GMT',
  'x-service-api-version' : '2.0-SNAPSHOT',
  'content-disposition' : 'inline',
  pragma : 'no-cache',
  'x-watson-userinfo' : 'REDACTED',
  'content-type' : 'application/json;charset=utf-8',
  'set-cookie' : ['Watson-DPAT=REDACTED; path=/language-translator/api; secure; HttpOnly'],
  'x-client-ip' : 'REDACTED',
  'x-global-transaction-id' : '91589288',
  'x-dp-watson-tran-id' : 'sdgd-91589288',
  'x-watson-user-customize-allowed' : 'true'
};

describe('/server/components/lt/index', function () {

  var checkError = function (e, errorCode, url) {
    expect(e.errorCode).to.exist;
    expect(LTServiceError.prototype.isPrototypeOf(e)).to.be.true;
    e.errorCode.should.equal(errorCode);
    expect(e.message).to.exist;
    expect(e.inserts.url).to.eql(url);
  };

  before(function () {

  });

  beforeEach(function () {
    this.logMock = new mocks.LogMock();
    this.requestMock = new mocks.RequestMock();
    this.credentialsMock = mocks.credentialsMock;
    // local dependencies
    this.lt = proxyquire('./index', {
      'request' : this.requestMock,
      '../../config/log' : this.logMock
    });
  });

  describe('#getModels()', function () {

    var baseModelQueryOptions = {
      default : 'true'
    };

    var genericGetModelsRequest = {
      uri : {
        protocol : 'https:',
        slashes : true,
        auth : 'testuser:password',
        host : 'testlt.api.url',
        port : 80,
        hostname : 'testlt.api.url',
        hash : null,
        search : '?default=true',
        query : 'default=true',
        pathname : '/language-translator/api/v2/models',
        path : '/language-translator/api/v2/models' + '?default=true',
        href : 'REDACTED'
      },
      method : 'GET',
      headers : {
        authorization : 'Basic dGVzdHVzZXI6cGFzc3dvcmQ='
      }
    };


    beforeEach(function () {

    });


    it('should handle non Json body and unmatched statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 999,
        body : body,
        headers : {
          'content-type' : 'text/html',
          'x-backside-transport' : 'FAIL FAIL',
          connection : 'close',
          'x-watson-user-customize-allowed' : 'true'
        },
        request : genericGetModelsRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getModels(this.credentialsMock, baseModelQueryOptions).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models?default=true');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(3);
          done();
        })
    });

    it('should handle non Json body and OK statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 200,
        body : body,
        headers : failedResponseHeader,
        request : genericGetModelsRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getModels(this.credentialsMock, baseModelQueryOptions).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models?default=true');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(3);
          done();
        })
    });

    it('should handle no query options and no models property in response ', function (done) {
      var body = '{"fred" : "HELLO"}';
      var response = {
        statusCode : 200,
        body : body,
        headers : failedResponseHeader,
        request : genericGetModelsRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getModels(this.credentialsMock, null).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(3);
          done();
        })
    });
    it('should handle a response header x-watson-user-customize-allowed = false ', function (done) {
      var body = '{"fred" : "HELLO"}';
      var response = {
        statusCode : 200,
        body : body,
        headers : {
          'x-watson-user-customize-allowed' : 'false'
        },
        request : genericGetModelsRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getModels(this.credentialsMock, null).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.wrongLTPlan, serviceUrl + '/models');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(3);
          done();
        })
    });
  })

  describe('#getModel()', function () {

    var trainedModelId = 'DummyTrainedModelId';

    var genericGetModelRequest = {
      uri: {
        protocol: 'https:',
        slashes: true,
        auth: 'testuser:password',
        host: 'testlt.api.url',
        port: 80,
        hostname: 'testlt.api.url',
        hash: null,
        pathname: '/language-translator/api/v2/models/' + trainedModelId,
        path: '/language-translator/api/v2/models/' + trainedModelId,
        href: 'REDACTED'
      },
      method: 'GET',
      headers: {
        authorization: 'Basic dGVzdHVzZXI6cGFzc3dvcmQ='
      }
    }

    beforeEach(function () {

    })

    it('should handle non Json body and unmatched statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 999,
        body : body,
        headers : {
          'content-type' : 'text/html',
          'x-backside-transport' : 'FAIL FAIL',
          connection : 'close'
        },
        request : genericGetModelRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getModel(this.credentialsMock, trainedModelId).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models/' + trainedModelId);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(4);
          done();
        })
    });

    it('should handle non Json body and OK statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 200,
        body : body,
        headers : failedResponseHeader,
        request : genericGetModelRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getModel(this.credentialsMock, trainedModelId).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models/' + trainedModelId);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(3);
          done();
        })
    });
  })

  describe('#getTrainingLog()', function () {

    var trainedModelId = 'DummyTrainedModelId';

    var genericGetTrainingLogRequest = {
      uri : {
        protocol : 'https:',
        slashes : true,
        auth : 'testuser:password',
        host : 'testlt.api.url',
        port : 80,
        hostname : 'testlt.api.url',
        hash : null,
        search : '?verbose=true',
        query : 'verbose=true',
        pathname : '/language-translator/api/v2/models/' + trainedModelId,
        path : '/language-translator/api/v2/models/' + trainedModelId + '?verbose=true',
        href : 'REDACTED'
      },
      method : 'GET',
      headers : {
        authorization : 'Basic dGVzdHVzZXI6cGFzc3dvcmQ='
      }
    };

    beforeEach(function () {

    });

    it('should handle non Json body and unmatched statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 999,
        body : body,
        headers : {
          'content-type' : 'text/html',
          'x-backside-transport' : 'FAIL FAIL',
          connection : 'close'
        },
        request : genericGetTrainingLogRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getTrainingLog(this.credentialsMock, trainedModelId).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models/' + trainedModelId + '?verbose=true');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(e.inserts.trainedModelId).to.eql(trainedModelId);
          expect(Object.keys(e.inserts).length).to.eql(4);
          done();
        })
    });

    it('should handle non Json body and OK statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 200,
        body : body,
        headers : failedResponseHeader,
        request : genericGetTrainingLogRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getTrainingLog(this.credentialsMock, trainedModelId).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models/' + trainedModelId + '?verbose=true');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(3);
          done();
        })
    });

    it('should handle the wrong Json body and OK statusCode ', function (done) {
      var body = '{ "noModelId" : "3"}';
      var response = {
        statusCode : 200,
        body : body,
        headers : failedResponseHeader,
        request : genericGetTrainingLogRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.getTrainingLog(this.credentialsMock, trainedModelId).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models/' + trainedModelId + '?verbose=true');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(4);
          done();
        })
    });

  })

  describe('#deleteModel()', function () {

    var trainedModelId = 'DummyTrainedModelId';

    var genericDeleteModelRequest = {
      uri : {
        protocol : 'https:',
        slashes : true,
        auth : 'testuser:password',
        host : 'testlt.api.url',
        port : 80,
        hostname : 'testlt.api.url',
        hash : null,
        pathname : '/language-translator/api/v2/models/' + trainedModelId,
        path : '/language-translator/api/v2/models/' + trainedModelId,
        href : 'REDACTED'
      },
      method : 'DELETE',
      headers : {
        authorization : 'Basic dGVzdHVzZXI6cGFzc3dvcmQ='
      }
    };

    beforeEach(function () {

    });

    it('should handle non Json body and unmatched statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 999,
        body : body,
        headers : {
          'content-type' : 'text/html',
          'x-backside-transport' : 'FAIL FAIL',
          connection : 'close'
        },
        request : genericDeleteModelRequest
      };
      this.requestMock.del.callsArgWith(1, null, response, body);
      this.lt.deleteModel(this.credentialsMock, trainedModelId).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/models/' + trainedModelId);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(e.inserts.trainedModelId).to.eql(trainedModelId);
          expect(Object.keys(e.inserts).length).to.eql(4);
          done();
        })
    });
  })

  describe('#translate()', function () {

    var trainedModelId = 'DummyTrainedModelId';

    var textToTranslate = 'Hello world';

    var genericTranslateRequest = {
      uri : {
        protocol : 'https:',
        slashes : true,
        auth : 'testuser:password',
        host : 'testlt.api.url',
        port : 80,
        hostname : 'testlt.api.url',
        hash : null,
        search : '?model_id=' + trainedModelId + '&text=' + textToTranslate,
        query : 'model_id=' + trainedModelId + '&text=' + textToTranslate,
        pathname : '/language-translator/api/v2/translate',
        path : '/language-translator/api/v2/translate/?verbose=true',
        href : 'REDACTED'
      },
      method : 'GET',
      headers : {
        authorization : 'Basic dGVzdHVzZXI6cGFzc3dvcmQ='
      }
    };

    beforeEach(function () {

    });

    it('should handle non Json body and unmatched statusCode ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        statusCode : 999,
        body : body,
        headers : {
          'content-type' : 'text/html',
          'x-backside-transport' : 'FAIL FAIL',
          connection : 'close'
        },
        request : genericTranslateRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.translate(this.credentialsMock, trainedModelId, textToTranslate).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/translate?model_id=' + trainedModelId + '&text=Hello%20world');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(e.inserts.trainedModelId).to.eql(trainedModelId);
          expect(Object.keys(e.inserts).length).to.eql(4);
          done();
        })
    });

    it('should handle the wrong Json body and OK statusCode ', function (done) {
      var body = '{ "translations" : "3"}';
      var response = {
        statusCode : 200,
        body : body,
        headers : failedResponseHeader,
        request : genericTranslateRequest
      };
      this.requestMock.get.callsArgWith(1, null, response, body);
      this.lt.translate(this.credentialsMock, trainedModelId, textToTranslate).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse, serviceUrl + '/translate?model_id=' + trainedModelId + '&text=Hello%20world');
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(4);
          done();
        })
    });
  })


});
