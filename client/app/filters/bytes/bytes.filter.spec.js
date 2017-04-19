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

describe('Filter: bytes', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var bytes;
  beforeEach(inject(function ($filter) {
    bytes = $filter('bytes');
  }));

  it('should return - for a NaN', function () {
    var text = 'something';
    expect(bytes(text)).toBe('-');
  });

  it('should return 0 bytes for 0', function () {
    var text = 0;
    expect(bytes(text)).toBe('0 bytes');
  });

  it('should return the input for precision 2', function () {
    var text = '10';
    expect(bytes(text, 2)).toBe('10.00 bytes');
  });

  it('should return the input in bytes', function () {
    var text = '50';
    expect(bytes(text)).toBe('50.0 bytes');
  });

  it('should return the input in kB', function () {
    var text = '1200';
    expect(bytes(text)).toBe('1.2 kB');
  });

  it('should return the input in MB', function () {
    var text = '5000000';
    expect(bytes(text)).toBe('4.8 MB');
  });

  it('should return the input in GB', function () {
    var text = '10000000000';
    expect(bytes(text)).toBe('9.3 GB');
  });

  it('should return the input in TB', function () {
    var text = '10000000000000';
    expect(bytes(text)).toBe('9.1 TB');
  });

});
