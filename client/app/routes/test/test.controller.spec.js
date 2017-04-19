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

describe('Controller: TestCtrl.', function () {

  // load the controller's module
  beforeEach(module('mtTrainingApp'));

  var deferredProjects,
      deferredTranslation,
      mockProjects,
      filterFilter,
      $q,
      $filter,
      $scope,
      $rootScope,
      createController;

  var access = 'tenant_id';

  var mockProfiles = {
    loadProjects: function() {
      deferredProjects = $q.defer();
      return deferredProjects.promise;
    },
    translate: function() {
      deferredTranslation = $q.defer();
      return deferredTranslation.promise;
    }
  };

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, _$rootScope_, _$q_, _$filter_, _statuses_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $q = _$q_;
    $filter = _$filter_;

    filterFilter = $filter('filter');

    spyOn(mockProfiles, 'loadProjects').and.callThrough();
    spyOn(mockProfiles, 'translate').and.callThrough();

    createController = function($stateParams) {

      if (!$stateParams) {
        $stateParams = {};
      }

      var testController =  $controller('TestCtrl', {
        $scope: $scope,
        Profiles: mockProfiles,
        statuses: _statuses_,
        access: access,
        $stateParams: $stateParams
      });

      deferredProjects.resolve(mockProjects);
      $rootScope.$apply();

      return testController;
    }
  }));

  beforeEach(function() {
    mockProjects = [{
      name: 'project 1',
      domain: 'news',
      source: 'en',
      target: 'fr',
      models: [{
        name: 'model_1',
        description: 'model_1 description',
        domain: 'news',
        source: 'en',
        target: 'fr',
        status: 'TRAINED',
        project: 'project 1',
        custom_model_id: '1'
      }, {
        name: 'model_2',
        description: 'model_2 description',
        domain: 'news',
        source: 'en',
        target: 'fr',
        status: 'FILESLOADED',
        project: 'project 1',
        custom_model_id: '2'
      }]
    }, {
      name: 'project 2',
      domain: 'patent',
      source: 'pt',
      target: 'es',
      models: [{
        name: 'model_3',
        description: 'model_3 description',
        domain: 'patent',
        source: 'pt',
        target: 'es',
        status: 'CREATED',
        project: 'project 2',
        custom_model_id: '3'
      }]
    }];
  });

  describe('Setup:', function() {

    it('should load models', function () {
      createController();
      expect($scope.projects).toEqual(mockProjects);
    });

    it('should select first model', function() {
      createController();
      expect($scope.selectedModel).toEqual($scope.projects[0].models[0]);
    });

    it('should select selected model if model specified in URL', function() {
      createController({modelName: mockProjects[0].models[1].name});
      expect($scope.selectedModel.name).toEqual($scope.projects[0].models[1].name);
    });
  });

  describe('Filter:', function() {
    beforeEach(function() {
      createController();
    });

    // filterProject
    it('should filter projects by name', function() {
      $scope.filterText = 'project 1';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    it('should filter projects by domain', function() {
      $scope.filterText = 'news';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    it('should filter projects by source', function() {
      $scope.filterText = 'english';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    it('should filter projects by target', function() {
      $scope.filterText = 'french';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    it('should filter projects by model name', function() {
      $scope.filterText = 'model_1';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    it('should filter projects by model description', function() {
      $scope.filterText = 'model_2 description';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    it('should filter projects by model status', function() {
      $scope.filterText = 'trained';
      var filtered = filterFilter($scope.projects, $scope.filterProject);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0]);
    });

    // filterModel
    it('should filter models by name', function() {
      $scope.filterText = 'model_2';
      var filtered = filterFilter($scope.projects[0].models, $scope.filterModel);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0].models[1]);

      filtered = filterFilter($scope.projects[1].models, $scope.filterModel);
      expect(filtered.length).toEqual(0);
    });

    it('should filter models by description', function() {
      $scope.filterText = 'model_1 description';
      var filtered = filterFilter($scope.projects[0].models, $scope.filterModel);
      expect(filtered.length).toEqual(1);
      expect(filtered[0]).toEqual(mockProjects[0].models[0]);

      filtered = filterFilter($scope.projects[1].models, $scope.filterModel);
      expect(filtered.length).toEqual(0);
    });

    it('should filter models by domain', function() {
      $scope.filterText = 'news';
      var filtered = filterFilter($scope.projects[0].models, $scope.filterModel);
      expect(filtered.length).toEqual(2);

      filtered = filterFilter($scope.projects[1].models, $scope.filterModel);
      expect(filtered.length).toEqual(0);
    });

    it('should filter models by source', function() {
      $scope.filterText = 'english';
      var filtered = filterFilter($scope.projects[0].models, $scope.filterModel);
      expect(filtered.length).toEqual(2);

      filtered = filterFilter($scope.projects[1].models, $scope.filterModel);
      expect(filtered.length).toEqual(0);
    });

    it('should filter models by target', function() {
      $scope.filterText = 'french';
      var filtered = filterFilter($scope.projects[0].models, $scope.filterModel);
      expect(filtered.length).toEqual(2);

      filtered = filterFilter($scope.projects[1].models, $scope.filterModel);
      expect(filtered.length).toEqual(0);
    });

    it('should filter models by status', function() {
      $scope.filterText = 'created';
      var filtered = filterFilter($scope.projects[0].models, $scope.filterModel);
      expect(filtered.length).toEqual(0);

      filtered = filterFilter($scope.projects[1].models, $scope.filterModel);
      expect(filtered.length).toEqual(1);
    });

  });

  describe('UI:', function() {
    beforeEach(function() {
      createController();
    });

    it('should select a new model', function() {
      expect($scope.selectedModel).not.toEqual($scope.projects[1].models[0]);

      $scope.select($scope.projects[1].models[0]);
      expect($scope.selectedModel).toEqual($scope.projects[1].models[0]);
    });

    it('should detect if a model is selected', function() {
      expect($scope.isSelected($scope.projects[0].models[1])).toBeFalsy();

      $scope.select($scope.projects[0].models[1]);
      expect($scope.isSelected($scope.projects[0].models[1])).toBeTruthy();
    });

  });

  describe('Translation:', function() {
    beforeEach(function() {
      createController();
    });

    it('should translate a model', function() {
      $scope.translate($scope.projects[0].models[0]);
      expect(mockProfiles.translate).toHaveBeenCalled();

      var translation = {
        text: 'text to translate',
        translation: 'translated text'
      };
      deferredTranslation.resolve(translation);
      $rootScope.$apply();

      expect($scope.textToTranslate).toEqual(translation.text);
      expect($scope.translation).toEqual(translation.translation);
    });

    it('should clear the translation', function() {
      $scope.textToTranslate = 'something';
      $scope.translation = 'something else';

      $scope.clearTranslation();

      expect($scope.textToTranslate).toBeFalsy();
      expect($scope.translation).toBeFalsy();
    });

    it('should reset the translation', function() {
      $scope.textToTranslate = 'something';
      $scope.translation = 'something else';

      $scope.resetTranslation();

      expect($scope.textToTranslate).toBeTruthy();
      expect($scope.translation).toBeFalsy();
    });

  });

});
