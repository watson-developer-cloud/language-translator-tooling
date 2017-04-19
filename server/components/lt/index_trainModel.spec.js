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
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var PassThrough = require('stream').PassThrough;
var ltErrors = require('../ltErrors');
var env = require('../../config/environment');
var url = env.endpoints.language_translator + '/v2';

var LTServiceError = require('../common').LTServiceError;

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);

var modelName = 'DummyModelName';
var baseModelId = 'en-us-dummy';

var genericTrainRequest = {
  uri : {
    protocol : 'https:',
    slashes : true,
    auth : 'REDACTED',
    host : 'gateway.watsonplatform.net',
    port : 443,
    hostname : 'gateway.watsonplatform.net',
    hash : null,
    search : null,
    query : null,
    pathname : '/language-translator/api/v2/models',
    path : '/language-translator/api/v2/models',
    href : 'REDACTED'
  },
  method : 'POST',
  headers : {
    'Content-Type' : 'multipart/form-data; boundary=---######',
    authorization : 'Basic fshdfhsdhfsdfhsh'
  }
};

var failedTrainingResponseHeader = {
  'x-backside-transport' : 'FAIL FAIL',
  connection : 'close',
  'transfer-encoding' : 'chunked',
  server : 'Apache-Coyote/1.1',
  date : 'Wed, 18 Nov 2015 15:17:28 GMT',
  'x-service-api-version' : '2.0-SNAPSHOT',
  'content-disposition' : 'inline',
  pragma : 'no-cache',
  'x-zuul' : 'zuul',
  'x-zuul-instance' : 'unknown',
  'x-zuul-filter-executions' : 'Static[SUCCESS][0ms], RouteLanguage[SUCCESS][0ms], FinalPrepareRequest[SUCCESS][0ms], PrePayloadLog[SUCCESS][1ms], ForwardLanguage[SUCCESS][1103ms], SetResponse[SUCCESS][1ms]',
  'x-originating-url' : 'http://gateway-s.watsonplatform.net/language-translator/api/v2/models',
  'x-netflix-error-cause' : 'Error from Origin',
  'content-type' : 'application/json;charset=utf-8',
  'set-cookie' : ['Watson-DPAT=REDACTED; path=/language-translator/api; secure; HttpOnly'],
  'x-client-ip' : 'REDACTED',
  'x-global-transaction-id' : '91589288',
  'x-dp-watson-tran-id' : 'sdgd-91589288'
};

