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

var nock = require('nock');
var testConstants = require('../testConstants');
var testModel = testConstants.testModel;
var env = require('../../config/environment');
var ltFullUrl = env.endpoints.language_translator;
var index = ltFullUrl.indexOf('/language-translator');
var ltUrl = ltFullUrl.substring(0, index);


var trainModel_header =
{ 'x-backside-transport': 'OK OK',
connection: 'Keep-Alive',
'transfer-encoding': 'chunked',
server: 'Apache-Coyote/1.1',
date: 'Fri, 31 Jul 2015 10:56:43 GMT',
'x-service-api-version': '2.0-SNAPSHOT',
'content-disposition': 'inline',
pragma: 'no-cache',
'x-zuul': 'zuul',
'x-zuul-instance': 'unknown',
'x-zuul-filter-executions': 'Static[SUCCESS][0ms], RouteLanguage[SUCCESS][0ms], FinalPrepareRequest[SUCCESS][1ms], PrePayloadLog[SUCCESS][1ms], ForwardLanguage[SUCCESS][820ms], SetResponse[SUCCESS][0ms]',
'x-originating-url': 'http://gateway-s.watsonplatform.net/language-translator/api/v2/models',
'content-type': 'application/json;charset=utf-8',
'set-cookie': [ 'Watson-DPAT=2Y49XhavRXtYAJnspaUEC4zqT4%2BaWCnUzC31vo3cYiv5gu0Nq%2FquMsaP%2Bsjdh1OWhL13kQl7zCU0ZW%2FFW0VS0liIWIFrxUqsGNGUV4aVOLoCOtu5avsxMtD2lSjTpgUehv8UCIB0dV2tMk698S%2FUulcww8zrlS0jGZYF96bdZc%2BUHBGaX4W7F1CfAOBUwJ33MNiM4NyXxIs%2FXgQpiJo7AYZ%2B0lf2uJTWJh73tfSdZnRpocG%2BAcp1PJV2z2YSw5%2FG0BgiAMMbcm8BS3Y0tSeID8e07NXEgVauiXnuQVJ3UVyTNvUM4NvhihYsUbTZtiaFxCUNXgUVCI7PK1RknMexX4Tfg71OVGZsxZKGkClt4CZSrppJzyVAa8K3mj2M%2BNVIwmHU7KaGCaPMeEwqPbOhaF1jlh7IGLjw1zHwN7yegPsmIvt9CttWGZSKpXjbCOZP7GB%2FDoAEC542%2F%2BHGm6ARqzoWy02iaaD%2BeZQ1Y5gMQMUOpXcXFxXCWZwHBNwEZB39Tqj5F43W%2FI4hQdFOvmJ0hPh1CrBi%2F8ZRdCUxIePQbg32kIIU9TLZQ5Q62cQ3tBtvOyNmfJ%2Bd%2FevmS6AEMB46KFU2NhuKOxGFICHV809bOVp241HF816dbSXmpAcWfnKplmY16PVTa%2Bj1S5Bcu5oYCh3z2yQguZMatDOmZQ1hY4cE8%2BEjEfqHpyo92emxxh0AxtZM%2FYbc4me7bP1b%2FcAnpcGMzwCtH892hpindQAGnxEtNmDlv6J06pSM3ASu0baEW7HQnQlbQJ%2B5ZQCu%2FLXtfNtqQMxEPZEruZt9t%2Fw5Q9CpGau3RnlRWp2yOVMvEJ8AWCmfGnKHrppOHSs3G5xqfgXWoo81RnoWGrIs6y8EqokDYp7TEFd%2FNbSjPW4twqgE79bZ5S7TQ88EU3WKoI85nA0Lr4seo9woivDK5yVLjddiQZn8QqY0B1vy85bITF9ObXD4xz0RAupVLA%2FpF0p87A%3D%3D; path=/language-translator/api; secure; HttpOnly' ],
'x-client-ip': '195.212.29.90',
'x-global-transaction-id': '112948225',
'x-dp-watson-tran-id': 'csf_platform_stg_dp02-112948225' };

