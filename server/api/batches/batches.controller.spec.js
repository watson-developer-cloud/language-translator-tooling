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
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache();
var sinonChai = require('sinon-chai');
var should = chai.should();
var expect = chai.expect;
chai.use(sinonChai);
// test dependencies
var mocks = require('../../test/mocks');
var fs = require('fs');
var stream = require('stream');
var constants = require('./constants.js');
var batchLimits = constants.batchLimits;
var BatchError = require('../../components/common').BatchError;

describe('/server/api/batches/batches.controller', function () {

  before(function () {
    this.originalExportTesting = process.env.EXPORT_ALL_FOR_TESTING;
    process.env.EXPORT_ALL_FOR_TESTING = 'true';
    this.batchStore = require('../../components/batchStore');
    this.fileStore = require('../../components/fileStore');
    this.batches = require('./batches');
  });

  after(function () {
    if (this.originalExportTesting) {
      process.env.EXPORT_ALL_FOR_TESTING = this.originalExportTesting;
    }
  });

  beforeEach(function () {
    this.logMock = new mocks.LogMock();

    // local dependencies
    this.batchesController = proxyquire('./batches.controller', {
      '../../config/log' : this.logMock
    });
    this.logMock.info.reset();
    this.logMock.error.reset();
  });

  describe('#getAllBatches()', function () {

    describe('when batches.getAllBatches returns an error', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.contain('An Error');
        };

        var err = new Error('An Error');
        var batches = null;
        sinon.stub(this.batches, 'getAllBatches').callsArgWith(1, err, batches);

      });

      afterEach(function () {
        this.batches.getAllBatches.restore();
      });

      it('#getAllBatches should return an error', function (done) {
        this.batchesController.getAllBatches(this.req, this.resp, this.next);
        done();
      });
    });
  });

  describe('#getFiles()', function () {

    describe('when batches.getFiles returns an error', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.contain('An Error');
        };

        var err = new Error('An Error');
        var files = null;
        sinon.stub(this.batches, 'getFiles').callsArgWith(2, err, files);

      });

      afterEach(function () {
        this.batches.getFiles.restore();
      });

      it('#getFiles should return an error', function (done) {
        this.batchesController.getFiles(this.req, this.resp, this.next);
        done();
      });

    });

  });

  describe('#getFile()', function () {

    describe('when called', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId',
            fileId : 'fileId'
          }
        };


        var filestream = new stream.Readable();
        filestream.push('dummy stream');
        filestream.push(null);
        sinon.stub(this.batches, 'getFileAsStream').callsArgWith(3, filestream);
      });

      afterEach(function () {
        this.batches.getFileAsStream.restore();
      });

      it('#getFile should work', function (done) {
        this.done=done;

        this.resp = new stream.Writable();
        this.streamOutput='';
        this.resp._write = function (chunk, encoding, done) {
          this.streamOutput+=(chunk.toString());
          expect(this.streamOutput).to.contain('dummy stream');
          done();
          this.done();
        }.bind(this);

        this.batchesController.getFile(this.req, this.resp, this.next);
      });

    });

  });

  describe('#addfile()', function () {

    describe('should raise an error as the Forced Glossary file size exceeds the single Forced Glossary file limit', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            originalname : 'originalname',
            size : batchLimits.UPLOADED_FORCED_GLOSSARY_INDIVIDUAL_SIZE + 1
          },
          body : {
            data : '{"option":"forced_glossary"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(BatchError);
          expect(err.message).to.contain('Forced glossary file size limit exceeded.');
        };

        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        fs.unlink.restore();
      });

      it('(file deletes OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, null);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Successfully removed file')).to.be.true;
        done();
      });

      it('(file does not delete OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, 1);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Couldn\'t remove file')).to.be.true;
        done();
      });
    });

    describe('should raise an error as the Forced Glossary file size exceeds the Forced Glossary batch size limit', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            originalname : 'originalname',
            size : 1
          },
          body : {
            data : '{"option":"forced_glossary"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(BatchError);
          expect(err.message).to.contain('Forced glossary total size limit exceeded.');
        };

        var err = null;
        var batch = {
          batch : [{
            file_size : batchLimits.UPLOADED_FORCED_GLOSSARY_TOTAL_SIZE,
            training_file_option : 'forced_glossary'
          }]
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        fs.unlink.restore();
      });

      it('(file deletes OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, null);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Successfully removed file')).to.be.true;
        done();
      });

      it('(file does not delete OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, 1);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Couldn\'t remove file')).to.be.true;
        done();
      });
    });

    describe('should raise an error as the file size exceeds the single file limit', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            originalname : 'originalname',
            size : batchLimits.UPLOADED_FILE_SIZE + 1
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(BatchError);
          expect(err.message).to.contain('Single file size limited exceeded.');
        };

        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        fs.unlink.restore();
      });

      it('(file deletes OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, null);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Successfully removed file')).to.be.true;
        done();
      });

      it('(file does not delete OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, 1);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Couldn\'t remove file')).to.be.true;
        done();
      });
    });

    describe('should raise an error as the file size exceeds the batch size limit', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            originalname : 'originalname',
            size : 1
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(BatchError);
          expect(err.message).to.contain('Batch size limit exceeded.');
        };

        var err = null;
        var batch = {
          batch : [{file_size : batchLimits.BATCH_SIZE}]
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        fs.unlink.restore();
      });

      it('(file deletes OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, null);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Successfully removed file')).to.be.true;
        done();
      });

      it('(file does not delete OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, 1);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Couldn\'t remove file')).to.be.true;
        done();
      });
    });

    describe('should raise an error as the file is a duplicate', function () {

      beforeEach(function () {
        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            originalname : 'originalname'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(BatchError);
          expect(err.message).to.contain('Duplicate file uploaded');
        };

        var err = null;
        var batch = {
          batch : [{file_name : 'originalname'}]
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        fs.unlink.restore();
      });

      it('(file deletes OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, null);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Successfully removed file')).to.be.true;
        done();
      });

      it('(file does not delete OK)', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, 1);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWithMatch('Couldn\'t remove file')).to.be.true;
        done();
      });

    });

    describe('should upload a file OK', function () {

      beforeEach(function () {
        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

        err = null;
        batch = {
          batch : [{file_name : 'originalname'}]
        };
        sinon.stub(this.batchStore, 'updateBatch').callsArgWith(3, err, batch);

        err = null;
        var body = null;
        sinon.stub(this.fileStore, 'storeFile').callsArgWith(3, err, body);

        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            size : 1,
            originalname : 'originalname',
            path : 'path'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {
          sendStatus : function (status) {
            expect(status).to.equal(200);
          }
        };

        this.next = function (err) {
          //empty
        };
      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        this.batchStore.updateBatch.restore();
        this.fileStore.storeFile.restore();
        fs.unlink.restore();
      });

      it('should not raise an error', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, null);
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWith('Successfully uploaded file to Object Store')).to.be.true;
        done();
      });

    });

    describe('when getBatch returns an error', function () {

      beforeEach(function () {
        var err = new Error('Error getting batch');
        var batch = null;
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);


        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            size : 1,
            originalname : 'originalname',
            path : 'path'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.contain('Error getting batch');
        };
      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
      });

      it('should raise an error', function (done) {
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.error.calledWith(new Error('Error getting batch'))).to.be.true;
        done();
      });

    });

    describe('when no file has been uploaded', function () {

      beforeEach(function () {

        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);


        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.contain('No files uploaded');
        };
      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
      });

      it('should raise an error', function (done) {
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.error.calledWith(new Error('No files uploaded'))).to.be.true;
        done();
      });

    });

    describe('when updateBatch returns an error', function () {

      beforeEach(function () {
        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

        err = new Error('Error updating batch');
        batch = null;
        sinon.stub(this.batchStore, 'updateBatch').callsArgWith(3, err, batch);

        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            size : 1,
            originalname : 'originalname',
            path : 'path'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.contain('Error updating batch');
        };
      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        this.batchStore.updateBatch.restore();
      });

      it('should raise an error', function (done) {
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.error.calledWith(new Error('Error updating batch'))).to.be.true;
        done();
      });

    });

    describe('when storeFile returns an error', function () {

      beforeEach(function () {
        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

        err = null;
        batch = {
          batch : [{file_name : 'originalname'}]
        };
        sinon.stub(this.batchStore, 'updateBatch').callsArgWith(3, err, batch);

        err = new Error('Error storing file');
        var body = null;
        sinon.stub(this.fileStore, 'storeFile').callsArgWith(3, err, body);

        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            size : 1,
            originalname : 'originalname',
            path : 'path'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.contain('Error storing file');
        };
      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        this.batchStore.updateBatch.restore();
        this.fileStore.storeFile.restore();
      });

      it('should raise an error', function (done) {
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.error.calledWith(new Error('Error storing file'))).to.be.true;
        done();
      });
    });

    describe('when unlink returns an error when everything has succedded', function () {

      beforeEach(function () {
        var err = null;
        var batch = {
          batch : []
        };
        sinon.stub(this.batchStore, 'getBatch').callsArgWith(2, err, batch);

        err = null;
        batch = {
          batch : [{file_name : 'originalname'}]
        };
        sinon.stub(this.batchStore, 'updateBatch').callsArgWith(3, err, batch);

        err = null;
        var body = null;
        sinon.stub(this.fileStore, 'storeFile').callsArgWith(3, err, body);

        this.req = {
          params : {
            tenantId : 'tenantId',
            batchId : 'batchId'
          },
          file : {
            name : 'name',
            size : 1,
            originalname : 'originalname',
            path : 'path'
          },
          body : {
            data : '{"option":"option"}'
          }
        };
        this.resp = {};

        this.next = function (err) {
          //expect(err).to.be.an.instanceof(Error);
          //expect(err.message).to.contain('Error storing file');
        };
      });

      afterEach(function () {
        this.batchStore.getBatch.restore();
        this.batchStore.updateBatch.restore();
        this.fileStore.storeFile.restore();
        fs.unlink.restore();
      });

      it('should raise an error', function (done) {
        sinon.stub(fs, 'unlink').callsArgWith(1, new Error('Error unlinking file'));
        this.batchesController.addFile(this.req, this.resp, this.next);
        expect(this.logMock.info.calledWith('Successfully uploaded file to Object Store but couldn\'t remove from file system')).to.be.true;
        done();
      });

    });

  });

});
