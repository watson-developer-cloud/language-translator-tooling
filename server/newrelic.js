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


/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
var pkg = require('../package.json');
var APP_NAME     = pkg.name || 'unnamed-app';
var ENV_VAR_NAME = 'NEW_RELIC_LICENSE_KEY';
var NewRelicLicenseKey = process.env[ENV_VAR_NAME];
//------------------------------------------------------------------------------
exports.config = {
  /**
   * Array of application names.
   */
  app_name : [APP_NAME],
  /**
   * Your New Relic license key.
   */
  license_key : NewRelicLicenseKey || 'no-license-key-provided',
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'info'
  }
};
//------------------------------------------------------------------------------
exports.initialize = function() {
  if (!NewRelicLicenseKey || NewRelicLicenseKey==='NA') {
    console.log('newrelic not in use; env var ' + ENV_VAR_NAME + ' not set');
    return;
  }
  console.log('newrelic in use; app name: ' + APP_NAME);
  require('newrelic');
};