var getBaseModelsHeaders = {
    'x-backside-transport': 'OK OK',
    connection: 'Keep-Alive',
    'transfer-encoding': 'chunked',
    'content-type': 'text/html; charset=utf-8',
    date: 'Mon, 15 Jun 2015 22:09:37 GMT',
    etag: 'W/"e1VTVBbzXI99TKbW73LZzw=="',
    'x-cf-requestid': '00716569-cfc8-4fbd-7769-049f3ac3f500',
    'x-powered-by': 'Express',
    'x-client-ip': '81.100.45.63',
    'x-global-transaction-id': '309369747',
    'x-watson-user-customize-allowed': 'true'
};

var getBaseModelsReply = {
    "models": [{
        "model_id": "com.ibm.mt.models.en-es-news",
        "source": "en",
        "target": "es",
        "base_model_id": "",
        "customizable": true,
        "default": true,
        "domain": "news",
        "owner": "",
        "status": "available",
        "name": "IBM news model English to Spanish"
    }, {
        "model_id": "com.ibm.mt.models.zh-en-patent",
        "source": "zh",
        "target": "en",
        "base_model_id": "",
        "customizable": true,
        "default": true,
        "domain": "patent",
        "owner": "",
        "status": "available",
        "name": "IBM patent model Chinese to English "
    }]
};

var getCustomModelsNoneReply = {
    "models": []
};

var getCustomModelsOneReply = {
    "models": [{"model_id":"f7472f0c2aeeb5b4f24159e3c78f0a1d","source":"en","target":"es",
    "base_model_id":"en-es","domain":"news","customizable":false,"default_model":false,
    "owner":"ff0ccf16-cea3-43d9-8867-581bd98f78b6","status":"available","name":"MyTestModel"}]
};

var deleteModelHeaders = {
  'x-backside-transport': 'OK OK',
  connection: 'Keep-Alive',
  'transfer-encoding': 'chunked',
  server: 'Apache-Coyote/1.1',
  date: 'Fri, 31 Jul 2015 10:56:43 GMT',
  'x-service-api-version': '2.0-SNAPSHOT',
  'content-disposition': 'inline',
  pragma: 'no-cache',
  'x-zuul': 'zuul',
  'x-zuul-instance': 'unknown',
  'x-zuul-filter-executions': 'Static[SUCCESS][0ms], RouteLanguage[SUCCESS][0ms], FinalPrepareRequest[SUCCESS][1ms], PrePayloadLog[SUCCESS][1ms], ForwardLanguage[SUCCESS][820ms], SetResponse[SUCCESS][0ms]',
  'x-originating-url': 'http://gateway-s.watsonplatform.net/language-translator/api/v2/models/58a2afa1-f035-4f5f-87d8-db14e6c9b8fc',
  'content-type': 'text/plain;charset=utf-8',
  'x-client-ip': '195.212.29.86',
  'x-global-transaction-id': '8375401',
  'x-dp-watson-tran-id': 'csf_platform_stg_dp01-8375401' };


exports.getBaseModels = function getBaseModels() {
    return nock(ltUrl)
        .get('/language-translator/api/v2/models?default=true')
        .reply(200, getBaseModelsReply, getBaseModelsHeaders);
}

exports.getCustomModelsNone = function getBaseModels() {
    return nock(ltUrl)
        .get('/language-translator/api/v2/models?default=false')
        .reply(200, getCustomModelsNoneReply, getBaseModelsHeaders);
}

exports.getCustomModelsOne = function getBaseModels() {
    return nock(ltUrl)
        .get('/language-translator/api/v2/models?default=false')
        .reply(200, getCustomModelsOneReply, getBaseModelsHeaders);
}

module.exports.deleteModel = function() {
  return nock(ltUrl)
    .delete('/language-translator/api/v2/models/' + testModel.trained_model_id)
    .reply(200, {status:'OK'}, deleteModelHeaders);
}

