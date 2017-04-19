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
var session = require('express-session');
var HTTPStatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

// test dependencies
var mocks = require('../test/mocks')

var should = chai.should();
chai.use(sinonChai);


describe('/server/config/passport', function () {

  before(function () {
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
        return string.slice(0,string.length-15);
      }
    };

  });

  describe('de/serializeUser', function () {

    /*
     * AJS - The structure of the unit tests in this describe block are
     * somewhat hackey.  I could not see a clean/easy way to test the
     * error conditions in the functions passed to de/serializeUser.
     * Therefore, I use spys to get a reference to those functions and
     * run them directly.
     */
    beforeEach(function () {

      this.passportMock = {
        serializeUser : sinon.spy(),
        deserializeUser : sinon.spy(),
        use : sinon.spy(),
        initialize : sinon.spy(),
        session : sinon.spy()
      };

      this.appMock = {
        use : sinon.spy()
      };

      this.requestMock = sinon.stub();
      this.requestMock.callsArgWith(1, null, {statusCode : 200})

      proxyquire('./passport', {
        'passport' : this.passportMock,
        '../components/crypto' : this.cryptoMock,
        'request' : this.requestMock
      })(this.appMock);

      this.serializeFn = this.passportMock.serializeUser.lastCall.args[0];
      this.serializeFn.should.be.a('function');

      this.deserializeFn = this.passportMock.deserializeUser.lastCall.args[0];
      this.deserializeFn.should.be.a('function');

    });

    it('should serialize user', function () {
      var callbackSpy = sinon.spy();
      var user = {username : 'test', password : 'password'};

      this.serializeFn(user, callbackSpy);
      callbackSpy.should.have.been.calledWith(null, {username : user.username, password : 'passwordencryptedhonest'});
    });

    it('should error if user not defined during serialization', function () {
      var callbackSpy = sinon.spy();

      this.serializeFn(null, callbackSpy);
      callbackSpy.should.have.been.calledWith(sinon.match.instanceOf(Error));
    });


    it('should deserialize valid user', function () {
      var callbackSpy = sinon.spy();
      var encryptedUser = {username : 'test', password : 'passwordencryptedhonest'}

      this.deserializeFn(encryptedUser, callbackSpy);
      callbackSpy.should.have.been.calledWith(null, {username : 'test', password : 'password'});
    });

    it('should error if unknown user found', function () {
      var callbackSpy = sinon.spy();

      this.deserializeFn(null, callbackSpy);
      callbackSpy.should.have.been.calledWith(sinon.match.instanceOf(Error));
    });

  });

  describe('strategies', function () {

    describe('credential strategies', function () {

      before(function () {

        this.originalEnv = process.env.LT_AUTH_TYPE;
        process.env.LT_AUTH_TYPE = 'credentials';

        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(session({secret : 'testing'}));

        this.passportLib = proxyquire('passport', {});

        var requestMock = sinon.stub();
        requestMock.onCall(0).callsArgWithAsync(1,null,{statusCode : 200, headers : {'x-watson-userinfo': 'bluemix-instance-id=serviceGuidtestid'}});
        requestMock.onCall(1).callsArgWithAsync(1,null,{statusCode : 401});
        requestMock.onCall(2).callsArgWithAsync(1,null,{statusCode : 200, headers : {'x-watson-userinfo': 'bluemix-instance-id=serviceGuidtestid'}});
        requestMock.onCall(3).callsArgWithAsync(1,null,{statusCode : 401});


        this.overrides = {
          'passport' : this.passportLib,
          '../components/crypto' : this.cryptoMock,
          'request' : requestMock
        };

        proxyquire('./passport', this.overrides)(this.app);

      });


      after(function () {
        if(this.originalEnv) {
          process.env.LT_AUTH_TYPE = this.originalEnv;
        }
      });

      describe('local strategy', function () {

        before(function () {
          this.app.post('/local', this.passportLib.authenticate('local'), function (req, res) {
            res.status(HTTPStatus.OK).json(req.user);
          });
        });

        it('should succeed with local strategy authentication', function (done) {
          request(this.app)
            .post('/local')
            .send({
              username : this.lt.username,
              password : this.lt.password
            })
            .expect(HTTPStatus.OK)
            .end(function (err, resp) {
              resp.should.have.deep.property('body.username', this.lt.username);
              done(err);
            }.bind(this));
        });

        it('should fail on invalid credentials', function (done) {
          request(this.app)
            .post('/local')
            .send({
              username : this.lt.username,
              password : 'notvalid'
            })
            .expect(HTTPStatus.UNAUTHORIZED, done);
        });

      });

      describe('basic strategy', function () {

        before(function () {
          this.app.post('/basic', this.passportLib.authenticate('basic'), function (req, res) {
            res.status(HTTPStatus.OK).json(req.user);
          });
        });

        it('should succeed with basic strategy authentication', function (done) {
          request(this.app)
            .post('/basic')
            .auth(this.lt.username, this.lt.password)
            .expect(HTTPStatus.OK)
            .end(function (err, resp) {
              resp.should.have.deep.property('body.username', this.lt.username);
              done(err);
            }.bind(this));
        });

        it('should fail on invalid credentials', function (done) {
          request(this.app)
            .post('/basic')
            .auth(this.lt.username, 'invalid')
            .expect(HTTPStatus.UNAUTHORIZED, done);
        });

      });

    });

    describe('bluemix strategy', function () {

      before(function () {

        this.originalEnv = process.env.LT_AUTH_TYPE;
        process.env.LT_AUTH_TYPE = 'bluemix';

        var profile = this.profile = {
          id : uuid.v1(),
          username : 'testuser@bluemix.net'
        };

        var accessToken = this.accessToken = uuid.v1();
        var refreshToken = this.refreshToken = uuid.v1();

        // Admittedly this initialization is overly complicated but its helpful
        // in understanding how Passport works under the covers...
        exports.Strategy = function(options, verify) {
          this.name = 'bluemix';

          this._verify = verify;

          var self = this;

          this.authenticate = function (req, options) {
            self._verify(req, accessToken, refreshToken, profile, function verified(err, user, info) {
              if (err) { return this.error(err); }
              if (!user) { return this.fail(info); }
              this.success(user, info);
            }.bind(this));
          };
        };
        util.inherits(exports.Strategy, require('passport').Strategy);

        this.strategySpy = sinon.spy(exports, 'Strategy');
        this.strategy = exports.Strategy;

      });

      after(function () {
        if(this.originalEnv) {
          process.env.LT_AUTH_TYPE = this.originalEnv;
        }
      });

      describe('bluemix oauth2 strategy', function () {

        beforeEach(function() {

          this.serviceGuid = uuid.v1();

          this.expressMock = {
            use : sinon.spy()
          };

          this.passportLib = proxyquire('passport', {});
          this.useSpy = sinon.spy(this.passportLib, 'use');

          this.req = {
            session : {
              serviceGuid : this.serviceGuid
            },
            logIn : sinon.spy()
          };

          this.res = {
            end : sinon.spy()
          };

          this.strategySpy.reset();

          this.overrides = {
            'passport' : this.passportLib,
            'ibmwatson-passport-bluemix' : this.strategy,
            '../components/crypto' : this.cryptoMock
          };

          proxyquire('./passport', this.overrides)(this.expressMock);

        });

        it('should succeed with bluemix strategy authentication', function () {
          this.passportLib.authenticate('bluemix')(this.req, this.res, sinon.spy());
          this.strategySpy.should.have.been.called;
          this.req.logIn.should.have.been.called;

          this.req.session.should.have.property('serviceGuid', this.serviceGuid);
          this.req.session.should.have.property('accessToken', this.accessToken);
          this.req.session.should.have.property('refreshToken', this.refreshToken);

        });

        // serviceGuid is really a requirement of S2S, but S2S is so tightly coupled with
        // OAuth2 in the Tooling login its hard to keep them separated.  While we would
        // not expect this path to be executed in production, from a purely OAuth2 view,
        // there is no reason why this shouldn't work.
        it('should handle fallback case where serviceGuid not defined', function () {
          delete this.req.session.serviceGuid;

          this.passportLib.authenticate('bluemix')(this.req, this.res, sinon.spy());
          this.strategySpy.should.have.been.called;
          this.req.logIn.should.have.been.called;

          this.req.session.should.not.have.property('serviceGuid');

          this.req.session.should.have.property('accessToken', this.accessToken);
          this.req.session.should.have.property('refreshToken', this.refreshToken);

        });

        it('should not have registered dev-only strategies', function () {

          var BasicStrategy = require('passport-http').BasicStrategy;
          var LocalStrategy = require('passport-local').Strategy;

          this.useSpy.should.have.been.calledWith(sinon.match.instanceOf(this.strategy));
          this.useSpy.should.not.have.been.calledWith(sinon.match.instanceOf(BasicStrategy), sinon.match.func);
          this.useSpy.should.not.have.been.calledWith(sinon.match.instanceOf(LocalStrategy), sinon.match.func);
        });

      });

    });

  });

});
