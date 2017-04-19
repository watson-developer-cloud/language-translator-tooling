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

describe('Service: filestorage', function () {

  // load the service's module
  beforeEach(module('mtTrainingApp'));

  // instantiate service
  var Batch, CloneBatch, File, $httpBackend;

  var batchId = 'batch_id';
  var fileId = 'file_id';

  var access = 'tenant_id';
  var endpoint = '/api/batches/' + access;

  beforeEach(inject(function (_$httpBackend_, _Batch_, _CloneBatch_, _File_) {
    $httpBackend = _$httpBackend_;
    Batch = _Batch_;
    CloneBatch = _CloneBatch_;
    File = _File_;

    $httpBackend
      .when('GET', endpoint)
      .respond(200);
    $httpBackend
      .when('GET', endpoint + '/' + batchId)
      .respond(200);
    $httpBackend
      .when('POST', endpoint)
      .respond(201);
    $httpBackend
      .when('DELETE', endpoint + '/' + batchId)
      .respond(204);
    $httpBackend
      .when('POST', endpoint + '/' + batchId + '/clone')
      .respond(201);
    $httpBackend
      .when('GET', endpoint + '/' + batchId + '/files')
      .respond(200);
    $httpBackend
      .when('POST', endpoint + '/' + batchId + '/files')
      .respond(201);
    $httpBackend
      .when('POST', endpoint + '/' + batchId + '/files/' + fileId)
      .respond(200);
    $httpBackend
      .when('DELETE', endpoint + '/' + batchId + '/files/' + fileId)
      .respond(204);
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should exist', function () {
    expect(!!Batch).toBe(true);
    expect(!!CloneBatch).toBe(true);
    expect(!!File).toBe(true);
  });

  describe('Batches', function() {

    it('should be able to get all batches', function() {
      $httpBackend.expectGET(endpoint);
      Batch.query({tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to get a batch', function() {
      $httpBackend.expectGET(endpoint + '/' + batchId);
      Batch.get({batch_id: batchId, tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to post a batch', function() {
      $httpBackend.expectPOST(endpoint);
      Batch.save({tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to delete a batch', function() {
      $httpBackend.expectDELETE(endpoint + '/' + batchId);
      Batch.delete({batch_id: batchId, tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to clone a batch', function() {
      $httpBackend.expectPOST(endpoint + '/' + batchId + '/clone');
      CloneBatch.save({batch_id: batchId, tenant_id: access});
      $httpBackend.flush();
    });

  });

  describe('Files', function() {

    it('should be able to get all files', function() {
      $httpBackend.expectGET(endpoint + '/' + batchId + '/files');
      File.query({batch_id: batchId, tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to post a file', function() {
      $httpBackend.expectPOST(endpoint + '/' + batchId + '/files');
      File.save({batch_id: batchId, tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to update a file', function() {
      $httpBackend.expectPOST(endpoint + '/' + batchId + '/files/' + fileId);
      File.save({batch_id: batchId, file_id: fileId, tenant_id: access});
      $httpBackend.flush();
    });

    it('should be able to delete a file', function() {
      $httpBackend.expectDELETE(endpoint + '/' + batchId + '/files/' + fileId);
      File.delete({batch_id: batchId, file_id: fileId, tenant_id: access});
      $httpBackend.flush();
    });
  });

});
