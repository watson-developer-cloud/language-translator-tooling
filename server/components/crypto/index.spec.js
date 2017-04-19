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
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */


// external dependencies
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();

var should = chai.should();

var crypto;

var texts = {
  plain: 'andiwouldhavegottenawaywithitifitwerentforyoumeddlingkids',
  encrypted: '59cb6786b43483bf1a55f06b51e1f8f84b9198128f8fa2ed9f3f9260a4f3c92d04cea8407e57868953881f2e9017a75b06ca59a364929b6df24d705c6d01586d',
  key: 'scoobydoobydoo'
}

describe('/server/components/crypto/index', function () {

  before(function beforeHook(){

    crypto = proxyquire('./index',{
      '../../config/environment':{
        'cryptoKey':texts.key
      }
    });
  });

  describe('#encrypt', function() {

    it('should encrypt the supplied text using the key from the environment', function(){
      var result = crypto.encrypt(texts.plain);

      result.should.equal(texts.encrypted);

    });

  });


  describe('#decrypt', function() {

    it('should decrypt the supplied text using the key from the environment', function(){
      var result = crypto.decrypt(texts.encrypted);

      result.should.equal(texts.plain);
      
    });


  });

});