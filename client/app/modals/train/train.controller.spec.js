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

// var $rootScope, $scope, $q, mockFiles, mockFile;
// var modalInstance = { close: function() {}, dismiss: function() {} };
// var model = {
//   'model_id': 'com.ibm.mt.models.en-fr-news-1',
//   'source': 'en',
//   'target': 'fr',
//   'domain': 'news',
//   'base_model_id': 'com.ibm.mt.models.en-fr-news',
//   'owner': '74a239fa-f2db-42ef-8737-7bf74f49e35f',
//   'batch_id': '1',
//   'selected_batch_id': '2',
//   'name': 'NPR - French News',
//   'description': 'English to French News',
//   'lastModified': 'Unknown'
// };
// var file = {
//   'name': 'glossary.tmx',
//   'size': 391
// };
// var newFile1 = {
//   'name': 'new_glossary1.tmx',
//   'size': 391
// };
// var newFile2 = {
//   'name': 'new_glossary2.tmx',
//   'size': 391
// };
// var mockReturnFile = {
//   'value': {
//     'name': 'mock_glossary.tmx',
//     'size': 390,
//     'selected_batch_id': 'null'
//   }
// };

// describe('TrainCtrl: When parent $scope has files loaded', function () {

//   // load the controller's module
//   beforeEach(module('mtTrainingApp'));

  // Initialize the controller and a mock scope
//   beforeEach(inject(function (_$q_, _$rootScope_, $controller) {
//     $q = _$q_;
//     $rootScope = _$rootScope_;

//     $scope = $rootScope.$new();
//     $scope.$parent.files = {};
//     // get files list from parents scope
//     $scope.$parent.files[model.name] = [file];

//     mockFiles = {
//       query: function() {
//         var queryDeferred = $q.defer();
//         return {$promise: queryDeferred.promise};
//       }
//     };

//     mockFile = {
//       delete: function(id) {
//         return id;
//       }
//     };

//     spyOn(mockFiles, 'query').andCallThrough();
//     spyOn(mockFile, 'delete').andCallThrough();

//     $controller('TrainCtrl', {
//       '$scope': $scope,
//       '$modalInstance': modalInstance,
//       'model': model,
//       'Files': mockFiles,
//       'File': mockFile
//     });
//   }));

//   it('should have a model', function () {
//     expect($scope.model).toBeDefined();
//   });
// });

// describe('TrainCtrl: When parent $scope does not have files loaded', function () {

//   // load the controller's module
//   beforeEach(module('mtTrainingApp'));

//   beforeEach(inject(function(_$q_, _$rootScope_) {
//     $q = _$q_;
//     $rootScope = _$rootScope_;
//   }));

//   // Initialize the controller and a mock scope
//   beforeEach(inject(function ($controller) {
//     $scope = $rootScope.$new();
//     $scope.$parent.files = {};
//     // no files list loaded from parents
//     $scope.$parent.files[model.name] = [];

//     mockFiles = {
//       query: function() {
//         var queryDeferred = $q.defer();
//         queryDeferred.resolve([mockReturnFile]);
//         return {$promise: queryDeferred.promise};
//       }
//     };

//     spyOn(mockFiles, 'query').andCallThrough();

//     $controller('TrainCtrl', {
//       '$scope': $scope,
//       '$modalInstance': modalInstance,
//       'model': model,
//       'Files': mockFiles,
//       'File': mockFile
//     });
//   }));

  // it('should query the Files service', function() {
  //   expect(mockFiles.query).toHaveBeenCalled();
  // });

  // it('should get files from Files', function () {
  //   $rootScope.$apply();
  //   expect($scope.files).toBeDefined();
  //   expect($scope.files.length).toBe(1);
  //   expect($scope.files[0].name).toBe(mockReturnFile.value.name);
  // });

  // it('should save new files to $scope.$parent', function () {
  //   $rootScope.$apply();
  //   expect($scope.$parent.files[model.name]).toBeDefined();
  //   expect($scope.$parent.files[model.name].length).toBe(1);
  //   expect($scope.$parent.files[model.name][0].name).toBe(mockReturnFile.value.name);
  // });