module.exports.trainModel = function() {
    return nock(ltUrl)
        .filteringRequestBody(function(body) {
            try {
                var boundary = body.split('\r\n')[0];
                var newbody = body;
                //Remove boundarys and new lines
                newbody = newbody.split(boundary).join('');
                newbody = newbody.split('\r\n').join('');
                return newbody;
            } catch (e) {
                console.log(e);
                return body;
            }
            return body;
        })
        .post('/language-translator/api/v2/models', 'Content-Disposition: form-data; name="base_model_id"com.ibm.mt.models.en-es-newsContent-Disposition: form-data; name="name"MyTestModelContent-Disposition: form-data; name="forced_glossary"; filename="file1.tmx"Content-Type: text/xmlI am the contents of glossary file with uuid 29e00c56-875e-4b8e-ad15-file1Content-Disposition: form-data; name="parallel_corpus"; filename="file2.tmx"Content-Type: text/xmlI am the contents of parallel corpus file with uuid 29e00c56-875e-4b8e-ad15-file2Content-Disposition: form-data; name="monolingual_corpus"; filename="file3.tmx"Content-Type: text/plainI am the contents of monolingual corpus file with uuid 29e00c56-875e-4b8e-ad15-file3--')
        .reply(200, {
            model_id: testModel.trained_model_id
        }, trainModel_header);
};

module.exports.status_available = function() {
    return nock(ltUrl)
        .get('/language-translator/api/v2/models/' + testModel.trained_model_id)
        .reply(200, {
            "status": "available",
            "progress": "100%",
            "estimated_time_remaining": "0",
            "base_model_id": "com.ibm.mt.models.en-es-news"
        }, trainModel_header);

};

var sucessfulTrainingLog = 'TRAINING SERVER LOG:\n' +
'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
'>>>  Validating tmx files\n' +
'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
'language pair      : en-us_es-es\n' +
'template directory : /opt/ibm/rct/models/en-us_es-es\n' +
'parallel corpus    : (none)\n' +
'monolingual corpus : (none)\n' +
'project directory  : /home/laser/rct-service-1.0.0-SNAPSHOT/workspace/34d75a39-7340-4238-b3e2-28a87acd90ba/build\n' +
'forced glossary    : /home/laser/rct-service/workspace/34d75a39-7340-4238-b3e2-28a87acd90ba/dataset/forced_glossary/aren.tmx\n' +
'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
'>>>  Tokenizing and parsing\n' +
'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
'preserving these markup tags: (none)\n' +
'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n' +
'>>>  Packaging customized model\n' +
'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

module.exports.sucessfulTrainingLog = sucessfulTrainingLog;

exports.getTrainingLog = function getTrainingLog(trainedModelId) {
    return nock(ltUrl)
        .get('/language-translator/api/v2/models/' + trainedModelId + '?verbose=true')
        .reply(200, {
         "model_id": trainedModelId,
 "source": "en",
 "target": "es",
 "base_model_id": "en-es",
 "domain": "news",
 "customizable": false,
 "default_model": false,
 "owner": "ff0ccf16-cea3-43d9-8867-581bd98f78b6",
 "status": "available",
 "name": "another",
 "train_log": sucessfulTrainingLog
        }, trainModel_header);
}

module.exports.translate = function() {
    return nock(ltUrl)
        .get('/language-translator/api/v2/translate?model_id=' + testModel.trained_model_id + '&text=The%20quick%20brown%20fox%20jumped%20over%20the%20lazy%20dog')
        .reply(200, {
            "word_count": 12,
            "character_count": 48,
            "translations": [{
                "translation": "this is the translation output"
            }]
        }, trainModel_header);

};
module.exports.translateBaseModel = function() {
    return nock(ltUrl)
        .get('/language-translator/api/v2/translate?model_id=' + testModel.base_model_id + '&text=The%20quick%20brown%20fox%20jumped%20over%20the%20lazy%20dog')
        .reply(200, {
            "word_count": 12,
            "character_count": 48,
            "translations": [{
                "translation": "this is the translation output"
            }]
        }, trainModel_header);

};
