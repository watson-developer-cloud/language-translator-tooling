
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
var bluemixOAuthNock = require('../../test/nockReplies/bluemixOAuthNock');

var mocks = require('../../test/mocks');
var storeMock = new mocks.StoreMock();

//Setup mock ensureAuthenticated function
var mockrest = new mocks.RESTMock();

function setup (batchStore, callback) {
  batchStore.setupDB(function (err, response) {
    callback();
  });
}


/**
 *  Test Files
 *  ==========
 *
 *  GET     /batches/:batch_id/files            get all files for model
 *  GET     /batches/:batch_id/files/:file_id   get file
 *  POST    /batches/:batch_id/files            adds a file
 *  PUT     /batches/:batch_id/files/:file_id   updates a file
 *  DELETE  /batches/:batch_id/files/:file_id   deletes a file
 *
 *  {
 *    file_name: "string",
 *    uuid: "string"
 *  }
 */

describe("Files", function() {

  before(function(done) {

    this.batchStore = require('../../components/batchStore');

    this.batches = proxyquire('./batches', {
      '../../components/fileStore' : storeMock
    })

    this.batchesController = proxyquire('./batches.controller', {
      './batches' : this.batches
    })


    //Now pull this up the require chain
    this.batchesindex = proxyquire('./index', {
      '../../config/rest': mockrest,
      './batches.controller': this.batchesController
    });

    this.routes = proxyquire('../../routes', {
      './api/batches': this.batchesindex
    });

    this.expressSettings = require('../../config/express');

    this.app = express();
    this.expressSettings(this.app);
    this.routes(this.app);

    //setup database first
    this.batchStore.setupDB(function (err, response) {
      done();
    })

  });


  describe('Given a language translator file store with a file no longer used by a batch ', function() {

    describe('When I delete the file', function() {

      it('Then I receive a ' + HTTPStatus.NO_CONTENT + ' status', function(done) {
        var spy = sinon.spy(storeMock, 'deleteFile');
        spy.withArgs('UNIT_TESTS', 'testFile');
        var nockScope1 = nockCloudantBatches.getBatch_News();
        var nockScope2 = nockCloudantBatches.updateBatch_News_DeletedFile();
        var nockScope3 = nockCloudantBatches.getFileCountZero();
        request(this.app).delete(urlPrefix + '/News/files/file1.tmx').
        expect(function(res) {
          if (res.statusCode !== HTTPStatus.NO_CONTENT) return 'Expected a ' + HTTPStatus.NO_CONTENT + ' return code';
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
          if (!(spy.withArgs('UNIT_TESTS', 'testFile').called)) return 'objectstorage deleteFile Should be called only once';
          spy.reset();
          storeMock.deleteFile.restore();
        }).end(done);
      });
    });
  });
  describe('Given a language translator file store with a file used by another batch ', function() {

    describe('When I try to delete the file', function() {

      it('Then I receive a ' + HTTPStatus.NO_CONTENT + ' status', function(done) {
        var spy = sinon.spy(storeMock, 'deleteFile');
        spy.withArgs('UNIT_TESTS', 'testFile');
        var nockScope1 = nockCloudantBatches.getBatch_News();
        var nockScope2 = nockCloudantBatches.updateBatch_News_DeletedFile();
        var nockScope3 = nockCloudantBatches.getFileCountNonZero();
        request(this.app).delete(urlPrefix + '/News/files/file1.tmx').
        expect(function(res) {
          if (res.statusCode !== HTTPStatus.NO_CONTENT) return 'Expected a ' + HTTPStatus.NO_CONTENT + ' return code';
          nockScope1.done();
          nockScope2.done();
          nockScope3.done();
          if ((spy.withArgs('UNIT_TESTS', 'testFile').called)) return 'objectstorage deleteFile Should not be called only once';
          spy.reset();
          storeMock.deleteFile.restore();
        }).end(done);
      });
    });

  });

  var newFile = {
    name: "new_file.tmx",
    location: "../../test/new_file.tmx"
  }

  var newBatch = {
    batch_id: 'News',
    batch:  [{file_name: 'file1.tmx', uuid: 'testFile'}]
  };

  var fileContents = 'this is a test';

  describe('GET ' + urlPrefix + '/:batch_id/files', function() {
    it("returns 200 ok", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch_News();
      request(this.app)
        .get(urlPrefix + '/' + newBatch.batch_id + '/files')
        .expect(200)
        .end(function(err, res) {
          nockScope1.done();
          done();
        });
    });

    it("returns a content type of application/json", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch_News();
      request(this.app)
        .get(urlPrefix + '/' + newBatch.batch_id + "/files")
        .expect('Content-Type', /application\/json/)
        .end(function(err, res) {
          nockScope1.done();
          done();
        });
    });

    it("returns an array of objects", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch_News();
      request(this.app)
        .get(urlPrefix + '/' + newBatch.batch_id + '/files')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.equal(1);
            expect(res.body[0].file_name).to.equal(newBatch.batch[0].file_name);
            expect(res.body[0].uuid).to.equal(newBatch.batch[0].uuid);
            nockScope1.done();
            done();
          }
        });
    });
  });

  /**
   *  TODO:
   *    Check files uploaded with correct id
   *    Check file stored in object store
   */

  describe('POST ' + urlPrefix + '/:batch_id/files', function() {

    // it("can add a new file to a batch", function(done) {
    //   request(this.app)
    //     .post(urlPrefix + '/' + newBatch.batch_id + '/files')
    //     .attach('file', __dirname + '/' + newFile.location)
    //     .expect(200, done);
    // });

    // it("has updated the batch property", function(done) {
    //   request(this.app)
    //     .get(urlPrefix + '/' + newBatch.batch_id + '/files')
    //     .expect(200)
    //     .end(function(err, res) {
    //       if (err) {
    //         done(err);
    //       } else {
    //         expect(res.body.length).to.equal(2);
    //         expect(res.body[1].file_name).to.equal(newFile.name);
    //         done();
    //       }
    //     });
    // });

    // it("has created a UUID", function(done) {
    //   request(this.app)
    //     .get(urlPrefix + '/' + newBatch.batch_id + '/files')
    //     .expect(200)
    //     .end(function(err, res) {
    //       if (err) {
    //         done(err);
    //       } else {
    //         expect(res.body.length).to.equal(2);
    //         expect(res.body[1].uuid).to.exist;
    //         done();
    //       }
    //     });
    // });

    // it("can't add a duplicate file", function(done) {
    //   request(this.app)
    //     .post(urlPrefix + '/' + newBatch.batch_id + '/files')
    //     .attach('file', __dirname + '/' + newFile.location)
    //     .expect(409, done);
    // });
  });

  describe('GET ' + urlPrefix + '/:batch_id/files/:file_id', function() {
    // it("can get file content", function(done) {
    //   request(this.app)
    //     .get(urlPrefix + '/' + newBatch.batch_id + '/files/' + newBatch.batch[0].uuid)
    //     .expect(200)
    //     .end(function(err, res) {
    //       if (err) {
    //         done(err);
    //       } else {
    //         expect(res.text).to.contain(fileContents);
    //         done();
    //       }
    //     });
    // });
  });

  describe('DELETE' + urlPrefix + '/:batch_id/files/:file_id', function() {
    // it("can delete a file", function(done) {
    //   request(this.app)
    //     .delete(urlPrefix + '/' + newBatch.batch_id + '/files/'+ newFile.name)
    //     .expect(204, done);
    // });
    //
    // it("removed file name from batch", function(done) {
    //   request(this.app)
    //     .get(urlPrefix + '/' + newBatch.batch_id + "/files")
    //     .expect(200)
    //     .end(function(err, res) {
    //       if (err) {
    //         done(err);
    //       } else {
    //         expect(res.body).to.be.instanceof(Array);
    //         expect(res.body.length).to.equal(1);
    //         expect(res.body[0].file_name).to.not.equal(newFile.name);
    //         done();
    //       }
    //     });
    // });

    it("can't delete a non-existant file", function(done) {
      var nockScope1 = nockCloudantBatches.getBatch_News();
      request(this.app)
        .delete(urlPrefix + '/' + newBatch.batch_id + '/files/otherFile')
        .expect(404)
        .end(function(err, res) {
          nockScope1.done();
          done();
        });
    });
  });
});
