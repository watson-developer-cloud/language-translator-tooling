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
/*eslint func-names: 0, max-nested-callbacks: [2,10], max-statements: [2,15], handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var express = require('express');
var HTTPStatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var request = require('supertest');

var ltErrors = require('../components/ltErrors');

// test dependencies
var mocks = require('../test/mocks');

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/rest', function () {

  function mockRestLib () {
    this.passportMock = {
      authenticate : sinon.stub()
    };
    this.authenticateSpy = sinon.stub();
    this.authenticateSpy.callsArg(2);
    this.passportMock.authenticate.returns(this.authenticateSpy);
    this.overrides = {
      'passport' : this.passportMock,
      './log' : new mocks.LogMock()
    };
    return proxyquire('./rest', this.overrides);
  }


  before(function () {
    this.originalAuthType = process.env.LT_AUTH_TYPE;
  });

  after(function () {
    if (this.originalAuthType) {
      process.env.LT_AUTH_TYPE = this.originalAuthType;
    }
  });

  describe('ensureAuthenticated via credentials', function () {

    beforeEach(function () {
      process.env.LT_AUTH_TYPE = 'credentials';
      this.rest = mockRestLib.call(this);
      this.reqMock = {
        isAuthenticated : sinon.stub()
      };
      this.reqMock.isAuthenticated.returns(true);
      this.resSpy = sinon.spy();
    });

    it('should pass through authenticated request', function (done) {
      this.rest.ensureAuthenticated(this.reqMock, this.resSpy, function () {
        this.reqMock.isAuthenticated.should.have.been.called;
        this.passportMock.authenticate.should.not.have.been.called;
        done();
      }.bind(this));
    });

    it('should throw an Error on unauthenticated request', function (done) {
      this.reqMock.isAuthenticated.returns(false);

      this.rest.ensureAuthenticated(this.reqMock, this.resMock, function (e) {
        this.reqMock.isAuthenticated.should.have.been.called;
        e.should.have.property('message', 'User is not authorized');
        e.should.have.property('errorCode', ltErrors.UserNotAuthorized);
        e.should.have.property('httpStatusCode', HTTPStatus.FORBIDDEN);
        done();
      }.bind(this));
    });

  });

  describe('ensureAuthenticated via bluemix', function () {

    beforeEach(function () {
      process.env.LT_AUTH_TYPE = 'bluemix';
      this.rest = mockRestLib.call(this);
      this.reqMock = {
        isAuthenticated : sinon.stub()
      };
      this.reqMock.isAuthenticated.returns(true);
      this.resSpy = sinon.spy();
    });

    it('should pass through authenticated request', function (done) {
      this.rest.ensureAuthenticated(this.reqMock, this.resSpy, function () {
        this.reqMock.isAuthenticated.should.have.been.called;
        this.passportMock.authenticate.should.not.have.been.called;
        done();
      }.bind(this));
    });

    it('should call passport on unauthenticated request', function (done) {
      this.reqMock.isAuthenticated.returns(false);
      this.rest.ensureAuthenticated(this.reqMock, this.resSpy, function () {
        this.reqMock.isAuthenticated.should.have.been.called;
        this.passportMock.authenticate.should.have.been.calledWith('bluemix', sinon.match({
          scope : 'openid',
          session : false
        }));
        this.authenticateSpy.should.have.been.calledWith(this.reqMock, this.resSpy, sinon.match.func);
        done();
      }.bind(this));
    });

  });

  describe('#ensureAuthorizedForTenant', function () {

    before(function () {

      process.env.LT_AUTH_TYPE = 'bluemix';
      this.rest = mockRestLib.call(this);
      this.tenant = 'UNIT_TESTS';

      this.DEFAULT_ROOT = '/default';
      this.ALIASED_ROOT = '/aliased';

      this.DEFAULT_PATH = '/withdefault';
      this.ALIASED_PATH = '/withalias';

      this.DEFAULT_ENDPOINT = this.DEFAULT_ROOT + '/:tenantId' + this.DEFAULT_PATH;
      this.ALIASED_ENDPOINT = this.ALIASED_ROOT + '/:tenant' + this.ALIASED_PATH;

      this.INVALID_ENDPOINT = '/invalid';

      this.UNPROTECTED_ENDPOINT = '/noauth';

      this.user = {
        username : 'bluemixuser@test.com'
      };

      this.sessionData = {
        serviceGuid : this.tenant,
        serviceUrl : 'http://unittest.com',
        serviceUsername : 'ltuser',
        servicePassword : 'ltpass'
      };

      this.authMock = function ensureAuthorizedForTenant (req, res, next) {
        req.user = this.user;
        req.session = this.sessionData;
        next();
      }.bind(this);

      this.app = express();
      this.app.use(this.DEFAULT_ENDPOINT, this.authMock.bind(this), this.rest.ensureAuthorizedForTenant());
      this.app.use(this.ALIASED_ENDPOINT, this.authMock.bind(this), this.rest.ensureAuthorizedForTenant('tenant'));
      this.app.use(this.INVALID_ENDPOINT, this.authMock.bind(this), this.rest.ensureAuthorizedForTenant('tenant'));
      this.app.use(this.UNPROTECTED_ENDPOINT, this.rest.ensureAuthorizedForTenant('tenant'));
      this.app.get(this.DEFAULT_ENDPOINT, function (req, res, next) {
        res.json({ok : true});
      }.bind(this));
      this.app.get(this.ALIASED_ENDPOINT, function (req, res, next) {
        res.json({ok : true});
      }.bind(this));
      this.app.get(this.INVALID_ENDPOINT, function (req, res, next) {
        res.json({ok : true});
      }.bind(this));
      this.app.use(function returnError (err, req, res, next) {
        if (err) {
          res.status(err.httpStatusCode).json(err);
        }
      });
    });

    describe('invalid', function () {

      it('should return 500 when no tenant parameter found', function (done) {
        request(this.app)
          .get(this.INVALID_ENDPOINT)
          .expect(HTTPStatus.INTERNAL_SERVER_ERROR)
          .end(function (err, resp) {
            resp.should.have.deep.property('body.httpStatusCode', HTTPStatus.INTERNAL_SERVER_ERROR);
            resp.should.have.deep.property('body.errorCode', ltErrors.NoTenantSpecified);
            done(err);
          }.bind(this));
      });

      it('should return 401 if req.user not found', function (done) {
        request(this.app)
          .get(this.UNPROTECTED_ENDPOINT)
          .expect(HTTPStatus.UNAUTHORIZED)
          .end(function (err, resp) {
            resp.should.have.deep.property('body.httpStatusCode', HTTPStatus.UNAUTHORIZED);
            resp.should.have.deep.property('body.errorCode', ltErrors.UserNotAuthenticated);
            done(err);
          }.bind(this));
      });

    });

    describe('default', function () {

      before(function () {
        this.DEFAULT_LOCATION = this.DEFAULT_ROOT + '/' + this.tenant + this.DEFAULT_PATH;
        this.DEFAULT_ERROR = this.DEFAULT_ROOT + '/error' + this.DEFAULT_PATH;
      });

      it('should succeed in authorizing tenant request', function (done) {
        request(this.app)
          .get(this.DEFAULT_LOCATION)
          .expect(HTTPStatus.OK, done);
      });

      it('should return 403 when tenant requested does not match authentication', function (done) {
        request(this.app)
          .get(this.DEFAULT_ERROR)
          .expect(HTTPStatus.FORBIDDEN)
          .end(function (err, resp) {
            resp.should.have.deep.property('body.httpStatusCode', HTTPStatus.FORBIDDEN);
            resp.should.have.deep.property('body.errorCode', ltErrors.UserNotAuthorized);
            done(err);
          }.bind(this));
      });
    });

    describe('alias', function () {

      before(function () {
        this.ALIASED_LOCATION = this.ALIASED_ROOT + '/' + this.tenant + this.ALIASED_PATH;
        this.ALIASED_ERROR = this.ALIASED_ROOT + '/error' + this.ALIASED_PATH;
      });

      it('should succeed in authorizing tenant request', function (done) {
        request(this.app)
          .get(this.ALIASED_LOCATION)
          .expect(HTTPStatus.OK, done);
      });

      it('should return 403 when tenant requested does not match authentication', function (done) {
        request(this.app)
          .get(this.ALIASED_ERROR)
          .expect(HTTPStatus.FORBIDDEN)
          .end(function (err, resp) {
            resp.should.have.deep.property('body.httpStatusCode', HTTPStatus.FORBIDDEN);
            resp.should.have.deep.property('body.errorCode', ltErrors.UserNotAuthorized);
            done(err);
          }.bind(this));
      });

    });

  });


});
