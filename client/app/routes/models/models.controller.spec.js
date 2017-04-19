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

describe('Controller: ModelsCtrl', function () {

  // load the controller's module
  beforeEach(module('mtTrainingApp'));

  var $q,
      $rootScope,
      $scope,
      $modal,
      $httpBackend,
      ModelsCtrl,
      deferred,
      deferredProjects,
      mockProjects,
      fileDeferred,
      customModels,
      modalOptions,
      statuses,
      fileTypes,
      Alerts;

  var access = 'tenant_id';

  var textToTranslate = 'some text';
  var translatedText = 'translated text';

  var files = [{file_name: 'file1.tmx'}, {file_name: 'file2.tmx'}];

  var mockModal = {
    result: {
      then: function(confirmCallback, cancelCallback) {
        //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
        this.confirmCallBack = confirmCallback;
        this.cancelCallback = cancelCallback;
      }
    },
    close: function(item) {
      //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
      this.result.confirmCallBack(item);
    },
    dismiss: function(type) {
      //The user clicked cancel on the modal dialog, call the stored cancel callback
      this.result.cancelCallback(type);
    }
  };

  var mockFile = {
    query: function() {
      fileDeferred = $q.defer();
      return {$promise: fileDeferred.promise};
    },
    delete: function() {
      fileDeferred = $q.defer();
      return {$promise: fileDeferred.promise};
    }
  };

  var mockUpload = {
    upload: function() {
      return mockUpload;
    },
    progress: function(cb) {
      cb({loaded: 100, total: 100, config: {file: {name: 'file'}}});
      return mockUpload;
    },
    success: function(cb) {
      cb(null, null, null, {file: {name: 'file'}});
      return mockUpload;
    },
    error: function(cb) {
      cb(null, null, null, {file: {name: 'file'}});
      return mockUpload;
    }
  };

  var mockProfiles = {
    openNextSteps: function() {},
    closeNextSteps: function() {},
    getBaseModels: function() {
      deferred = $q.defer();
      return deferred.promise;
    },
    loadModels: function() {
      deferred = $q.defer();
      return deferred.promise;
    },
    selectProject: function() {
    },
    loadProjects: function() {
      deferredProjects = $q.defer();
      return deferredProjects.promise;
    },
    createModel: function(model) {
      var newModel = {
        name: model.name,
        description: model.description,
        status_date: Date.now()
      };
      $scope.models.push(newModel);

      deferred = $q.defer();
      return deferred.promise;
    },
    deleteModel: function(model) {
      for (var i = 0; i < customModels.length; ++i) {
        if (model.custom_model_id === customModels[i].custom_model_id) {
          customModels.splice(i, 1);
        }
      }
      deferred = $q.defer();
      return deferred.promise;
    },
    cloneModel: function(model) {
      customModels.push(model);
      deferred = $q.defer();

      if (mockProfiles.unconfirmed) {
        deferred.reject();
      } else {
        deferred.resolve(mockClone);
        mockProfiles.unconfirmed = true;
        model.unconfirmed = model.name;
      }
      return deferred.promise;
    },
    undoClone: function() {
      deferred = $q.defer();
      return deferred.promise;
    },
    confirmClone: function(model, access) {
      delete mockProfiles.unconfirmed;
      delete model.unconfirmed;
      deferred = $q.defer();
      return deferred.promise;
    },
    train: function() {
      deferred = $q.defer();
      return deferred.promise;
    },
    translate: function() {
      deferred = $q.defer();
      return deferred.promise;
    },
    update: function(model, status) {
      model.status = status;
      model.status_date = Date.now();
      deferred = $q.defer();
      return deferred.promise;
    },
    poll: function() {
      deferred = $q.defer();
      return deferred.promise;
    }
  };

  // Rebuilt in the beforeEach functions
  var mockClone;

  var deleteOptions = {
    animation: true,
    templateUrl: 'app/modals/delete/delete.html',
    windowTemplateUrl: 'app/modals/main-template.html',
    controller: 'deleteCtrl',
    // size: 'sm',
    resolve: {
      deleted: jasmine.any(Function),
      objectType: jasmine.any(Function)
    }
  };

  var trainOptions = {
    animation: true,
    templateUrl: 'app/modals/train/train.html',
    windowTemplateUrl: 'app/modals/main-template.html',
    controller: 'TrainCtrl',
    // size: 'sm',
    resolve: {
      model: jasmine.any(Function)
    }
  };

  var uploadOptions = {
    animation: true,
    templateUrl: 'app/modals/upload/upload.html',
    windowTemplateUrl: 'app/modals/main-template.html',
    controller: 'uploadCtrl',
    // size: 'sm',
    resolve: {
      model: jasmine.any(Function),
      fileOptions: jasmine.any(Function)
    }
  };

  beforeEach(inject(function(_$q_, _$rootScope_, _$httpBackend_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, _$rootScope_, _$modal_, $sce, _statuses_, _fileTypes_, _Alerts_) {
    $scope = $rootScope.$new();
    $modal = _$modal_;
    statuses = _statuses_;
    fileTypes = _fileTypes_;
    Alerts = _Alerts_;


    mockClone = {
      name: 'clone',
      description: 'I am a cloned model...',
      unconfirmed: true,
      domain: 'news'
    };

    spyOn(mockProfiles, 'getBaseModels').and.callThrough();
    spyOn(mockProfiles, 'loadProjects').and.callThrough();
    spyOn(mockProfiles, 'loadModels').and.callThrough();
    spyOn(mockProfiles, 'createModel').and.callThrough();
    spyOn(mockProfiles, 'deleteModel').and.callThrough();
    spyOn(mockProfiles, 'cloneModel').and.callThrough();
    spyOn(mockProfiles, 'undoClone').and.callThrough();
    spyOn(mockProfiles, 'confirmClone').and.callThrough();
    spyOn(mockProfiles, 'train').and.callThrough();
    spyOn(mockProfiles, 'translate').and.callThrough();
    spyOn(mockProfiles, 'update').and.callThrough();
    spyOn(mockProfiles, 'poll').and.callThrough();

    spyOn(mockUpload, 'upload').and.callThrough();
    spyOn(mockFile, 'delete').and.callThrough();

    spyOn(Alerts, 'publish').and.callThrough();

    spyOn($modal, 'open').and.callFake(function(options) {
      modalOptions = options;
      return mockModal;
    });

    customModels = [{
      custom_model_id: '1',
      name: 'customModel',
      description: 'I am a custom model ...',
      trained_model_id: 'UNTRAINED',
      base_model_id: 'news-enus-eses',
      domain: 'news',
      source: 'en',
      target: 'es',
      file_batch_id: 'NPR',
      selected_batch_id: 'NPR News copySelectedBatchId',
      status: statuses.filesLoaded,
      status_date: Date.now(),
      files: [{name: 'file1.tmx'}, {name: 'file2.tmx'}]
    }];

    var project = {
      name: 'mockProjectOne',
      source: customModels[0].source,
      target: customModels[0].target,
      domain: customModels[0].domain,
      models: customModels,
      lastUpdated: customModels[0].status_date
    };

    ModelsCtrl = $controller('ModelsCtrl', {
      $scope: $scope,
      $modal: $modal,
      $sce: $sce,
      Profiles: mockProfiles,
      File: mockFile,
      Upload: mockUpload,
      project: project,
      access: access,
      fileTypes: fileTypes,
      Alerts: Alerts
    });

    spyOn($scope, 'updateModel').and.callThrough();
  }));

  beforeEach(function() {
      mockProjects = {
          mockProject: {
            name: 'mockProjectOne',
            source: customModels[0].source,
            target: customModels[0].target,
            domain: customModels[0].domain,
            models: customModels,
            lastUpdated: customModels[0].status_date
          },
          mockProjectTwo: {
            name: 'mockProjectTwo',
            domain: 'news',
            model_id: 'com.ibm.mt.models.es-en-news',
            source: 'es',
            target: 'en',
            models: [{
              base_model_id: 'com.ibm.mt.models.es-en-news',
              custom_model_id: '2c80fa477af198d55d746f8b6e3b0be8',
              description: '',
              domain: 'news',
              file_batch_id: '2c80fa477af198d55d746f8b6e3b0be7BatchId',
              name: 'mockModelTwo',
              project: 'mockProjectTwo',
              source: 'es',
              status: 'CREATED',
              status_date: '2015-08-07T08:53:48.754Z',
              target: 'en',
              trained_model_id: 'UNTRAINED'
            }]
          }
      };

      deferredProjects.resolve(mockProjects);
      $rootScope.$apply();
  });

  describe('Models', function() {

    afterEach(function() {
      $scope.models = [];
    });

    it('should create a new model', function() {
      expect($scope.models.length).toEqual(1);

      $scope.newModel();
      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].name).toEqual('');
      expect($scope.models[1].description).toEqual('');
      expect($scope.models[1].newModel).toBeTruthy();
    });

    it('should not confirm a new model without a name', function() {
      expect($scope.models.length).toEqual(1);

      $scope.newModel();
      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].newModel).toBeTruthy();

      $scope.confirmModel();

      expect(mockProfiles.createModel).not.toHaveBeenCalled();
      expect($scope.models.length).toEqual(2);
    });

    it('should confirm a new model', function() {
      expect($scope.models.length).toEqual(1);

      $scope.newModel();
      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].newModel).toBeTruthy();

      $scope.models[1].name = 'New model';
      $scope.confirmModel();

      expect(mockProfiles.createModel).toHaveBeenCalled();
      expect($scope.models.length).toEqual(3);

      deferred.resolve();
      $rootScope.$apply();

      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].newModel).toBeFalsy();
    });

    it('should not confirm a model with a used name', function() {
      expect($scope.models.length).toEqual(1);

      $scope.newModel();
      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].newModel).toBeTruthy();

      $scope.models[1].name = $scope.models[0].name;

      $scope.confirmModel();
      expect(mockProfiles.createModel).not.toHaveBeenCalled();
      expect($scope.models[1].newModel).toBeTruthy();
    });

    it('should not confirm a model with a name longer than 32 characters', function() {
      expect($scope.models.length).toEqual(1);

      $scope.newModel();
      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].newModel).toBeTruthy();

      $scope.models[1].name = '123456789012345678901234567890123'; // 33 chars

      $scope.confirmModel();
      expect(mockProfiles.createModel).not.toHaveBeenCalled();
      expect($scope.models[1].newModel).toBeTruthy();
    });

    it('should confirm a new model with no editName variable', function() {
      expect($scope.models.length).toEqual(1);

      $scope.newModel();
      expect($scope.models.length).toEqual(2);
      expect($scope.models[1].newModel).toBeTruthy();
      expect($scope.models[1].editName).toBeTruthy();

      $scope.models[1].name = 'New model';
      $scope.confirmModel();

      expect(mockProfiles.createModel).toHaveBeenCalled();
      expect(mockProfiles.createModel.calls.mostRecent().args[0].editName).toBeUndefined();
    });

    it('should clone a model', function () {
      $scope.clone($scope.models[0]);
      expect(mockProfiles.cloneModel).toHaveBeenCalledWith($scope.models[0]);
    });

    it('should confirm a cloned models name', function () {
      $scope.models.push(mockClone);
      $scope.selectedModel = mockClone;
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect(mockProfiles.confirmClone).toHaveBeenCalled();
    });

    it('should not confirm a cloned model with a used name', function () {
      $scope.models.push(mockClone);
      $scope.selectedModel = mockClone;
      $scope.selectedModel.name = $scope.models[0].name;
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect(mockProfiles.confirmClone).not.toHaveBeenCalled();
    });

    it('should not confirm a cloned model with a name longer than 32 characters', function () {
      $scope.models.push(mockClone);
      $scope.selectedModel = mockClone;
      $scope.selectedModel.name = '123456789012345678901234567890123'; // 33 chars
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect(mockProfiles.confirmClone).not.toHaveBeenCalled();
    });

    it('should not allow a user to clone or delete a model when existing model is unconfirmed', function () {
      $scope.models.push(mockClone);
      $scope.selectedModel = mockClone;

      $scope.selectedModel.status = $scope.statuses.training;
      expect($scope.disableButton('clone')).toBe(true);
      expect($scope.disableButton('delete')).toBe(true);
      mockProfiles.confirmClone(mockClone);

      deferred.resolve();
      $rootScope.$apply();

      expect(mockProfiles.confirmClone).toHaveBeenCalled();
      expect($scope.disableButton('clone')).toBe(false);
      expect($scope.disableButton('delete')).toBe(true);

      $scope.selectedModel.status = $scope.statuses.trained;
      expect($scope.disableButton('delete')).toBe(false);
    });

    it('an alert should be issued if cloning an unconfirmed model', function () {
      $scope.clone($scope.models[0]);
      $rootScope.$apply();
      expect(Alerts.publish).not.toHaveBeenCalled();

      $scope.clone($scope.models[0]);
      $rootScope.$apply();

      expect(Alerts.publish).toHaveBeenCalled();
      Alerts.publish.calls.reset();

      mockProfiles.confirmClone($scope.models[0], access);
      $rootScope.$apply();

      $scope.clone($scope.models[0]);
      $rootScope.$apply();
      expect(Alerts.publish).not.toHaveBeenCalled();

    });

    it('should edit a models name', function () {
      $scope.models[0].editName = true;

      $scope.selectedModel = $scope.models[0];
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect($scope.models[0].editName).toBeUndefined();
      expect($scope.updateModel).toHaveBeenCalled();
    });

    it('should not confirm an edited model with a used name', function () {
      // add new model
      $scope.newModel();
      $scope.models[1].name = 'New_model';
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      // edit model name
      $scope.models[1].editName = true;
      $scope.models[1].name = $scope.models[0].name;

      $scope.selectedModel = $scope.models[1];
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect($scope.models[1].editName).toBeTruthy();
      expect($scope.updateModel).not.toHaveBeenCalled();
    });

    it('should not confirm an edited model with a name over 32 characters', function () {
      // edit model name
      $scope.models[0].editName = true;
      $scope.models[0].name = '123456789012345678901234567890123'; // 33 chars

      $scope.selectedModel = $scope.models[0];
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect($scope.models[0].editName).toBeTruthy();
      expect($scope.updateModel).not.toHaveBeenCalled();
    });

    it('should edit a models description', function () {
      $scope.models[0].editDesc = true;

      $scope.selectedModel = $scope.models[0];
      $scope.confirmModel();

      deferred.resolve();
      $rootScope.$apply();

      expect($scope.models[0].editDesc).toBeUndefined();
      expect($scope.updateModel).toHaveBeenCalled();
    });

    it('should do nothing if confirmModel is called without edit variable set', function() {
      delete $scope.models[0].unconfirmed;
      delete $scope.models[0].edited;

      $scope.confirmModel();
      expect(mockProfiles.confirmClone).not.toHaveBeenCalled();
      expect($scope.updateModel).not.toHaveBeenCalled();
    });

    it('should dismiss a train modal', function () {
      $scope.trainModel($scope.models[0]);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(trainOptions);
      expect(modalOptions.resolve.model()).toEqual($scope.models[0]);

      $scope.modalInstance.dismiss();
      expect($scope.modalInstance).toBeUndefined();
    });

    it('should train a model', function () {
      $scope.trainModel($scope.models[0]);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(trainOptions);

      $scope.modalInstance.close();
      expect(mockProfiles.train).toHaveBeenCalledWith($scope.models[0], access);

      expect($scope.models[0].status).toEqual(statuses.training); // set status before resolve

      deferred.resolve({status: statuses.training});
      $rootScope.$apply();

      expect($scope.models[0].status).toEqual(statuses.training);
    });

    it('should poll a training model', function () {
      $scope.trainModel($scope.models[0]);
      $scope.modalInstance.close();

      deferred.resolve({status: statuses.training});
      $rootScope.$apply();

      expect(mockProfiles.poll).toHaveBeenCalledWith($scope.models[0], access);
    });

    it('should generate an alert when training fails', function () {
      Alerts.clear();
      $scope.trainModel($scope.models[0]);
      $scope.modalInstance.close();

      var alertMsg = "This has failed";

      // Resolve the training promise
      deferred.resolve($scope.models[0]);
      $rootScope.$apply();

      // Resolve the polling promise.
      deferred.resolve({status: statuses.warning, status_detail: alertMsg});
      $rootScope.$apply();

      // Ensure we call the polling
      expect(mockProfiles.poll).toHaveBeenCalledWith($scope.models[0], access);
      expect(Alerts.count()).toEqual(1);
    });

    it('should not generate an alert when training is successful', function () {
      Alerts.clear();
      $scope.trainModel($scope.models[0]);
      $scope.modalInstance.close();

      // Resolve the training promise
      deferred.resolve($scope.models[0]);
      $rootScope.$apply();

      // Resolve the polling promise.
      deferred.resolve({status: statuses.trained});
      $rootScope.$apply();

      // Ensure we call the polling
      expect(mockProfiles.poll).toHaveBeenCalledWith($scope.models[0], access);
      expect(Alerts.count()).toEqual(0);
    });

    it('should update the date of a model', function () {
      var files = $scope.models[0].files;

      $scope.updateModel($scope.models[0]);
      expect(mockProfiles.update).toHaveBeenCalledWith($scope.models[0], undefined, access);

      deferred.resolve({
        status: $scope.models[0].status,
        status_date: $scope.models[0].status_date
      });
      $rootScope.$apply();

      expect($scope.models[0].files).not.toBeUndefined();
      expect($scope.models[0].files).toEqual(files);
    });

    it('should update the status of a model', function () {
      var status = 'new status';

      $scope.updateModel($scope.models[0], status);
      expect(mockProfiles.update).toHaveBeenCalledWith($scope.models[0], status, access);

      deferred.resolve({
        status: status,
        status_date: $scope.models[0].status_date
      });
      $rootScope.$apply();

      expect($scope.models[0].status).toEqual(status);
    });

    it('should dismiss deleting a model', function () {
      $scope.deleteModel($scope.models[0]);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(deleteOptions);

      $scope.modalInstance.dismiss();
      expect($scope.modalInstance).toBeUndefined();
    });

    it('should delete a model', function () {
      expect($scope.models.length).toBe(1);

      $scope.deleteModel($scope.models[0]);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(deleteOptions);
      expect(modalOptions.resolve.deleted()).toEqual($scope.models[0]);

      $scope.modalInstance.close($scope.models[0]);

      deferred.resolve();
      $rootScope.$apply();

      expect(mockProfiles.deleteModel).toHaveBeenCalled();
    });

    it('should delete a new model without confirmation', function () {
      expect($scope.models.length).toBe(1);

      // add new model
      $scope.newModel();
      expect($scope.models.length).toBe(2);

      // delete new model
      $scope.deleteModel($scope.models[1]);

      expect($scope.modalInstance).toBeUndefined();
      expect($scope.models.length).toBe(1);
    });

    it('should delete an unconfirmed cloned model', function () {
      expect($scope.models.length).toBe(1);

      // mock cloning model
      $scope.models.push(mockClone);
      $scope.selectedModel = mockClone;
      expect($scope.models.length).toBe(2);

      // delete clone before confirming name
      $scope.deleteModel($scope.models[1]);

      expect($scope.modalInstance).toBeUndefined();
      expect($scope.models.length).toBe(1);
      expect(mockProfiles.undoClone).toHaveBeenCalled();
    });

    it('should translate a model', function () {
      $scope.translate(textToTranslate, $scope.models[0]);

      deferred.resolve({
        text: textToTranslate,
        translation: translatedText
      });
      $rootScope.$apply();

      expect($scope.textToTranslate).toBe(textToTranslate);
      expect($scope.translation).toBe(translatedText);
    });

    it('should reset the translation text', function () {
      $scope.textToTranslate = 'something';
      $scope.translation = 'something else';

      $scope.resetTranslation();

      expect($scope.textToTranslate).toBeUndefined();
      expect($scope.translation).toBeUndefined();
    });

    it('should check a model name for invalid characters', function () {
      $scope.selectedModel.name = 'valid_name';
      var valid = $scope.checkName();
      expect(valid).toBeTruthy();

      $scope.selectedModel.name = 'valid_name_valid_name_valid_name';
      valid = $scope.checkName();
      expect(valid).toBeTruthy();

      $scope.selectedModel.name = 'invalid_name!!';
      valid = $scope.checkName();
      expect(valid).toBeFalsy();

      $scope.selectedModel.name = 'invalid_name_invalid_name_invalid';
      valid = $scope.checkName();
      expect(valid).toBeFalsy();
    });
  });

  describe('Files', function() {

    it('should add files to existing model', function () {
      var elem = {
        files: [{name: 'newFile1.tmx'}]
      };

      $scope.addFiles(elem);

      expect($scope.models[0].newFiles.length).toBe(1);
      expect($scope.models[0].newFiles[0].name).toBe('newFile1.tmx');
      expect($scope.models[0].newFiles[0].progress).toBe(0);
      expect($scope.models[0].newFiles[0].option).toBe('Select a document type');
      expect($scope.uploadingFiles).toBeFalsy();
    });

    it('should add files from drag and drop array', function() {
      var files = [{name: 'newFile1.tmx'}];
      $scope.addFiles(files);

      expect($scope.models[0].newFiles.length).toBe(1);
      expect($scope.models[0].newFiles[0].name).toBe('newFile1.tmx');
      expect($scope.models[0].newFiles[0].progress).toBe(0);
      expect($scope.models[0].newFiles[0].option).toBe('Select a document type');
      expect($scope.uploadingFiles).toBeFalsy();
    });

    it('should upload files after selecting file types', function() {
      var files = [{name: 'newFile1.tmx'}];
      $scope.addFiles(files);

      expect($scope.models[0].newFiles.length).toBe(1);

      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(uploadOptions);

      $scope.modalInstance.close($scope.models[0]);
      expect($scope.models[0].files[2].name).toBe(files[0].name);
    });

    it('should check model has files array when adding files', function () {
      var elem = {
        files: [{name: 'newFile1.tmx'}]
      };

      delete $scope.models[0].files;

      $scope.addFiles(elem);

      expect($scope.models[0].files.length).toBe(0);
    });

    it('should not add files to non-existant model', function () {
      var elem = {
        files: [{name: 'newFile1.tmx'}]
      };
      delete $scope.selectedModel;
      $scope.addFiles(elem);

      expect($scope.updateModel).not.toHaveBeenCalled();
      expect($scope.models[0].files.length).toBe(2);
      expect($scope.models[0].files).not.toContain('newFile1.tmx');
    });

    it('should add multiple files', function () {
      var elem = {
        files: [{name: 'newFile1.tmx'}, {name: 'newFile2.tmx'}, {name: 'newFile3.tmx'}]
      };
      $scope.addFiles(elem);

      expect($scope.models[0].newFiles.length).toBe(3);
      expect($scope.models[0].newFiles[0].name).toBe('newFile1.tmx');
      expect($scope.models[0].newFiles[1].name).toBe('newFile2.tmx');
      expect($scope.models[0].newFiles[2].name).toBe('newFile3.tmx');
    });

    it('should not add a duplicate file', function() {
      var elem = {
        files: [{name: files[0].file_name}]
      };
      $scope.addFiles(elem);

      expect($scope.models[0].files.length).toBe(2);
    });

    it('should not add two files with the same name', function() {
      var elem = {
        files: [{name: 'newFile1.tmx'}, {name: 'newFile1.tmx'}]
      };
      $scope.addFiles(elem);

      expect($scope.models[0].files.length).toBe(2);
    });

    it('should add files back into model on update', function () {
      var files = $scope.models[0].files;
      $scope.updateModel($scope.models[0]);

      deferred.resolve({
        status: $scope.models[0].status,
        status_date: $scope.models[0].status_date
      });
      $rootScope.$apply();

      expect(mockProfiles.update).toHaveBeenCalledWith($scope.models[0], undefined, access);
      expect($scope.models[0].files).toBe(files);
    });

    it('should dismiss deleting a file', function () {
      $scope.deleteFile({name: files[0].file_name}, $scope.models[0]);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(deleteOptions);

      $scope.modalInstance.dismiss();
      expect($scope.modalInstance).toBeUndefined();
    });

    it('should delete a file', function () {
      $scope.deleteFile({name: files[0].file_name}, $scope.models[0]);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(deleteOptions);
      expect(modalOptions.resolve.deleted().name).toEqual(files[0].file_name);

      var file = {
        name: files[0].file_name
      };

      $scope.modalInstance.close(file);

      deferred.resolve();
      fileDeferred.resolve();
      $rootScope.$apply();

      expect(mockFile.delete).toHaveBeenCalled();
      expect($scope.updateModel).toHaveBeenCalled();
      expect($scope.models[0].files.length).toBe(1);
    });

    it('should throw an error if deleting a non-existant file', function() {
      var elem = {
        id: $scope.models[0].custom_model_id,
        files: [{name: files[0].file_name}]
      };
      $scope.addFiles(elem);

      expect($scope.models[0].files.length).toBe(2);
    });
  });
});
