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

describe('Service: Auth', function() {

  // load the service's module and mock $cookies
  beforeEach(module('mtTrainingApp'));

  // instantiate service
  var Auth, $httpBackend;

  var endpoints = {
    auth: 'http://ibmwatson-mt-auth.mybluemix.net'
  };

  beforeEach(inject(function($injector, _Auth_, _$httpBackend_) {
    Auth = _Auth_;
    $httpBackend = _$httpBackend_;
  }));

  it('should exist', function() {
    expect(!!Auth).toBe(true);
  });

  it('should use checkStatus to check if a user is logged in', function() {
    $httpBackend.expectGET(endpoints.auth);
    Auth.checkStatus();
  });

  it('should log in a user', function() {
    $httpBackend.expectPOST(endpoints.auth);
    Auth.login();
  });

  it('should log out a user', function() {
    $httpBackend.expectGET(endpoints.auth);
    Auth.logout();
  });

});
