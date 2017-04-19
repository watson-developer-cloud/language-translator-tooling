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

module.exports = {

  // Default values for VCAP, to be used with node cfenv if not present
  vcap: {
    application: null,
    services: {
      "objectstorage": [{
        "name": "ibmwatson-mt-objectstorage",
        "label": "objectstorage",
        "plan": "free",
        "credentials": {
          "auth_uri": "https://swift.test.com/auth/uid1/uid2",
          "global_account_auth_uri": "https://swift.ng.bluemix.net/global_auth/uid1/uid2",
          "username": "username",
          "password": "fce0408e931f15d456cb68401b8677f41f9a3c8b960a687d119935505caa"
        }
      }],
      "cloudantNoSQLDB": [{
        "name": "ibmwatson-mt-cloudant",
        "label": "cloudantNoSQLDB",
        "plan": "Shared",
        "credentials": {
          "username": "testuser",
          "password": "password",
          "host": "mytest.cloudant.com",
          "port": 443,
          "url": "https://testuser:password@mytest.cloudant.com"
        }
      }]
    }
  },
  endpoints: {
    language_translator: 'http://testlt.api.url/language-translator/api'
  }

}
