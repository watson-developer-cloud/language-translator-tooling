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

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var env = process.env.NODE_ENV || "development";

// All configurations will extend these options
// ============================================
var all = {
  env : env,

  // Root path of server
  root : path.normalize(__dirname + '/../../..'),

  // Server port
  port : process.env.PORT || 9000,

  // Secret for session, you will want to change this and make it an environment variable
  secrets : {
    cookie : process.env.COOKIE_SECRET || 'ibmwatson-lt-cookie-secret',
    session : process.env.SESSION_SECRET || 'ibmwatson-lt-session-secret',
    client : process.env.CLIENT_SECRET || 'bluemix-uaa-client-secret'
  },

  clientid : process.env.CLIENT_ID || 'bluemix-uaa-client-id',

  // Default values for VCAP, to be used with node cfenv if not present
  vcap : {
    application : null,
    services : {
      "Object-Storage": [
        {
          "name": "New Standard Object Storage",
          "label": "Object-Storage",
          "plan": "standard",
          "credentials": {
            "auth_url": "https://identity.open.softlayer.com",
            "project": "object_storage_6fd5973a_0619_4875_8e97_2f9d5a7dfec2",
            "projectId": "024ed345ac9f467689d483399adea1ea",
            "region": "dallas",
            "userId": "a88afe8070134e93b6b2cf56f55eb66e",
            "username": "Admin_df588a7e2ba9776a97ea052ceb53f866c960afd8",
            "password": "uy2e*Z/JiV3XgnxW",
            "domainId": "e9c35be3b0a34ff687e4bc23bdbda5c0",
            "domainName": "905113"
          }
        }
      ],
        "objectstorage" : [{
        "name" : "ibmwatson-mt-objectstorage",
        "label" : "objectstorage",
        "plan" : "free",
        "credentials" : {
          "auth_uri" : "https://swift.ng.bluemix.net/auth/54a28dc3-e1f4-49f9-b172-1715e4541bd3/5c31b77e-816a-4e68-8ce6-6787da3e17e2",
          "global_account_auth_uri" : "https://swift.ng.bluemix.net/global_auth/54a28dc3-e1f4-49f9-b172-1715e4541bd3/5c31b77e-816a-4e68-8ce6-6787da3e17e2",
          "username" : "e81ff5464cd0929d5b615a18b11be6595ab7f3b8",
          "password" : "fce0408e931f15d456cb68401b8677f41f9a3c8b960a687d119935505caa"
        }
      }],
      "cloudantNoSQLDB" : [{
        "name" : "ibmwatson-mt-cloudant",
        "label" : "cloudantNoSQLDB",
        "plan" : "Shared",
        "credentials" : {
          "username" : "f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix",
          "password" : "d77c1f16ef8b6e34b3613f31e77f38f6994e7f985f79db632026a08eaf635c5b",
          "host" : "f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com",
          "port" : 443,
          "url" : "https://f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix:d77c1f16ef8b6e34b3613f31e77f38f6994e7f985f79db632026a08eaf635c5b@f36abb56-0bb9-4a58-a265-bd628aefcdb5-bluemix.cloudant.com"
        }
      }]
    }
  },

  endpoints : {
    language_translator : process.env.TRANSLATION_SERVICE_ENDPOINT || 'https://gateway.watsonplatform.net/language-translator/api',
    bluemix : process.env.BLUEMIX_API || 'https://api.ng.bluemix.net/info',
    //callback : process.env.BLUEMIX_CALLBACK || 'https://wdctoolslocal.net/auth/bluemix/return',
    callback : process.env.BLUEMIX_CALLBACK || 'api/authenticate/bluemix/return',
    serviceprovider : process.env.BLUEMIX_SERVICEPROVIDER || 'https://serviceprovider.ng.bluemix.net/bluemix/service'
  },

  // Cypher key used to encrypt sensitive values in session
  cryptoKey : process.env.CRYPTO_KEY || 'ibmwatson-lt-cryptkey',

  // Session timeout. Default 24 hours
  sessionTimeout : process.env.SESSION_TIMEOUT || 86400,

  translationServiceName : process.env.TRANSLATION_SERVICE_NAME || 'Language Translator-on',

  objectStorageServiceName : process.env.OBJECT_STORAGE_SERVICE_NAME || 'ibmwatson-mt-objectstorage',
  //objectStorageServiceName : process.env.OBJECT_STORAGE_SERVICE_NAME || 'New Standard Object Storage',



  cloudantServiceName : process.env.CLOUDANT_SERVICE_NAME || 'ibmwatson-mt-cloudant'

};

var customEnv = path.resolve(__dirname, env + '.js');

var custom = {};
try {
  // Query the entry
  fs.lstatSync(customEnv);

  custom = require(customEnv);
} catch (e) {
  custom = {};
}

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  custom);
