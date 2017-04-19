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

angular.module('ibmwatson-mt-ui-training.restUtil', [])
  .factory('restUtil', ['$filter', function ($filter) {

    var messages = {
        '1' : {
          level : 'warning',
          template : 'rest-W0001'
        },
        '2' : {
          level : 'error',
          template : 'rest-E0002'
        },
        '3' : {
          level : 'error',
          template : 'rest-E0003'
        },
        '4' : {
          level : 'error',
          template : 'rest-E0004'
        },
        '100' : {
          level : 'error',
          template : 'rest-E0100'
        },
        '101' : {
          level : 'error',
          template : 'rest-E0101'
        },
        '200' : {
          level : 'error',
          template : 'rest-E0200'
        },
        '201' : {
          level : 'error',
          template : 'rest-E0201'
        },
        '202' : {
          level : 'error',
          template : 'rest-E0202'
        },
        '203' : {
          level : 'error',
          template : 'rest-E0203'
        },
        '204' : {
          level : 'error',
          template : 'rest-E0204'
        },
        '205' : {
          level : 'error',
          template : 'rest-E0205'
        },
        '206' : {
          level : 'error',
          template : 'rest-E0206'
        },
        '207' : {
          level : 'error',
          template : 'rest-E0207'
        },
        '208' : {
          level : 'error',
          template : 'rest-E0208'
        },
        '209' : {
          level : 'warning',
          template : 'rest-W0209'
        },
        '210' : {
          level : 'error',
          template : 'rest-W0210'
        },
      '211' : {
        level : 'error',
        template : 'rest-E0211'
      }
    };

    var exports = {};

    exports.getErrorMessage = function getErrorMessage (errorResponse) {
      if (errorResponse && errorResponse.data && errorResponse.data.errorCode) {
        var match = messages[errorResponse.data.errorCode];
        if (typeof match === 'undefined') {
          return {
            type : 'error',
            message : JSON.stringify(errorResponse.data)
          };
        } else {
          var message = $filter('translate')(match.template, errorResponse.data.inserts);
          return {
            type : match.level,
            message : message
          };
        }
      } else {
        return {
          type : 'error',
          message : errorResponse
        };
      }
    };
    return exports;
  }]);
