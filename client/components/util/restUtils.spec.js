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

describe('Module: restUtil', function () {

  beforeEach(module('mtTrainingApp'));
  beforeEach(module('ibmwatson-mt-ui-training.restUtil'));

  describe('Service: WatsonVerticalLayoutModel', function () {

    var restUtil;

    beforeEach(inject(function ($injector) {
      restUtil = $injector.get('restUtil');
    }));

    var access = 'tenant_id';

    it('should exist', function () {
      expect(restUtil).not.toBeNull();
      expect(typeof restUtil.getErrorMessage).toEqual('function');
    });

    describe('getErrorMessage', function () {

      var alertObject;

      it('should return an alertObject with level : error and message with value matching the errorResponse', function () {
        var sampleUncaughtErrorResponse = {
          data: {
            message: 'DuplicateDetected',
            stack: 'Error: DuplicateDetected\n at /home/vagrant/src/wdctools/ibmwatson-mt-ui-training/server/components/modelStore/index.js:50:19\nFrom previous event:\n at /home/vagrant/src/wdctools/ibmwatson-mt-ui-training/server/components/modelStore/index.js:48:65\nFrom previous event:\n at ensureUniqueness (/home/vagrant/src/wdctools/ibmwatson-mt-ui-training/server/components/modelStore/index.js:34:6)\n at process._tickCallback (node.js:448:13)\nFrom previous event:\n at Object.createModel [as create] (/home/vagrant/src/wdctools/ibmwatson-mt-ui-training/server/components/modelStore/index.js:94:6)\n at createCustomModel (/home/vagrant/src/wdctools/ibmwatson-mt-ui-training/server/api/models/models.controller.js:222:18)\n at Layer.handle [as handle_request] (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/layer.js:82:5)\n at next (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/route.js:100:13)\n at ensureAuthenticated (/home/vagrant/src/wdctools/ibmwatson-mt-ui-training/server/config/rest.js:23:12)\n at Layer.handle [as handle_request] (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/layer.js:82:5)\n at next (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/route.js:100:13)\n at Route.dispatch (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/route.js:81:3)\n at Layer.handle [as handle_request] (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/layer.js:82:5)\n at /home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:234:24\n at param (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:331:14)\n at param (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:347:14)\n at Function.proto.process_params (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:391:3)\n at /home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:228:12\n at Function.match_layer (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:295:3)\n at next (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:189:10)\n at /home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:191:16\n at Function.match_layer (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:295:3)\n at next (/home/vagrant/my_node_modules/wdctools/ibmwatson-mt-ui-training/node_modules/express/lib/router/index.js:189:10)'
          },
          status: 409,
          config: {
            method: 'POST',
            transformRequest: [null],
            transformResponse: [null],
            url: '/api/models/' + access + '/customModels',
            data: {
              name: 'jeff',
              description: '',
              base_model_id: 'en-pt',
              domain: 'news',
              source: 'en',
              target: 'pt',
              project: 'JamesProject',
              status: 'CREATED',
              status_date: 1447369407679
            },
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json;charset=utf-8'
            }
          },
          statusText: 'Conflict'
        };

        alertObject = restUtil.getErrorMessage(sampleUncaughtErrorResponse);

        expect(alertObject.type).toEqual('error');
        expect(alertObject.message).toEqual(sampleUncaughtErrorResponse);
      });

      it('should return an alertObject with message lifted from messages', function () {
        var ltErrorResponse = {
          data: {
            errorOrigin: 'CreateCustomModel',
            errorCode: '1',
            inserts: {
              modelName: 'jeff'
            },
            message: 'A model with this name: jeff already exists '
          },
          status: 409,
          config: {
            method: 'POST',
            transformRequest: [null],
            transformResponse: [null],
            url: '/api/models/' + access + '/customModels',
            data: {
              name: 'jeff',
              description: '',
              base_model_id: 'en-pt',
              domain: 'news',
              source: 'en',
              target: 'pt',
              project: 'JamesProject',
              status: 'CREATED',
              status_date: 1447456695184
            },
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json;charset=utf-8'
            }
          },
          statusText: 'Conflict'
        };

        alertObject = restUtil.getErrorMessage(ltErrorResponse);

        expect(alertObject.type).toEqual('warning');
        expect(alertObject.message).toEqual('W0001 Duplicate prevented. A model with the name jeff already exists.');
      });

      it('should return a warning the message couldn\'t be found in the local plus the ltError object', function () {
        var ltErrorResponse = {
          data: {
            errorOrigin: 'CreateCustomModel',
            errorCode: 'missingCode',
            inserts: {
              insert1: 'insert1'
            },
            message: 'An localeless error occurred '
          },
          status: 409,
          config: {
            method: 'POST',
            transformRequest: [null],
            transformResponse: [null],
            url: '/api/models/' + access + '/customModels',
            data: {
              name: 'jeff',
              description: '',
              base_model_id: 'en-pt',
              domain: 'news',
              source: 'en',
              target: 'pt',
              project: 'JamesProject',
              status: 'CREATED',
              status_date: 1447456695184
            },
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json;charset=utf-8'
            }
          },
          statusText: 'Conflict'
        };

        alertObject = restUtil.getErrorMessage(ltErrorResponse);

        expect(alertObject.type).toEqual('error');
        expect(alertObject.message).toEqual(JSON.stringify(ltErrorResponse.data));
      });

      it('should return an alertObject with message lifted from messages but with no inserts made', function () {
        var ltErrorResponse = {
          data: {
            errorOrigin: 'CreateCustomModel',
            errorCode: '1',
            inserts: {
              insert1: 'insert1'
            },
            message: 'An localeless error occurred '
          },
          status: 409,
          config: {
            method: 'POST',
            transformRequest: [null],
            transformResponse: [null],
            url: '/api/models/' + access + '/customModels',
            data: {
              name: 'jeff',
              description: '',
              base_model_id: 'en-pt',
              domain: 'news',
              source: 'en',
              target: 'pt',
              project: 'JamesProject',
              status: 'CREATED',
              status_date: 1447456695184
            },
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json;charset=utf-8'
            }
          },
          statusText: 'Conflict'
        };

        alertObject = restUtil.getErrorMessage(ltErrorResponse);

        expect(alertObject.type).toEqual('warning');
        expect(alertObject.message).toEqual('W0001 Duplicate prevented. A model with the name  already exists.');
      });

    });
  });

});
