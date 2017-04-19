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
var ltErrors = require('../ltErrors');
var env = require('../../config/environment');
var url = env.endpoints.language_translator + '/v2';

var LTServiceError = require('../common').LTServiceError;

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);

var trainedModelId = 'DummyTrainedModelId';
var dummyOriginatingMethod = 'testMethod';

var genericRequest = {
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
    pathname : 'myurl',
    path : 'myurl',
    href : 'REDACTED'
  },
  method : 'GET',
  headers : {
    authorization : 'Basic dGVzdHVzZXI6cGFzc3dvcmQ='
  }
};

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
  'x-dp-watson-tran-id' : 'sdgd-91589288'
};

describe('/server/components/lt/index', function () {

  before(function() {
    this.originalExportAllForTesting = process.env.EXPORT_ALL_FOR_TESTING;
    process.env.EXPORT_ALL_FOR_TESTING = true;

  });

  after(function() {
    if (this.originalExportAllForTesting) {
      process.env.EXPORT_ALL_FOR_TESTING = this.originalExportAllForTesting;
    }
  });

  var checkError = function (e, errorCode) {
    expect(e.errorCode).to.exist;
    expect(LTServiceError.prototype.isPrototypeOf(e)).to.be.true;
    e.errorCode.should.equal(errorCode);
    expect(e.message).to.exist;
    expect(e.inserts.trainedModelId).to.eql(trainedModelId);
    expect(e.inserts.url).to.eql('myurl');
  };

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

  describe('#handleException()', function () {

    beforeEach(function () {

    });

    it('should handle unknown immediate error ', function (done) {
      var unknownError = {
        message : 'No idea what has happened',
        stack : 'MyStack Trace',
        code : 'EUNKNOWN',
        errno : 'EUNKNOWN',
        syscall : 'somewhere'
      };
      var errorInserts = {trainedModelId : trainedModelId, response : unknownError, url : 'myurl'};
      try {
        this.lt.handleException(unknownError, errorInserts, dummyOriginatingMethod);
        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.unKnownLTError);
        expect(e.inserts.response).to.eql(unknownError);
        expect(Object.keys(e.inserts).length).to.eql(3);
        done()
      }
    });

    it('should handle unknown immediate error which has no code', function (done) {
      var unknownError = {
        message : 'No idea what has happened',
        syscall : 'somewhere'
      };
      var errorInserts = {trainedModelId : trainedModelId, response : unknownError, url : 'myurl'};
      try {
        this.lt.handleException(unknownError, errorInserts, dummyOriginatingMethod);
        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.unKnownLTError);
        expect(e.inserts.response).to.eql(unknownError);
        expect(Object.keys(e.inserts).length).to.eql(3);
        done()
      }
    });

    it('should handle bad address problem ', function (done) {
      var badHostNameError = {
        message : 'getaddrinfo ENOTFOUND',
        stack : 'Error: getaddrinfo ENOTFOUND\n    at errnoException (dns.js:37:11)\n    at Object.onanswer [as oncomplete] (dns.js:124:16)',
        code : 'ENOTFOUND',
        errno : 'ENOTFOUND',
        syscall : 'getaddrinfo'
      };
      var errorInserts = {trainedModelId : trainedModelId, response : badHostNameError, url : 'myurl'};
      try {
        this.lt.handleException(badHostNameError, errorInserts, dummyOriginatingMethod);

        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.hostNotFound);
        expect(e.inserts.response).to.eql(badHostNameError);
        expect(Object.keys(e.inserts).length).to.eql(3);
        done()
      }
    });

    it('should handle socket problem ', function (done) {
      var socketError = {
        message : 'socket hang up',
        stack : 'Error: socket hang up\n    at SecurePair.error (tls.js:1011:23)\n    at EncryptedStream.CryptoStream._done (tls.js:703:22)\n    at CleartextStream.read [as _read] (tls.js:499:24)\n    at CleartextStream.Readable.read (_stream_readable.js:341:10)\n    at EncryptedStream.onCryptoStreamFinish (tls.js:304:47)\n    at EncryptedStream.g (events.js:180:16)\n    at EncryptedStream.emit (events.js:117:20)\n    at finishMaybe (_stream_writable.js:360:12)\n    at endWritable (_stream_writable.js:367:3)\n    at EncryptedStream.Writable.end (_stream_writable.js:345:5)\n    at EncryptedStream.CryptoStream.end (tls.js:641:31)\n    at Socket.onend (_stream_readable.js:502:10)\n    at Socket.g (events.js:180:16)\n    at Socket.emit (events.js:117:20)\n    at _stream_readable.js:944:16\n    at process._tickCallback (node.js:448:13)',
        code : 'ECONNRESET'
      };
      var errorInserts = {trainedModelId : trainedModelId, response : socketError, url : 'myurl'};
      try {
        this.lt.handleException(socketError, errorInserts, dummyOriginatingMethod);

        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.connectionReset);
        expect(e.inserts.response).to.eql(socketError);
        expect(Object.keys(e.inserts).length).to.eql(3);
        done()
      }
    });
  });

  describe('#handleProblemResponse()', function () {

    beforeEach(function () {

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
        request : genericRequest
      };

      var errorInserts = {trainedModelId : trainedModelId, response : response, responseBody : body, url : 'myurl'};
      try {
        this.lt.handleProblemResponse(response, errorInserts, dummyOriginatingMethod);
        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.badLTResponse);
        expect(e.inserts.responseBody).to.eql(body);
        expect(e.inserts.response).to.eql(response);
        expect(Object.keys(e.inserts).length).to.eql(4);
        done();
      }
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
        request : genericRequest
      };
      var errorInserts = {trainedModelId : trainedModelId, response : response, responseBody : body, url : 'myurl'};
      try {
        this.lt.handleProblemResponse(response, errorInserts, dummyOriginatingMethod);
        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.badLTResponse);
        expect(e.inserts.responseBody).to.eql(body);
        expect(e.inserts.response).to.eql(response);
        expect(Object.keys(e.inserts).length).to.eql(4);
        done();
      }
    });

    it('should handle invalid credentials ', function (done) {
      var body = '<HTML><HEAD><meta content=\"text/html; charset=UTF-8\" http-equiv=\"Content-Type\"><TITLE>Watson Error</TITLE></HEAD><BODY><HR><p>Invalid access to resource - /language-translator/api/v2/models</p><p>User access not Authorized.</p><p>Gateway Error Code : ERCD250-LDAP-DN-AUTHERR</p><p>Unable to communicate with Watson.</p><p>Request URL : /language-translator/api/v2/models</p><p>Error Id :  csf_platform_prod_dp02-1818375301</p><p>Date-Time : 2015-11-19T08:15:07-05:00</p></BODY></HTML>';
      var response = {
        statusCode : 401,
        body : body,
        headers : {
          'content-type' : 'text/html'
        },
        request : genericRequest
      };
      var errorInserts = {trainedModelId : trainedModelId, response : response, responseBody : body, url : 'myurl'};
      try {
        this.lt.handleProblemResponse(response, errorInserts, dummyOriginatingMethod);
        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.connectionUnauthorized);
        expect(e.inserts.responseBody).to.eql(body);
        expect(e.inserts.response).to.eql(response);
        expect(Object.keys(e.inserts).length).to.eql(4);
        done()
      }
    });

    it('should catch error code and error message returned from service instance due to trained model id not found ', function (done) {
      var body = '{"error_code":404,"error_message":"there are no models matching the query"}';
      var response = {
        statusCode : 404,
        body : body,
        headers : failedResponseHeader,
        request : genericRequest
      };
      var errorInserts = {trainedModelId : trainedModelId, response : response, responseBody : body, url : 'myurl'};
      try {
        this.lt.handleProblemResponse(response, errorInserts, dummyOriginatingMethod);

        should.fail('Shouldn\'t succeed, error should be raised');
        done();
      }
      catch (e) {
        checkError(e, ltErrors.trainedModelNotFound);
        expect(e.inserts.responseBody).to.eql(body);
        expect(e.inserts.response).to.eql(response);
        expect(Object.keys(e.inserts).length).to.eql(4);
        done()
      }
    });
  })

  describe('Non exported functions', function () {
    before(function () {
      this.originalExportAllForTesting = process.env.EXPORT_ALL_FOR_TESTING;
      this.originalNodeEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      delete process.env.EXPORT_ALL_FOR_TESTING;
    });

    after(function () {
      if (this.originalExportAllForTesting) {
        process.env.EXPORT_ALL_FOR_TESTING = this.originalExportAllForTesting;
      }
      if (this.originalNodeEnv) {
        process.env.NODE_ENV = this.originalNodeEnv;
      }
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

    it('should not export handleProblemResponse ', function () {
      expect(typeof this.lt.handleProblemResponse === 'undefined' ).to.be.true;
    })

  })

});
