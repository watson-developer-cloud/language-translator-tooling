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
//var env = require('../../config/environment');
// test dependencies
var mocks = require('../../test/mocks');

var HTTPStatus = require('http-status');
var common = require('../../components/common');


var should = chai.should();
chai.use(sinonChai);

describe('/server/components/batchStore/index', function () {

  before(function (done) {
    this.timeout(5000);
    this.logMock = new mocks.LogMock();

    // local dependencies
    this.batchStore = proxyquire('./index', {
      '../../config/log' : this.logMock
    });
    this.batchStoreDB = null;

    var setupDBComplete = (function (err, dbhandle) {
      this.batchStoreDB = dbhandle;
      done();
    }).bind(this);
    this.batchStore.setupDB(setupDBComplete);
  });

  describe('#getBatchSize()', function () {

    afterEach(function () {
      this.batchStoreDB.view.restore();
    });

    it('should handle a valid tenantID and batchID and return a single size row', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';

      var err = null;
      var body = {
        rows : [
          {
            key : ['DummyTenantID', 'DummyBatchID'],
            value : 100
          }
        ]
      };
      var headers = {
        statusCode : HTTPStatus.OK
      };
      sinon.stub(this.batchStoreDB, 'view').callsArgWith(3, err, body, headers);

      this.batchStore.getBatchSize(tenantID, batchID, function (err, result) {
        expect(result).to.eql(100);
        done();
      });
    });

    it('should handle a valid tenantID and invalid batchID', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';

      var err = null;
      var body = {
        rows : []
      };
      var headers = {
        statusCode : HTTPStatus.OK
      };
      sinon.stub(this.batchStoreDB, 'view').callsArgWith(3, err, body, headers);

      this.batchStore.getBatchSize(tenantID, batchID, function (err, result) {
        expect(err).to.be.an.instanceof(common.BatchNotFoundError);
        expect(err.httpStatusCode).to.eql(HTTPStatus.NOT_FOUND);
        done();
      });
    });

    it('should handle a non HTTPStatus.OK response', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';

      var err = null;
      var body = {};
      var headers = {
        statusCode : HTTPStatus.INTERNAL_SERVER_ERROR
      };
      sinon.stub(this.batchStoreDB, 'view').callsArgWith(3, err, body, headers);

      this.batchStore.getBatchSize(tenantID, batchID, function (err, result) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.eql('batch size query failed');
        done();
      });
    });

    it('should handle an error connecting to the database', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';

      var err = new Error('DatabaseError', null);
      var body = null;
      var headers = null;
      sinon.stub(this.batchStoreDB, 'view').callsArgWith(3, err, body, headers);

      this.batchStore.getBatchSize(tenantID, batchID, function (err, result) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.eql('DatabaseError');
        done();
      });
    });
  });

  describe('#getBatch()', function () {

    afterEach(function () {
      this.batchStoreDB.view.restore();
    });

    it('should handle a non HTTPStatus.OK response', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';

      var err = null;
      var body = {};
      var headers = {
        statusCode : HTTPStatus.INTERNAL_SERVER_ERROR
      };
      sinon.stub(this.batchStoreDB, 'view').callsArgWith(3, err, body, headers);

      this.batchStore.getBatch(tenantID, batchID, function (err, result) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.eql('batch query failed');
        done();
      });
    });
  });

  describe('#deleteBatch()', function () {

    afterEach(function () {
      this.batchStoreDB.destroy.restore();
    });

    it('should handle an error connecting to the database', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';
      var rev = 'rev';

      var err = new Error('DatabaseError', null);
      var body = null;
      sinon.stub(this.batchStoreDB, 'destroy').callsArgWith(2, err, body);

      this.batchStore.deleteBatch(tenantID, batchID, rev, function (err, result) {
        expect(err.err).to.be.an.instanceof(Error);
        expect(err.err.message).to.eql('DatabaseError');
        done();
      });
    });
  });

  describe('#updateBatch()', function () {

    afterEach(function () {
      this.batchStoreDB.insert.restore();
    });

    it('should handle an error connecting to the database', function (done) {
      var tenantID = 'DummyTenantID';
      var batchID = 'DummyBatchID';
      var batch = {};

      var err = new Error('DatabaseError', null);
      var body = null;
      sinon.stub(this.batchStoreDB, 'insert').callsArgWith(2, err, body);

      this.batchStore.updateBatch(tenantID, batch, batchID, function (err, result) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.eql('DatabaseError');
        done();
      });
    });
  });

  describe('#getAllBatches()', function () {

    afterEach(function () {
      this.batchStoreDB.view.restore();
    });

    it('should handle an error connecting to the database', function (done) {
      var tenantID = 'DummyTenantID';

      var err = new Error('DatabaseError', null);
      var body = null;
      sinon.stub(this.batchStoreDB, 'view').callsArgWith(3, err, body);

      this.batchStore.getAllBatches(tenantID, function (err, result) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.eql('DatabaseError');
        done();
      });
    });
  });

});
