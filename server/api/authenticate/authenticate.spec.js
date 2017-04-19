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

// core dependencies
var util = require('util');

// external dependencies
var async = require('async');
var bodyParser = require('body-parser');
var chai = require('chai');
var cookieParser = require('cookie-parser');
var express = require('express');
var HTTPStatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');
var session = require('express-session');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');
var BasicStrategy = require('passport-http').BasicStrategy,
  LocalStrategy = require('passport-local').Strategy;

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);


// dummy authenticate function
function authenticate (username, password, callback) {

  if (username === 'username' && password === 'password') {
    return callback(null, {
      username : username,
      password : password
    });
  }

  return callback(null, false, {
    'message' : 'Username and password not recognised.'
  });
}

describe('/server/api/authenticate', function () {

  var ENDPOINTBASE = '/api/authenticate';

  var MODIFIED_AUTH_LOCATION = '/api/authenticate/modified';

  this.timeout(5000);

  before(function () {

    this.originalAuthType = process.env.LT_AUTH_TYPE;

    this.lt = {
      id : 'test-id',
      url : 'https://test.com',
      username : 'username',
      password : 'password',
      version : 'v2',
      '@noCallThru' : true
    };

    this.cryptoMock = {
      encrypt : function (string) {
        return string + 'encryptedhonest'
      },
      decrypt : function (string) {
        return string.slice(0, string.length - 15);
      }
    };

    this.error = {
      error : 'test-generated',
      statusCode : HTTPStatus.INTERNAL_SERVER_ERROR
    };

  });

  after(function () {
    if (this.originalAuthType) {
      process.env.LT_AUTH_TYPE = this.originalAuthType;
    }
  });


  beforeEach(function () {

    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(session({secret : 'testing'}));

    this.passportLib = proxyquire('passport', {});

    // Dummy Passport Configuration
    this.passportLib.serializeUser(function serializeUser (user, callback) {
      callback(null, user);
    });

    this.passportLib.deserializeUser(function deserializeUser (user, callback) {
      callback(null, user);
    });

    this.passportLib.use(new LocalStrategy(authenticate));
    this.passportLib.use(new BasicStrategy(authenticate));
    this.app.use(this.passportLib.initialize());
    this.app.use(this.passportLib.session());

    this.s2sMock = {
      getCredentialsFromSession : sinon.stub(),
      getServiceKeys : sinon.spy(),
      getServiceAccessAuthEndpoint : sinon.stub()
    };

    this.ltCredentials = {};

    this.s2sMock.getCredentialsFromSession.callsArgWith(1, this.ltCredentials);
    this.s2sMock.getServiceAccessAuthEndpoint.returns('http://testserviceprovider.com');

    this.controllerOverrides = {
      'passport' : this.passportLib,
      '../../components/s2s' : this.s2sMock
    };

    this.controller = proxyquire('./authenticate.controller', this.controllerOverrides);

    this.appOverrides = {
      './authenticate.controller' : this.controller
    };

    this.app.use(ENDPOINTBASE, proxyquire('./index', this.appOverrides));

    var testMiddleware = function testMiddleware (req, res, next) {
      req.user = {};
      next();
    };

    this.app.use(MODIFIED_AUTH_LOCATION, testMiddleware, proxyquire('./index', this.appOverrides));
  });


  describe('GET /api/authenticate', function () {

    it('should respond with a 401 response if the user is not authenticated', function (done) {
      request(this.app)
        .get(ENDPOINTBASE)
        .expect(HTTPStatus.UNAUTHORIZED, done);
    });

    it('should respond with a 401 response if the session cookie is invalid', function (done) {
      request(this.app)
        .get(ENDPOINTBASE)
        .set('Cookie', ['connect.sid=s:AWWn3-T1GJ1N5fpXVh0OYTnbSVcEVeG5.7skWD6cJUPyNIyd/Tk+/+P7wK3L31Tys70Z3zDiKAbI'])
        .expect(HTTPStatus.UNAUTHORIZED, done);
    });

    it('should respond with a 200 response if the user is authenticated', function (done) {
      request(this.app)
        .get(MODIFIED_AUTH_LOCATION)
        .expect(HTTPStatus.OK, done);
    });
  });

  describe('POST /api/authenticate', function () {

    describe('bluemix mode', function () {

      before(function () {
        process.env.LT_AUTH_TYPE = 'bluemix';
      });

      it('should respond with a 404 since the endpoint is not registered', function (done) {
        request(this.app)
          .post(ENDPOINTBASE)
          .send({username : this.lt.username, password : this.lt.password})
          .expect(HTTPStatus.NOT_FOUND, done);
      });

    });


    describe('credentials', function () {

      before(function () {
        process.env.LT_AUTH_TYPE = 'credentials';
      });

      it('should respond with a 200 response if the user provides the correct credentials', function (done) {
        request(this.app)
          .post(ENDPOINTBASE)
          .send({username : this.lt.username, password : this.lt.password})
          .expect(HTTPStatus.OK)
          .end(function (err, res) {
            should.exist(res.headers['set-cookie'][0]);
            res.headers['set-cookie'][0].should.match(/^connect\.sid/);
            done(err);
          });
      });

      it('should respond with a 400 response if the user provides the incorrect credentials', function (done) {
        request(this.app)
          .post(ENDPOINTBASE)
          .send({username : this.lt.username, password : 'wrongpasswordfool'})
          .expect(HTTPStatus.BAD_REQUEST, done);
      });

      it('should respond with a 400 response if the user provides the credentials in header', function (done) {
        request(this.app)
          .post(ENDPOINTBASE)
          .auth(this.lt.username, this.lt.password)
          .expect(HTTPStatus.BAD_REQUEST, done);
      });

      it('should return error from passport strategy', function (done) {
        var passportStub = sinon.stub(this.passportLib, 'authenticate', function (strategy, callback) {
          return function (req, res, next) {
            callback({error : 'test-generated'});
          }
        });
        request(this.app)
          .post(ENDPOINTBASE)
          .auth(this.lt.username, this.lt.password)
          .expect(HTTPStatus.INTERNAL_SERVER_ERROR)
          .end(function (err, resp) {
            this.passportLib.authenticate.restore();
            done(err);
          }.bind(this));
      });

      it('should return error from request login', function (done) {
        var passportStub = sinon.stub(this.passportLib, 'authenticate', function (strategy, callback) {
          return function (req, res, next) {
            var loginStub = sinon.stub(req, 'logIn');
            loginStub.callsArgWith(1, {error : 'test-generated'});
            callback(null, {username : 'test-user'});
          }
        });
        request(this.app)
          .post(ENDPOINTBASE)
          .auth(this.lt.username, this.lt.password)
          .expect(HTTPStatus.INTERNAL_SERVER_ERROR)
          .end(function (err, resp) {
            this.passportLib.authenticate.restore();
            done(err);
          }.bind(this));
      });

    });
  });

  describe('POST /api/authenticate/logout', function (done) {

    it('should respond with a 400 if user not logged in', function (done) {
      var LOGOUT_LOCATION = ENDPOINTBASE + '/logout';
      request(this.app)
        .post(LOGOUT_LOCATION)
        .expect(HTTPStatus.BAD_REQUEST, done);
    });

    it('should respond with a 200 and log out user if already logged in', function (done) {
      var LOGOUT_LOCATION = MODIFIED_AUTH_LOCATION + '/logout';
      request(this.app)
        .post(LOGOUT_LOCATION)
        .expect(HTTPStatus.OK, done);
    });
  });

  describe('#BLUEMIX', function () {

    before(function () {

      process.env.LT_AUTH_TYPE = 'bluemix';

      this.bluemixapp = express();

      this.passportMock = {
        authenticate : sinon.stub()
      };

      this.bluemixMiddleware = function (req, res, next) {
        res.status(HTTPStatus.OK).send();
      };
      this.middlewareSpy = sinon.spy(this, 'bluemixMiddleware');
      this.passportMock.authenticate.returns(this.bluemixMiddleware);

      this.keyResponse = {};

      this.s2sMock = {
        getCredentialsFromSession : sinon.stub(),
        getServiceKeys : function (req, res, successRedirect, failureRedirect) {
          res.status(HTTPStatus.OK).send();
        },
        getServiceAccessAuthEndpoint : sinon.stub()
      };

      this.serviceKeysSpy = sinon.spy(this.s2sMock, 'getServiceKeys');

      this.ltCredentials = {};

      this.serviceProviderEndpoint = 'http://testserviceprovider.com';

      this.s2sMock.getCredentialsFromSession.callsArgWith(1, this.ltCredentials);
      this.s2sMock.getServiceAccessAuthEndpoint.returns(this.serviceProviderEndpoint);

      this.bluemixControllerOverrides = {
        'passport' : this.passportMock,
        '../../components/s2s' : this.s2sMock
      };

      this.bluemixController = proxyquire('./authenticate.controller', this.bluemixControllerOverrides);

      this.bluemixAppOverrides = {
        './authenticate.controller' : this.bluemixController
      };

      this.bindingState = uuid.v1();

      this.bluemixapp.use('/', function (req, res, next) {
        req.session = {
          bindingState : this.bindingState
        };
        next();
      }.bind(this));

      this.bluemixapp.use(ENDPOINTBASE, proxyquire('./index', this.bluemixAppOverrides));
    });

    beforeEach(function () {

      this.bluemixMiddleware = function (req, res, next) {
        res.status(HTTPStatus.OK).send();
      };
      this.middlewareSpy = sinon.spy(this, 'bluemixMiddleware');
      this.passportMock.authenticate.returns(this.bluemixMiddleware);

      this.passportMock.authenticate.reset();
      this.s2sMock.getCredentialsFromSession.reset();
      this.s2sMock.getServiceAccessAuthEndpoint.reset();
      this.serviceKeysSpy.reset();
    });


    describe('GET /api/authenticate/bluemix', function () {

      var BLUEMIX_ENDPOINT = ENDPOINTBASE + '/bluemix';

      it('should invoke OAuth2 flow', function (done) {

        var params = {
          successRedirect : '/success',
          failureRedirect : '/failure',
          serviceGuid : uuid.v1()
        };

        var invoked = false;
        var middleware = function (req, res, next) {
          invoked = true;
          should.exist(req.session);
          req.session.should.have.property('successRedirect', params.successRedirect);
          req.session.should.have.property('failureRedirect', params.failureRedirect);
          req.session.should.have.property('serviceGuid', params.serviceGuid);
          res.status(HTTPStatus.OK).send();
        }.bind(this);

        this.passportMock.authenticate.returns(middleware);

        request(this.bluemixapp)
          .get(BLUEMIX_ENDPOINT)
          .query({successRedirect : params.successRedirect})
          .query({failureRedirect : params.failureRedirect})
          .query({serviceGuid : params.serviceGuid})
          .expect(HTTPStatus.OK)
          .end(function (err, result) {
            this.passportMock.authenticate.should.have.been.calledWithExactly('bluemix', sinon.match({scope : 'openid'}));
            invoked.should.equal(true);
            done(err);
          }.bind(this));
      });

      it('should not store value on session if request attribute not present', function (done) {

        var params = {
          successRedirect : '/success',
          serviceGuid : uuid.v1()
        };

        var invoked = false;
        var middleware = function (req, res, next) {
          invoked = true;
          should.exist(req.session);
          req.session.should.have.property('successRedirect', params.successRedirect);
          req.session.should.not.have.property('failureRedirect');
          req.session.should.have.property('serviceGuid', params.serviceGuid);
          res.status(HTTPStatus.OK).send();
        }.bind(this);

        this.passportMock.authenticate.returns(middleware);

        request(this.bluemixapp)
          .get(BLUEMIX_ENDPOINT)
          .query({successRedirect : params.successRedirect})
          .query({failureRedirect : params.failureRedirect})
          .query({serviceGuid : params.serviceGuid})
          .expect(HTTPStatus.OK)
          .end(function (err, result) {
            this.passportMock.authenticate.should.have.been.calledWithExactly('bluemix', sinon.match({scope : 'openid'}));
            invoked.should.equal(true);
            done(err);
          }.bind(this));
      });

    });

    describe('GET /api/authenticate/bluemix/return', function () {

      var CALLBACK_ENDPOINT = ENDPOINTBASE + '/bluemix/return';

      it('should proceed with OAuth2 flow if service_code query param not present', function (done) {

        request(this.bluemixapp)
          .get(CALLBACK_ENDPOINT)
          .expect(HTTPStatus.OK)
          .end(function (err, result) {
            this.passportMock.authenticate.should.have.been.calledWithExactly('bluemix', sinon.match({
              successRedirect : this.serviceProviderEndpoint,
              failureRedirect : sinon.match.string
            }));
            this.bluemixMiddleware.should.have.been.called;
            this.s2sMock.getServiceKeys.should.not.have.been.called;
            done(err);
          }.bind(this));
      });

      //it('should invoke S2S flow when service_code query param is present', function (done) {
      //
      //  request(this.bluemixapp)
      //    .get(CALLBACK_ENDPOINT)
      //    .query({service_code : uuid.v1()})
      //    .query({state : this.bindingState})
      //    .expect(HTTPStatus.OK)
      //    .end(function (err, result) {
      //      this.passportMock.authenticate.should.not.have.been.called;
      //      this.bluemixMiddleware.should.not.have.been.called;
      //      this.s2sMock.getServiceKeys.should.have.been.called;
      //      done(err);
      //    }.bind(this));
      //});

      it('should return 403 if unable to verify state', function (done) {

        request(this.bluemixapp)
          .get(CALLBACK_ENDPOINT)
          .query({service_code : uuid.v1()})
          .query({state : uuid.v1()})
          .expect(HTTPStatus.FORBIDDEN)
          .end(function (err, result) {
            this.passportMock.authenticate.should.not.have.been.called;
            this.bluemixMiddleware.should.not.have.been.called;
            this.s2sMock.getServiceKeys.should.not.have.been.called;
            done(err);
          }.bind(this));
      });
    });
  });

});
