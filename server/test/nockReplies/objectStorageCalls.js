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
var storageService = require('../../config/storage');
var storageFullUrl = storageService.auth_uri;
var index = storageFullUrl.indexOf('/auth/');
var storageAuthUrl = storageFullUrl.substring(0, index);
var storageAuthUrlPath = storageFullUrl.substring(index, storageFullUrl.length) + '/' + storageService.username;


nock(storageAuthUrl)
  .persist()
  .get(storageAuthUrlPath)
  .reply(200, "", { 'x-backside-transport': 'OK OK',
  connection: 'Keep-Alive',
  'transfer-encoding': 'chunked',
  'content-type': 'application/json:charset=utf-8',
  date: 'Mon, 05 Oct 2015 22:37:30 GMT',
  'set-cookie': [ 'connect.sid=s%3ACyGruSxxpNrui37jpFPIyIQX.l4ix8qXC7KmdqvJ46WZg7IgBmbBt%2FjDkVBV3z%2BXOqjw; Path=/; HttpOnly' ],
  'x-auth-token': 'AUTH_tke2ace2f9aa344c88886ba53c68e22a98',
  'x-cf-requestid': 'f5aa1ff8-c277-4f1c-552c-071fd53c23c0',
  'x-powered-by': 'Express',
  'x-storage-url': 'https://dal05.objectstorage.softlayer.net/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1',
  'x-client-ip': '81.100.45.140',
  'x-global-transaction-id': '1296476509' });

  module.exports.emptyContainer = function() {
  return nock('https://dal05.objectstorage.softlayer.net:443')
    .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/UNIT_TESTS')
    .reply(200, [], { 'content-length': '3508',
    'x-container-object-count': '18',
    'accept-ranges': 'bytes',
    'x-storage-policy': 'standard',
    'x-container-bytes-used': '2351248',
    'x-timestamp': '1442244720.58032',
    'content-type': 'application/json; charset=utf-8',
    'x-trans-id': 'tx1f927ae8195c479baec2a-005612fbab',
    date: 'Mon, 05 Oct 2015 22:37:31 GMT',
    connection: 'keep-alive' });
}

