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
var MultipartStream = require('./duplicateStreamNameMultipartStream');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var should = chai.should();
chai.use(sinonChai);

describe('/server/components/lt/duplicateStreamNameMultipartStream', function () {

  describe('Constructor', function () {

    it('check construction with undefined parameter ', function (done) {
      var stream = new MultipartStream();
      stream._boundary.should.equal('SuperSweetSpecialBoundaryShabam');
      expect(stream._options).to.be.empty;
      done();
    });

  });

});
