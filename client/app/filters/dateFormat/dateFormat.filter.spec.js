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

describe('Filter: dateFormat', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));


  // initialize a new instance of the filter before each test
  var dateFormat;
  var moment;
  beforeEach(inject(function ($filter, _moment_) {
    dateFormat = $filter('dateFormat');
    moment = _moment_;
  }));

  it('should return the localized variation of the last modified date', function() {
    var testDate = new Date(1482667200000);

    moment.locale('fr');
    expect(dateFormat(testDate)).toBe('25 décembre 2016 12:00');

    moment.locale('en');
    expect(dateFormat(testDate)).toBe('December 25, 2016 12:00 PM');
  });
});
