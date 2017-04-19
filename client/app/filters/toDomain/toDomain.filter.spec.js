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

describe('Filter: toDomain', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var toDomain;
  beforeEach(inject(function ($filter) {
    toDomain = $filter('toDomain');
  }));

  it('should return the matching domain to be translated', function () {
    expect(toDomain('news')).toBe('NEWS');
  });

  it('should return an unknown domain', function () {
    expect(toDomain('')).toBe('Unknown Domain');
    // todo translation test
  });
});
