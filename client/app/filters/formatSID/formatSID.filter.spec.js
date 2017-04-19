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

describe('Filter: formatSID', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var formatSID;
  beforeEach(inject(function ($filter) {
    formatSID = $filter('formatSID');
  }));

  it('should return untrained input as "Not available..."', function () {
    var text = 'UNTRAINED';
    expect(formatSID(text)).toBe('Not available: Untrained');
  });

  it('should return any other input as itself', function () {
    var text = 'alsjghaslga';
    expect(formatSID(text)).toBe(text);
  });

});
