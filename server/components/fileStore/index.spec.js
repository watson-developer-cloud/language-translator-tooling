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
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');
var httpstatus = require('http-status');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);


describe('/server/components/fileStore/index', function () {


  beforeEach(function () {
    this.logMock = new mocks.LogMock();
    this.requestMock = new mocks.RequestMock();
  });

  describe('#getObjectStoreCredentials()', function () {

    describe(' using GA ObjectStorage credentials', function () {

      var storage = {
        auth_url : 'https://myauth.url.com',
        id : 'myId',
        plan : 'standard',
        userId : 'MyUserId',
        password : 'MyPassword',
        projectId : 'MyProjectId'
      };

      beforeEach(function () {
        this.fileStore = proxyquire('./index', {
          'request' : this.requestMock,
          '../../config/log' : this.logMock,
          '../../config/storage' : storage
        });
      });

      it('should return credentials ', function (done) {

        var body = '{}';
        var response = {
          statusCode : httpstatus.CREATED,
          body : body,
          headers : {
            'content-type' : 'application/json',
            'x-subject-token' : 'asdgfasdgasdg'
          }

        };
        this.requestMock.post.callsArgWith(1, null, response, body);
        this.fileStore.getObjectStoreCredentials(function (err, credentials) {
          expect(err).to.be.null;
          credentials.should.not.be.undefined;
          done();
        })
      });


    });

    describe(' using old Beta ObjectStorage credentials', function () {

      var storage = {
        id : 'Service Name',
        plan : 'free',
        auth_uri : 'https://myauthuri.com',
        global_account_auth_uri : 'https://myauthuri.global.om',
        username : 'MyUserName',
        password : 'MyPassword',
        version : 'v1'
      };
      beforeEach(function () {
        this.fileStore = proxyquire('./index', {
          'request' : this.requestMock,
          '../../config/log' : this.logMock,
          '../../config/storage' : storage
        });
      });

      it('should return credentials ', function (done) {

        var body = '{}';
        var response = {
          statusCode : httpstatus.OK,
          body : body,
          headers : {
            'content-type' : 'application/json',
            'x-storage-url' : 'asdgfasdgasdg',
            'x-auth-token' : 'asdgfasdgasdg'
          }

        };
        this.requestMock.get.callsArgWith(2, null, response, body);
        this.fileStore.getObjectStoreCredentials(function (err, credentials) {
          expect(err).to.be.null;
          credentials.should.not.be.undefined;
          done();
        })
      });


    });

    describe(' missing credentials', function () {


      beforeEach(function () {
        this.fileStore = proxyquire('./index', {
          'request' : this.requestMock,
          '../../config/log' : this.logMock,
          '../../config/storage' : {}
        });
      });

      it('should return an Error ', function (done) {
        this.fileStore.getObjectStoreCredentials(function (err, credentials) {
          err.should.not.be.null;
          expect(credentials).to.be.undefined;
          done();
        })
      });

    });

  })


});
