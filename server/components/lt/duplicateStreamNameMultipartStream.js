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

var util = require('util');
var MultipartStream = require('multipart-form-stream');
var log = require('../../config/log');
var PassThrough = require('stream').PassThrough;

var NEWLINE = '\r\n';
var FIELD_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="%s"';
var FIELD_CONTENT_DISPOSITION_LENGTH = FIELD_CONTENT_DISPOSITION.length - 2;
var FILE_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="%s"; filename="%s"';
var FILE_CONTENT_DISPOSITION_LENGTH = FILE_CONTENT_DISPOSITION.length - 4;
var CONTENT_TYPE = 'Content-Type: %s';
var CONTENT_TYPE_LENGTH = CONTENT_TYPE.length - 2;

function DuplicateStreamNameMultipartStream(options) {
  options = options || {};
  this._boundary = options.boundary || 'SuperSweetSpecialBoundaryShabam';
  this._streams = {};
  this._fields = {};
  this._streamCount = 0;

  this.readable = true;
  this.writable = true;
  this.paused = true;
  this.busy = false;
  this.eof = false;
  this.midstream = false;
}
util.inherits(DuplicateStreamNameMultipartStream, MultipartStream);

DuplicateStreamNameMultipartStream.prototype.addStream = function(field, filename, mimeType, stream) {
  stream.pause();
  this._streamCount++;
  this._streams[this._streamCount.toString()] = {
    field: field,
    filename: filename,
    mimeType: mimeType,
    stream: stream
  };
  process.nextTick(this.resume.bind(this));
};

DuplicateStreamNameMultipartStream.prototype._read = function() {
  if (!this.readable || this.paused) return;
  if ( this.midstream ) {
   log.warn('Requesting a read when a stream is still emptying!');
  } else
  if (Object.keys(this._fields).length) {
    this._emitField(this._read.bind(this));
  } else if (Object.keys(this._streams).length) {
    this._emitStream(this._read.bind(this));
  } else {
    this.end();
  }
};

DuplicateStreamNameMultipartStream.prototype._emitStream = function(cb) {
  var index = Object.keys(this._streams)[0];
  var item = this._streams[index];
  var field = item.field;
  var filename = item.filename;
  var mimeType = item.mimeType;
  var stream = item.stream;
  var lines = [];

  this.midstream = true;

  lines.push('--' + this._boundary);
  lines.push(FILE_CONTENT_DISPOSITION.replace('%s', field).replace('%s', filename));
  lines.push(CONTENT_TYPE.replace('%s', mimeType));
  lines.push('')
  lines.push('')

  var lines_stream = new PassThrough();
  lines_stream.write(lines.join(NEWLINE)) // the string you want
  lines_stream.end();
  lines_stream.pipe(this, {
    end: false
  });

  stream.pipe(this, {
    end: false
  });
  stream.on('end', (function handleFileEnd() {
    log.info('incoming file stream ' + index + ' emptied');
    this.emit('data', NEWLINE);
    delete this._streams[index];
    this.midstream = false;
    cb();
  }).bind(this));
  stream.resume();
};

module.exports = DuplicateStreamNameMultipartStream;
