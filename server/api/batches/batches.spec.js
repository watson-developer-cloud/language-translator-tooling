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

/*jshint expr: true*/
'use strict';

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var nock = require('nock');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var HTTPStatus = require('http-status');
var request = require('supertest');
var sinon = require('sinon');
var express = require('express');

var testConstants = require('../../test/testConstants');
var urlPrefix = testConstants.urlBatchesPrefix + '/' + testConstants.testTenantId
var ltNock = require('../../test/nockReplies/ltCalls');
var cloudantModelsNock = require('../../test/nockReplies/cloudantModelsCalls');
var nockCloudantBatches = require('../../test/nockReplies/cloudantBatchesCalls');
// test dependencies
var mocks = require('../../test/mocks');
var storeMock = new mocks.StoreMock();
//Setup mock ensureAuthenticated function
var mockrest = new mocks.RESTMock();

function setup (batchStore, callback) {
  batchStore.setupDB(function (err, response) {
    callback();
  });
}

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

var bluemixOAuthNock = require('../../test/nockReplies/bluemixOAuthNock');

/**
 *  Test Batches
 *  ============
 *
 *  GET     /batches                            get all batches
 *  GET     /batches/:batch_id                  get batch
 *  POST    /batches                            create new batch
 *  DELETE  /batches/:batch_id                  delete batch
 *  GET     /batches/:batch_id/clone            clone batch
 *
 *  {
 *    batch_id: "string",
 *    batch: [file_id, file_id...]
 *  }
 */

describe('Batches', function() {

 before(function(done) {
   this.timeout(5000);
   this.batchStore = require('../../components/batchStore');

   //Now pull this up the require chain
   this.batchesindex = proxyquire('./index', {
    '../../config/rest': mockrest
  });

   this.routes = proxyquire('../../routes', {
     './api/batches': this.batchesindex
   });

   this.expressSettings = require('../../config/express');

   this.app = express();
   this.expressSettings(this.app);
   this.routes(this.app);

   this.batchStore = require('../../components/batchStore');

   setup(this.batchStore, done);

 });


  var newBatch = {
    batch_id: 'new_batch',
    batch:  []
  };

  describe('POST ' + urlPrefix, function() {
    it("can add a new batch", function(done) {
      var nockScope = nockCloudantBatches.insert_new_batch();
      request(this.app)
        .post(urlPrefix)
        .send(newBatch)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.be.an('object');
            expect(res.body).to.not.be.empty;
            expect(res.body).to.have.property("ok", true);
            expect(res.body).to.have.property("id", newBatch.batch_id);
            nockScope.done();
            done();
          }
        });
    });

    it("can't add a duplicate batch", function(done) {
      var nockScope = nockCloudantBatches.insertDuplicate_new_batch();
      request(this.app)
      .post(urlPrefix)
      .send(newBatch)
      .expect(409)
      .end(function(err, res) {
        nockScope.done();
        done();
      });
    });
  });

  describe('GET ' + urlPrefix + '/:batch_id', function() {
    it('should respond with JSON array', function(done) {
      var nockScope = nockCloudantBatches.getAllBatches();
      request(this.app)
        .get(urlPrefix)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.be.instanceof(Array);
          nockScope.done();
          done();
        });
    });

    it("return the new batch containing a document with a key and value", function(done) {
      var nockScope = nockCloudantBatches.getBatch();
      request(this.app)
        .get(urlPrefix + '/' + newBatch.batch_id)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.be.an('object');
            expect(res.body).to.not.be.empty;
            expect(res.body).to.have.property("_id");
            expect(res.body).to.have.property("batch_id", newBatch.batch_id);
            expect(res.body).to.have.property("batch");
            nockScope.done();
            done();
          }
        });
    });

    it("can't get a non-existant batch", function(done) {
      var nockScope = nockCloudantBatches.getBatch_nonExisting();
      request(this.app)
        .get(urlPrefix + '/otherBatch')
        .expect(404)
        .end(function(err, res) {
          nockScope.done();
          done();
        });
    });
  });

  describe('POST ' + urlPrefix + '/:batch_id/clone', function() {
    it("clones a batch", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch();
      var nockScope2 = nockCloudantBatches.copyBatch();
      request(this.app)
        .post(urlPrefix + '/' + newBatch.batch_id + '/clone')
        .send({file_batch_id: newBatch.batch_id + '_copy'})
        .expect(201)
        .end(function(err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.be.an("object");
            expect(res.body).to.not.be.empty;
            expect(res.body).to.have.property("ok", true);
            expect(res.body).to.have.property("id", newBatch.batch_id + " copy");
            nockScope1.done();
            nockScope2.done();
            done();
          }
        });
    });

    it("cannot clone a batch with a duplicate name", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch();
      var nockScope2 = nockCloudantBatches.copyBatch_duplicateName();
      request(this.app)
        .post(urlPrefix + '/' + newBatch.batch_id + '/clone')
        .send({file_batch_id: newBatch.batch_id})
        .expect(409)
        .end(function(err, res) {
          nockScope1.done();
          nockScope2.done();
          done();
        });
    });
  });

  describe('DELETE ' + urlPrefix + '/:batch_id', function() {

    it("can delete a batch", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch();
      var nockScope2 = nockCloudantBatches.deleteBatch();
      request(this.app)
        .delete(urlPrefix +'/' + newBatch.batch_id)
        .expect(204)
        .end(function(err, res) {
          nockScope1.done();
          nockScope2.done();
          done();
        });
    });

    it("can delete a cloned batch", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch_newbatchcopy();
      var nockScope2 = nockCloudantBatches.deleteBatch_newbatchcopy();
      request(this.app)
        .delete(urlPrefix + '/' + newBatch.batch_id + '_copy')
        .expect(204)
        .end(function(err, res) {
          nockScope1.done();
          nockScope2.done();
          done();
        });
    });

    it("can't delete a non-existant batch", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch_nonExisting();
      request(this.app)
        .delete(urlPrefix + '/otherBatch')
        .expect(404)
        .end(function(err, res) {
          nockScope1.done();
          done();
        });
    });
  });
});