module.exports.containerWithTwoFiles = function() {
return nock('https://dal05.objectstorage.softlayer.net:443')
  .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/UNIT_TESTS')
  .reply(200, [{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-22T10:37:02.420100","bytes":7674,"name":"1c6c85c0-cbe8-4f76-8aff-78104277828f","content_type":"application/octet-stream"},
               {"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-10-22T10:37:02.420100","bytes":5633,"name":"7201e3e5-079f-48df-9929-5ab6472a7e4e","content_type":"application/octet-stream"}],
  { 'content-length': '3508',
  'x-container-object-count': '18',
  'accept-ranges': 'bytes',
  'x-storage-policy': 'standard',
  'x-container-bytes-used': '2351248',
  'x-timestamp': '1442244720.58032',
  'content-type': 'application/json; charset=utf-8',
  'x-trans-id': 'tx1f927ae8195c479baec2a-005612fbab',
  date: 'Mon, 05 Oct 2015 22:37:31 GMT',
  connection: 'keep-alive' });
}

module.exports.containerWithOneFile = function() {
return nock('https://dal05.objectstorage.softlayer.net:443')
  .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/UNIT_TESTS')
  .reply(200, [{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-22T10:37:02.420100","bytes":7674,"name":"1c6c85c0-cbe8-4f76-8aff-78104277828f","content_type":"application/octet-stream"}],
  { 'content-length': '3508',
  'x-container-object-count': '18',
  'accept-ranges': 'bytes',
  'x-storage-policy': 'standard',
  'x-container-bytes-used': '2351248',
  'x-timestamp': '1442244720.58032',
  'content-type': 'application/json; charset=utf-8',
  'x-trans-id': 'tx1f927ae8195c479baec2a-005612fbab',
  date: 'Mon, 05 Oct 2015 22:37:31 GMT',
  connection: 'keep-alive' });
}


  // nock('https://dal05.objectstorage.softlayer.net:443')
  //   .get('/v1/AUTH_ed3baef3-b52b-4947-bf6c-4310ec1a30d1/UNIT_TESTS')
  //   .reply(200, [{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-22T10:37:02.420100","bytes":7674,"name":"0c413003-7836-4200-8793-9db80a052d1f","content_type":"application/octet-stream"},{"hash":"bf0fc3627c7c9179a829692e0a2f5388","last_modified":"2015-09-16T13:31:22.991550","bytes":5065,"name":"17796643-ff87-4a45-95da-69d07970d74b","content_type":"application/octet-stream"},{"hash":"d23edea42d27c005a796e4d6a64fa8a9","last_modified":"2015-09-23T13:36:55.027470","bytes":4964,"name":"1f7a99fe-891b-4b15-9595-238845ba9fde","content_type":"false"},{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-22T14:08:17.891540","bytes":7674,"name":"543a5580-fa4e-4d9b-8e85-45351295d5fe","content_type":"application/octet-stream"},{"hash":"d23edea42d27c005a796e4d6a64fa8a9","last_modified":"2015-09-17T08:26:18.479430","bytes":4964,"name":"7d5d0561-2bc1-43dc-a567-b6fe446743f2","content_type":"application/octet-stream"},{"hash":"d23edea42d27c005a796e4d6a64fa8a9","last_modified":"2015-09-22T14:09:45.431120","bytes":4964,"name":"83ca904c-6727-432f-9045-5c2e4cb41ce9","content_type":"application/octet-stream"},{"hash":"d23edea42d27c005a796e4d6a64fa8a9","last_modified":"2015-09-17T11:04:32.352350","bytes":4964,"name":"8586a30a-a277-402e-acfb-105781fa9e60","content_type":"application/octet-stream"},{"hash":"6d56f00bbf936add8136a65db12ec44a","last_modified":"2015-09-24T08:48:03.033430","bytes":2252906,"name":"8b1c5603-6811-49e9-8611-19b61bdd99a9","content_type":"false"},{"hash":"bf0fc3627c7c9179a829692e0a2f5388","last_modified":"2015-09-23T16:06:19.309370","bytes":5065,"name":"8b30a14f-5291-4c9d-ae9a-81abe6bc1c71","content_type":"false"},{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-17T08:25:59.006800","bytes":7674,"name":"8d1019e2-1ae6-45d3-9316-3999fc0a2195","content_type":"application/octet-stream"},{"hash":"d23edea42d27c005a796e4d6a64fa8a9","last_modified":"2015-09-22T14:11:30.597610","bytes":4964,"name":"92f4bdc7-041e-48aa-a99f-a698254984a6","content_type":"application/octet-stream"},{"hash":"d23edea42d27c005a796e4d6a64fa8a9","last_modified":"2015-09-16T13:35:58.231930","bytes":4964,"name":"a3a98039-cb80-4fad-80ab-0909fa535ba4","content_type":"application/octet-stream"},{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-16T14:53:05.559350","bytes":7674,"name":"a509f380-573f-4d00-abfc-a9f0207d2362","content_type":"application/octet-stream"},{"hash":"d952550b9611d8724c829f043b327aa2","last_modified":"2015-09-23T16:16:54.360690","bytes":4964,"name":"a52991e8-4ba8-4825-b2b1-10ecea60d703","content_type":"false"},{"hash":"d952550b9611d8724c829f043b327aa2","last_modified":"2015-09-16T13:37:20.994490","bytes":4964,"name":"b9c479d4-c286-4ea9-b971-02cac780029f","content_type":"application/octet-stream"},{"hash":"bf0fc3627c7c9179a829692e0a2f5388","last_modified":"2015-09-21T15:25:10.169230","bytes":5065,"name":"ebb76040-73d6-4e96-9921-b0fc9fae8c86","content_type":"application/octet-stream"},{"hash":"0034eaacfc2e422d9d5b24b51e3bb81f","last_modified":"2015-09-22T14:10:52.833410","bytes":7674,"name":"f8c1556c-6211-4f66-b2f4-5b7941a29055","content_type":"application/octet-stream"},{"hash":"bf0fc3627c7c9179a829692e0a2f5388","last_modified":"2015-09-28T15:58:16.585850","bytes":5065,"name":"fab74aef-9e8b-4639-88ec-d56f23fab797","content_type":"false"}], { 'content-length': '3508',
  //   'x-container-object-count': '18',
  //   'accept-ranges': 'bytes',
  //   'x-storage-policy': 'standard',
  //   'x-container-bytes-used': '2351248',
  //   'x-timestamp': '1442244720.58032',
  //   'content-type': 'application/json; charset=utf-8',
  //   'x-trans-id': 'tx1f927ae8195c479baec2a-005612fbab',
  //   date: 'Mon, 05 Oct 2015 22:37:31 GMT',
  //   connection: 'keep-alive' });
