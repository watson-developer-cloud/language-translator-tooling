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

describe('Filter: toCountry', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var toCountry;
  beforeEach(inject(function ($filter) {
    toCountry = $filter('toCountry');
  }));

  it('should return the matching language and country of the input code es', function () {
    var text = 'es';
    expect(toCountry(text)).toBe('Spanish (Spain)');
  });

  it('should return the matching language and country of the input code fr', function () {
    var text = 'fr';
    expect(toCountry(text)).toBe('French (France)');
  });

  it('should return the matching language and country of the input code en', function () {
    var text = 'en';
    expect(toCountry(text)).toBe('English (US)');
  });

  it('should return the matching language and country of the input code pt', function () {
    var text = 'pt';
    expect(toCountry(text)).toBe('Portuguese (Brazil)');
  });

});
