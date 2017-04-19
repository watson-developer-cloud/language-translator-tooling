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

// core dependencies
var util = require('util');
var path = require('path');

// external dependencies
var async = require('async');
var chai = require('chai');
var ejs = require('ejs');
var express = require('express');
var HTTPStatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var LTServiceError = require('./components/common').LTServiceError;
var LTError = require('./components/common').LTError;

var config = require('./config/environment');

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('./test/mocks');

describe('/server/routes', function () {

  before(function () {
    this.error = 'test-generated';

    this.app = express();
    this.app.set('views', config.root + '/server/views');
    this.app.engine('html', ejs.renderFile);
    this.app.engine('js', ejs.renderFile);
    this.app.set('view engine', 'html');
    this.app.set('appPath', path.join(config.root, 'client'));

    this.app.get('/error', function (req, res) {
      throw new Error(this.error);
    }.bind(this));

    this.app.get('/conflictError', function (req, res) {
      throw new Error('DuplicateDetected');
    }.bind(this));

    this.app.get('/myError', function (req, res) {
      throw new LTServiceError('myError', '999', null, HTTPStatus.BAD_REQUEST);
    }.bind(this));

    this.app.get('/myErrorWithNoHttpStatusCode', function (req, res) {
      throw new LTError('myErrorWithNoHttpStatusCode', '999', null);
    }.bind(this));

    this.authenticateModule = express.Router();

    this.overrides = {
      './api/authenticate' : this.authenticateModule,
      './config/log' : new mocks.LogMock()
    };

    this.routes = proxyquire('./routes', this.overrides);
    this.routes(this.app);
  });

  it('should redirect to index.html for non-existent routes', function (done) {
    request(this.app)
      .get('/does/not/exist')
      .expect('Content-Type', /html/)
      .expect(HTTPStatus.OK, done);
  });

  it('should redirect to error page for invalid routes', function (done) {
    request(this.app)
      .get('/api/does/not/exist')
      .expect('Content-Type', /html/)
      .expect(HTTPStatus.NOT_FOUND, done);
  });

  it('should return dynamically generated login.js module', function (done) {
    request(this.app)
      .get('/modules/login.js')
      .expect('Content-Type', /html/)
      .expect(HTTPStatus.OK, done);
  });

  it('should handle uncaught exceptions', function (done) {
    request(this.app)
      .get('/error')
      .expect('Content-Type', /json/)
      .expect(HTTPStatus.INTERNAL_SERVER_ERROR)
      .end(function (err, resp) {
        resp.should.have.deep.property('body.status', HTTPStatus.INTERNAL_SERVER_ERROR);
        done(err);
      }.bind(this));
  });

  it('should handle conflict exceptions', function (done) {
    request(this.app)
      .get('/conflictError')
      .expect('Content-Type', /json/)
      .expect(HTTPStatus.CONFLICT)
      .end(function (err, resp) {
        resp.should.have.deep.property('body.status', HTTPStatus.CONFLICT);
        done(err);
      }.bind(this));
  });

  it('should handle an LTService Error with an httpStatusCode by removing error message', function (done) {
    request(this.app)
      .get('/myError')
      .expect('Content-Type', /json/)
      .expect(HTTPStatus.BAD_REQUEST)
      .end(function (err, resp) {
        resp.should.have.deep.property('body.httpStatusCode', HTTPStatus.BAD_REQUEST);
        resp.should.not.have.property('body.message');
        resp.should.not.have.property('body.stack');
        done(err);
      }.bind(this));
  });

  it('should handle an LTService Error with no httpStatusCode', function (done) {
    request(this.app)
      .get('/myErrorWithNoHttpStatusCode')
      .expect('Content-Type', /json/)
      .expect(HTTPStatus.INTERNAL_SERVER_ERROR)
      .end(function (err, resp) {
        resp.should.not.have.deep.property('body.httpStatusCode');
        resp.should.not.have.property('body.message');
        resp.should.not.have.property('body.stack');
        done(err);
      }.bind(this));
  });

});