// });

// describe('TrainCtrl: When working with a new model', function () {

//   // load the controller's module
//   beforeEach(module('mtTrainingApp'));

//   beforeEach(inject(function(_$q_, _$rootScope_) {
//     $q = _$q_;
//     $rootScope = _$rootScope_;
//   }));

//   // Initialize the controller and a mock scope
//   beforeEach(inject(function ($controller) {
//     $scope = $rootScope.$new();

//     $controller('TrainCtrl', {
//       '$scope': $scope,
//       '$modalInstance': modalInstance,
//       'model': model
//     });
//   }));

  // it('should set $scope.$parent.files', function () {
  //   expect($scope.$parent.files).toBeDefined();
  //   expect($scope.$parent.files[model.name].length).toBe(0);
  // });

  // it('should not have any files', function () {
  //   expect($scope.files).toBeDefined();
  //   expect($scope.files.length).toBe(0);
  // });
// });

// describe('TrainCtrl: When working with a model', function () {

//   // load the controller's module
//   beforeEach(module('mtTrainingApp'));

//   beforeEach(inject(function(_$q_, _$rootScope_) {
//     $q = _$q_;
//     $rootScope = _$rootScope_;
//   }));

  // Initialize the controller and a mock scope
  // beforeEach(inject(function ($controller) {
  //   $scope = $rootScope.$new();
  //   $scope.$parent.files = {};
  //   // no files list loaded from parents
  //   $scope.$parent.files[model.name] = [newFile1, newFile2];
  //   model.lastModified = 'Unknown';

  //   mockFiles = {
  //     query: function() {
  //       var queryDeferred = $q.defer();
  //       queryDeferred.resolve([]);
  //       return {$promise: queryDeferred.promise};
  //     }
  //   };

  //   mockFile = {
  //     get: function(id, cb) {
  //       var mockFileConstructor = function (file) {
  //         return {
  //           $save: function(cb) {
  //             cb(file);
  //           }
  //         };
  //       };

  //       cb(mockFileConstructor(file));
  //     }
  //   };

  //   spyOn(mockFiles, 'query').andCallThrough();
  //   spyOn(mockFile, 'get').andCallThrough();

  //   $controller('TrainCtrl', {
  //     '$scope': $scope,
  //     '$modalInstance': modalInstance,
  //     'model': model,
  //     'Files': mockFiles,
  //     'File': mockFile
  //   });
  // }));

  // it('should have two files', function () {
  //   expect($scope.$parent.files).toBeDefined();
  //   expect($scope.$parent.files[model.name].length).toBe(2);

  //   expect($scope.files).toBeDefined();
  //   expect($scope.files.length).toBe(2);
  //   expect($scope.files).toContain(newFile1);
  //   expect($scope.files).toContain(newFile2);
  // });

  // it('should have a train method', function () {
  //   expect($scope.train).toBeDefined();
  // });

  // it('should have a cancel method', function () {
  //   expect($scope.cancel).toBeDefined();
  // });

  // it('should have a hide method', function () {
  //   expect($scope.hide).toBeDefined();
  // });

  // it('should have an addMoreFiles method', function () {
  //   expect($scope.addMoreFiles).toBeDefined();
  // });

  // it('should be able to select files for training', function () {
  //   expect($scope.files).toBeDefined();
  //   expect($scope.files.length).toBe(2);

  //   $scope.files[0].selected = true;
  //   $scope.files[1].selected = false;

  //   $scope.train();

  //   expect(mockFile.get.calls.length).toEqual(2);
  //   expect($scope.files.length).toBe(2);
  // });

  // it('should update last modified on training', function () {
  //   var lastModified = model.lastModified;

  //   $scope.files[0].selected = true;
  //   $scope.files[1].selected = false;

  //   $scope.train();

  //   expect(model.lastModified).not.toBe(lastModified);
  // });
// });
