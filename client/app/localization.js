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

angular.module('localization', [])
  .config(['$translateProvider', function ($translateProvider) {
	var enBundle = __inline(nls/en.json);
	var deBundle = __inline(nls/de.json);
	var esBundle = __inline(nls/es.json);
	var frBundle = __inline(nls/fr.json);
	var itBundle = __inline(nls/it.json);
	var jaBundle = __inline(nls/ja.json);
	var koBundle = __inline(nls/ko.json);
	var ptBRBundle = __inline(nls/pt_BR.json);
	var zhBundle = __inline(nls/zh.json);
	var zhTWBundle = __inline(nls/zh_TW.json);
	$translateProvider.translations('en', enBundle);
	$translateProvider.translations('de', deBundle);
	$translateProvider.translations('es', esBundle);
	$translateProvider.translations('fr', frBundle);
	$translateProvider.translations('it', itBundle);
	$translateProvider.translations('ja', jaBundle);
	$translateProvider.translations('ko', koBundle);
	$translateProvider.translations('pt_BR', ptBRBundle);
	$translateProvider.translations('zh', zhBundle);
	$translateProvider.translations('zh_TW', zhTWBundle);
    $translateProvider.registerAvailableLanguageKeys(['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt_BR', 'zh', 'zh_TW'], {
    	"en_*": 'en',
    	"de_*": 'de',
    	"es_*": 'es',
    	"fr_*": 'fr',
    	"it_*": 'it',
    	"ja_*": 'ja',
    	"ko_*": 'ko',
    	"zh_CN": 'zh'
    });
    // use browser local list if it's available
    if (navigator.languages) {
    	$translateProvider.determinePreferredLanguage();
    } else {
        $translateProvider.preferredLanguage(window.navigator.userLanguage || window.navigator.language);
    }
	$translateProvider.fallbackLanguage('en');

  var language = null;
	if(window.navigator.languages && window.navigator.languages.length > 0) {
    language = window.navigator.languages[0];
	} else {
    language = window.navigator.userLanguage || window.navigator.language;
	}
  document.documentElement.setAttribute('lang', language);

  // set locale of moment
  moment.locale(language);

}]);
