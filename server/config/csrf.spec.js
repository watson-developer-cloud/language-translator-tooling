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
var chai = require('chai');
var should = chai.should();
var async = require('async');
var cookieParser = require('cookie-parser');
var express = require('express');
var session = require('express-session');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');


chai.use(sinonChai);


describe('/server/config/csrf', function () {

  before(function () {
    this.originalEnv = process.env.NODE_ENV;
  });

  after(function () {
    process.env.NODE_ENV = this.originalEnv;
  });

  describe('non-production', function () {

    before(function () {
      process.env.NODE_ENV = 'test';
    });

    beforeEach(function () {

      this.appMock = {
        get : sinon.spy(),
        use : sinon.spy()
      };

    });

    it('should not register anything in non-production environment', function () {
      proxyquire('./csrf', {})(this.appMock);
      this.appMock.get.should.have.been.called;
      this.appMock.use.should.not.have.been.called;
    });

  });

  describe('production', function () {

    before(function () {
      process.env.NODE_ENV = 'production';
    });

    beforeEach(function () {
      this.app = express();
    });

    it('should register middleware in production environment', function () {
      sinon.spy(this.app, 'use');

      var csurfMock = sinon.stub();
      var csurfSpy = sinon.spy();
      csurfMock.returns(csurfSpy);

      var csrf = proxyquire('./csrf', {
        'csurf' : csurfMock
      })(this.app);

      csurfMock.should.have.been.called;
      this.app.use.should.have.been.calledWith(csurfSpy);

      this.app.use.restore();
    });

    describe('API calls', function () {

      beforeEach(function () {
        this.sessionSecret = uuid.v1();
        this.cookieSecret = uuid.v1();
        this.app.use(cookieParser(this.cookieSecret));
        this.app.use(session({secret : this.sessionSecret}));
        proxyquire('./csrf', {})(this.app);

        this.app.get('/',
          function (req, res) {
            res.status(httpstatus.OK).json({ok : true});
          });

        this.app.post('/',
          function (req, res) {
            res.status(httpstatus.OK).json({ok : true});
          });

        this.app.use(function (err, req, res, next) {
          res.status(err.statusCode).send();
        });
      });

      it('should provide XSRF-TOKEN cookie on response', function (done) {
        request(this.app)
          .get('/')
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.deep.property('headers.set-cookie').that.is.an('array');
            var XSRFCookie = resp.headers['set-cookie'].filter(function (elem) {
              if (elem.match(/^XSRF-TOKEN=/)) {
                return true;
              }
              return false;
            });
            XSRFCookie.should.have.length(1);
            XSRFCookie[0].should.match(/; Secure/);
            done(err);
          });
      });

      it('should require valid X-XSRF-TOKEN header', function (done) {
        async.waterfall([
          function (next) {
            request(this.app)
              .get('/')
              .expect(httpstatus.OK)
              .end(function (err, resp) {
                //res.headers['set-cookie'][0];
                resp.should.have.deep.property('headers.set-cookie').that.is.an('array');
                resp.headers['set-cookie'].some(function (elem) {
                  return elem.match(/^XSRF-TOKEN=/);
                }).should.be.true;
                next(err, resp.headers['set-cookie']);
              });
          }.bind(this),
          function (cookies, next) {
            var xsrf;
            cookies.some(function (elem) {
              xsrf = elem.split('=')[1].split(';')[0];
              return elem.match(/^XSRF-TOKEN=/);
            });
            request(this.app)
              .post('/')
              .set('X-XSRF-TOKEN', xsrf)
              .set('Cookie', cookies)
              .expect(httpstatus.OK, next);
          }.bind(this)], done);
      });

      it('should reject invalid X-XSRF-TOKEN header', function (done) {
        async.waterfall([
          function (next) {
            request(this.app)
              .get('/')
              .expect(httpstatus.OK)
              .end(function (err, resp) {
                //res.headers['set-cookie'][0];
                resp.should.have.deep.property('headers.set-cookie').that.is.an('array');
                resp.headers['set-cookie'].some(function (elem) {
                  return elem.match(/^XSRF-TOKEN=/);
                }).should.be.true;
                next(err, resp.headers['set-cookie']);
              });
          }.bind(this),
          function (cookies, next) {
            request(this.app)
              .post('/')
              .set('X-XSRF-TOKEN', 'notvalid-' + uuid.v1())
              .set('Cookie', cookies)
              .expect(httpstatus.FORBIDDEN, next);
          }.bind(this)], done);
      });

    });

  });

});