describe('/server/components/lt/index', function () {

  var checkError = function (e, errorCode) {
    expect(LTServiceError.prototype.isPrototypeOf(e)).to.be.true;
    e.errorCode.should.equal(errorCode);
    expect(e.message).to.exist;
    expect(e.httpStatusCode).to.exist;
    expect(e.inserts.modelName).to.eql(modelName);
    expect(e.inserts.baseModelId).to.eql(baseModelId);
    expect(e.inserts.url).to.eql(url + '/models');
    expect(Object.keys(e).length).to.eql(5);
  };

  before(function () {

  });

  beforeEach(function () {
    this.logMock = new mocks.LogMock();
    this.requestMock = new mocks.RequestMock();
    this.multipartStreamMock = new mocks.MultipartStreamMock();
    this.credentialsMock = mocks.credentialsMock;
    // local dependencies
    this.lt = proxyquire('./index', {
      'request' : this.requestMock,
      './duplicateStreamNameMultipartStream' : this.multipartStreamMock,
      '../../config/log' : this.logMock
    });
  });

  describe('#trainModel()', function () {

    beforeEach(function () {
      this.file1Stream_uuid = 'myUUID';
      this.file1Stream = new PassThrough();
      this.file1Stream.write('I am the contents of glossary file with uuid ' + this.file1Stream_uuid);
      this.file1Stream.end();
      this.files = [{
        file_name : 'file1.tmx',
        uuid : this.file1Stream_uuid,
        last_modified : '2015-10-26T21:26:44.743Z',
        training_file_option : 'forced_glossary',
        stream : this.file1Stream
      }];
    });

    it('should handle unknown immediate error ', function (done) {
      var unknownError = {
        message : 'No idea what has happened',
        stack : 'MyStack Trace',
        code : 'EUNKNOWN',
        errno : 'EUNKNOWN',
        syscall : 'somewhere'
      };
      this.requestMock.post.callsArgWith(1, unknownError, 'response', 'body');

      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          expect(e.inserts.response).to.eql(unknownError);
          expect(Object.keys(e.inserts).length).to.eql(4);
          checkError(e, ltErrors.unKnownLTError);
          done()
        })
    });

    it('should handle non Json body and unknown error ', function (done) {
      var body = '<HTML><HEAD><BODY></BODY></HTML>';
      var response = {
        body : body,
        headers : {
          'content-type' : 'text/html',
          'x-backside-transport' : 'FAIL FAIL',
          connection : 'close'
        },
        request : genericTrainRequest
      };

      this.requestMock.post.callsArgWith(1, null, response, body);

      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse);
          expect(Object.keys(e.inserts).length).to.eql(5);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          done();
        })
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
        request : genericTrainRequest
      };

      this.requestMock.post.callsArgWith(1, null, response, body);

      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badLTResponse);
          expect(Object.keys(e.inserts).length).to.eql(5);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          done();
        })
    });

    it('should handle invalid credentials ', function (done) {
      var body = '<HTML><HEAD><meta content=\"text/html; charset=UTF-8\" http-equiv=\"Content-Type\"><TITLE>Watson Error</TITLE></HEAD><BODY><HR><p>Invalid access to resource - /language-translator/api/v2/models</p><p>User access not Authorized.</p><p>Gateway Error Code : ERCD250-LDAP-DN-AUTHERR</p><p>Unable to communicate with Watson.</p><p>Request URL : /language-translator/api/v2/models</p><p>Error Id :  csf_platform_prod_dp02-1818375301</p><p>Date-Time : 2015-11-19T08:15:07-05:00</p></BODY></HTML>';
      var response = {
        statusCode : 401,
        body : body,
        headers : {
          'content-type' : 'text/html'
        },
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.connectionUnauthorized);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(5);
          done()
        })
    });

    it('should catch error code and error message returned from service instance ', function (done) {
      var body = '{\"error_code\":999,\"error_message\":\"my error message\"}';
      var response = {
        statusCode : 404,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.unknownTrainingErrorMessage);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

    it('should parse glossary customization error ', function (done) {
      var body = '{\"error_code\":404,\"error_message\":\"service en-fr is only enabled for glossary customization\"}';
      var response = {
        statusCode : 404,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.glossaryCustomizationUnavailable);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

    it('should parse bad url error ', function (done) {
      var body = '{\"error_code\":400,\"error_message\":\"unacceptable URL pattern\"}';
      var response = {
        statusCode : 400,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badUrl);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

    it('should produce an error for bad base model id', function (done) {
      var body = '{"error_code":404,"error_message":"base_model_id value is not configured"}';
      var response = {
        statusCode : 400,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badBaseModelId);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

    it('should produce an error for bad model name', function (done) {
      var body = '{"error_code":400,"error_message":"name value has to be alphanumeric (matching [-_0-9A-Za-z \']{0,32})"}';
      var response = {
        statusCode : 400,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badModelName);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

    it('should produce an error for bad training file type', function (done) {
      var body = '{"error_code":400,"error_message":"unknown tag (dodgytype_ct) in the request unknown tag (dodgytype) in the request unknown tag (dodgytype_ctdis) in the request unknown tag (dodgytype_fn) in the request at least one of forced_glossary,advisory_glossary,parallel_corpus or monolingual_corpus has to be specified"}';
      var response = {
        statusCode : 400,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.badTrainingFileType);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

    it('should produce an error for reaching maxmium customizations for a base model', function (done) {
      var body = '{"error_code":400,"error_message":"number of allowed profiles per service (=10) exceeded"}';
      var response = {
        statusCode : 400,
        body : body,
        headers : failedTrainingResponseHeader,
        request : genericTrainRequest
      };
      this.requestMock.post.callsArgWith(1, null, response, body);
      this.lt.trainModel(this.credentialsMock, baseModelId, modelName, this.files).then(function () {
          should.fail('Shouldn\'t succeed, error should be raised');
          done();
        })
        .catch(function (e) {
          checkError(e, ltErrors.maxModelCustomizationsReached);
          expect(e.inserts.error_code).to.eql(JSON.parse(body).error_code);
          expect(e.inserts.error_message).to.eql(JSON.parse(body).error_message);
          expect(e.inserts.responseBody).to.eql(body);
          expect(e.inserts.response).to.eql(response);
          expect(Object.keys(e.inserts).length).to.eql(7);
          done()
        })
    });

  })

});

//Not immediate errors:
//TEST for file in wrong format
//Test for file wrong length too long too small
