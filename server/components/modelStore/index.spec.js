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

describe('/server/components/modelStore/index', function () {

  before(function (done) {
    this.timeout(5000);
    this.logMock = new mocks.LogMock();

    // local dependencies
    this.modelStore = proxyquire('./index', {
      '../../config/log' : this.logMock
    });
    this.modelStoreDB = null;

    var setupDBComplete = (function (err, dbhandle) {
      this.modelStoreDB = dbhandle;
      done();
    }).bind(this);
    this.modelStore.setupDB(setupDBComplete);
  });

  describe('#updateModel()', function () {

    afterEach(function () {
      this.modelStoreDB.insert.restore();
    });

    it('should handle a valid tenantID and batchID and return a single size row', function (done) {
      var updatedModel = {};

      var body = {rev : 'new-rev'};
      var headers = {
        statusCode : HTTPStatus.ACCEPTED
      };
      var err = null;
      sinon.stub(this.modelStoreDB, 'insert').callsArgWith(1, err, body, headers);

      this.modelStore.update(updatedModel).then(function (response) {
        expect(response._rev).to.eql(body.rev);
        done();
      }).catch(function (err){
        //fail. obviously.
        expect(true).to.eql(false);
        done();
      });
    });

  });


});
