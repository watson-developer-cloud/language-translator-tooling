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

describe('Directive: mtFooter', function () {

  // load the directive's module and view
  beforeEach(module('mtTrainingApp'));
  beforeEach(module('app/directives/mtFooter/mtFooter.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  // it('should make hidden element visible', inject(function ($compile) {
  //   element = angular.element('<mt-footer></mt-footer>');
  //   element = $compile(element)(scope);
  //   scope.$apply();
  //   expect(element.text()).toContain('© 2015 IBM Watson');
  //   expect(element.text()).toContain('Contact');
  //   expect(element.text()).toContain('Privacy');
  //   expect(element.text()).toContain('Terms of Use');
  //   expect(element.text()).toContain('Accessibility');
  // }));
});
