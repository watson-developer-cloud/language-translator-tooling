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
var chai = require('chai');
var express = require('express');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// test dependencies
var mocks = require('../test/mocks');

var should = chai.should();
chai.use(sinonChai);

/*
 * AJS - Admittedly this unit test is ridiculously complex but
 * given that the configuration of express is vital part of a
 * well-functioning app (and simple changes in config can have
 * profound effects), I wanted to be very explicit in testing
 * this module
 */
describe('/server/config/express', function () {

  beforeEach(function () {
    this.expressMock = {
      static : sinon.stub()
    };
    this.staticSpy = sinon.spy();
    this.expressMock.static.returns(this.staticSpy);

    this.faviconMock = sinon.stub();
    this.faviconSpy = sinon.spy();
    this.faviconMock.returns(this.faviconSpy);

    this.morganMock = sinon.stub();
    this.morganSpy = sinon.spy();
    this.morganMock.returns(this.morganSpy);

    this.compressionMock = sinon.stub();
    this.compressionSpy = sinon.spy();
    this.compressionMock.returns(this.compressionSpy);

    this.bodyParserMock = {
      urlencoded : sinon.stub(),
      json : sinon.stub()
    };
    this.urlencodedSpy = sinon.spy();
    this.bodyParserMock.urlencoded.returns(this.urlencodedSpy);
    this.jsonSpy = sinon.spy();
    this.bodyParserMock.json.returns(this.jsonSpy);

    this.methodOverrideMock = sinon.stub();
    this.methodOverrideSpy = sinon.spy();
    this.methodOverrideMock.returns(this.methodOverrideSpy);

    this.cookieParserMock = sinon.stub();
    this.cookieParserSpy = sinon.spy();
    this.cookieParserMock.returns(this.cookieParserSpy);

    this.sessionMock = sinon.stub();
    this.sessionSpy = sinon.spy();
    this.sessionMock.returns(this.sessionSpy);

    this.redisLibMock = sinon.stub();

    this.redisMock = sinon.stub();
    this.redisSpy = sinon.spy();
    this.redisMock.returns(this.redisSpy);

    this.errorHandlerMock = sinon.stub();
    this.errorHandlerSpy = sinon.spy();
    this.errorHandlerMock.returns(this.errorHandlerSpy);

    this.livereloadMock = sinon.stub();
    this.livereloadSpy = sinon.spy();
    this.livereloadMock.returns(this.livereloadSpy);

    this.appMock = {
      get : sinon.stub(),
      set : sinon.spy(),
      use : sinon.spy(),
      engine : sinon.spy()
    };

    this.overrides = {
      'express' : this.expressMock,
      'serve-favicon' : this.faviconMock,
      'morgan' : this.morganMock,
      'compression' : this.compressionMock,
      'body-parser' : this.bodyParserMock,
      'method-override' : this.methodOverrideMock,
      'cookie-parser' : this.cookieParserMock,
      'express-session' : this.sessionMock,
      'connect-redis' : this.redisMock,
      './redis' : this.redisLibMock,
      'connect-livereload' : this.livereloadMock,
      'errorhandler' : this.errorHandlerMock
    };
  });

  function verify () {
    this.appMock.get.should.have.been.calledWithExactly('env');
    this.appMock.set.should.have.been.calledWith('views', sinon.match(/\/server\/views$/));
    this.appMock.engine.should.have.been.calledWith('html', sinon.match.any);
    this.appMock.set.should.have.been.calledWith('view engine', 'html');
    this.appMock.use.should.have.been.calledWith(this.compressionSpy);
    this.bodyParserMock.urlencoded.should.have.been.calledWith(sinon.match({extended : false}));
    this.appMock.use.should.have.been.calledWith(this.urlencodedSpy);
    this.bodyParserMock.json.should.have.been.called;
    this.appMock.use.should.have.been.calledWith(this.jsonSpy);
    this.methodOverrideMock.should.have.been.called;
    this.appMock.use.should.have.been.calledWith(this.methodOverrideSpy);
    this.cookieParserMock.should.have.been.calledWith(sinon.match.string);
    this.appMock.use.should.have.been.calledWith(this.cookieParserSpy);
    this.appMock.set.should.have.been.calledWith('trust proxy', true);
    this.redisLibMock.should.have.been.called;
  }

  describe('non-production', function () {

    function verifyNonProduction () {
      this.appMock.use.should.have.been.calledWith(this.livereloadSpy);
      this.expressMock.static.should.have.been.calledWith(sinon.match(/\.tmp$/));
      this.expressMock.static.should.have.been.calledWith(sinon.match(/client$/));
      this.appMock.use.should.have.been.calledWith(this.staticSpy);
      this.appMock.set.should.have.been.calledWith('appPath', sinon.match(/client$/));
      this.morganMock.should.have.been.calledWith('dev');
      this.appMock.use.should.have.been.calledWith(this.morganSpy);
      this.errorHandlerMock.should.have.been.called;
      this.appMock.use.should.have.been.calledWith(this.errorHandlerSpy);
    }

    describe('development', function () {

      before(function () {
        process.env.NODE_ENV = 'development';
      });

      beforeEach(function () {
        this.appMock.get.withArgs('env').returns('development');
      });

      it('should configure express for development environment', function () {
        proxyquire('./express', this.overrides)(this.appMock);
        verify.call(this);
        verifyNonProduction.call(this);
      });

    });

    describe('test', function () {

      before(function () {
        process.env.NODE_ENV = 'test';
      });

      beforeEach(function () {
        this.appMock.get.withArgs('env').returns('test');
      });

      it('should configure express for test environment', function () {
        proxyquire('./express', this.overrides)(this.appMock);
        verify.call(this);
        verifyNonProduction.call(this);
      });

    });
  });

  describe('production', function () {

    function verifyProduction () {
      this.faviconMock.should.have.been.calledWith(sinon.match(/favicon\.ico/));
      this.expressMock.static.should.have.been.calledWith(sinon.match(/public$/));
      this.appMock.use.should.have.been.calledWith(this.staticSpy);
      this.appMock.set.should.have.been.calledWith('appPath', sinon.match(/public$/));
      this.morganMock.should.have.been.calledWith('dev');
    }

    before(function () {
      process.env.NODE_ENV = 'production';
    });

    beforeEach(function () {
      this.appMock.get.withArgs('env').returns('production');
    });

    it('should configure express for production environment with no redis', function () {
      proxyquire('./express', this.overrides)(this.appMock);
      verify.call(this);
      verifyProduction.call(this);
      this.sessionMock.should.have.been.called;
      this.sessionMock.lastCall.args[0].should.have.property('secret');
      this.sessionMock.lastCall.args[0].should.not.have.property('store');
      this.appMock.use.should.have.been.calledWith(this.sessionSpy);
    });

    it('should configure express for production environment with redis', function () {
      this.redisLibMock.returns(sinon.spy());

      proxyquire('./express', this.overrides)(this.appMock);
      verify.call(this);
      verifyProduction.call(this);
      this.redisMock.should.have.been.calledWith(this.sessionMock);
      this.sessionMock.should.have.been.called;
      this.sessionMock.lastCall.args[0].should.have.property('secret');
      this.sessionMock.lastCall.args[0].should.have.property('store');
      this.appMock.use.should.have.been.calledWith(this.sessionSpy);
    });

     it('should force https', function (done) {

       this.timeout(5000);

       var app = express();

       var noop = function (req, res, next) {
         next();
       }

       this.faviconMock.returns(noop);
       this.sessionMock.returns(noop);

       proxyquire('./express', {
          'serve-favicon' : this.faviconMock,
          'express-session' : this.sessionMock,
          '../components/common-redis' : this.redisLibMock,
          './log' : new mocks.LogMock()
        })(app);

       app.get('/', function (req, res) {
          res.status(httpstatus.OK).json({ok : true});
       });

       async.series([
         function (next) {
           request(app)
             .get('/')
             .expect(httpstatus.OK, next);
         },
         function (next) {
           request(app)
             .get('/')
             .set('x-forwarded-proto', 'http')
             .expect(httpstatus.FOUND)
             .expect('location', /^https/, next);
         }
       ], done);
     });

  });

});
