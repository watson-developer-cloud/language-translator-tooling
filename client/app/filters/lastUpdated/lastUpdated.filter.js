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

angular.module('mtTrainingApp')
  .filter('lastUpdated', ['$filter', function ($filter) {
    return function (models) {
      var lastUpdated;

      if (models.length === 0) {
        lastUpdated = 'Never';
      } else {
        lastUpdated = models[0].status_date;

        for (var i = 0; i < models.length; ++i) {
          if (lastUpdated < models[i].status_date) {
            lastUpdated = models[i].status_date;
          }
        }
      }

      // translate the returned value
      var localized;
      if(lastUpdated=='Never') {
        localized = $filter('translate')("project-never-modified");
      } else {
        localized = moment.utc(lastUpdated).format('LLL');
      }
      return localized;
    };
  }]);
