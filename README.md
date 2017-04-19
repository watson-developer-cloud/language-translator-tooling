# Watson Language Translator Tool

[![Build Status](https://travis.ibm.com/WatsonTooling/ibmwatson-lt-ui.svg?token=B7Y1SpycTfLEEa2GTrnZ&branch=open-source)](https://travis.ibm.com/WatsonTooling/ibmwatson-lt-ui)

Watson Language Translator Tool allows users to model and train the [Watson Translator](https://console.ng.bluemix.net/catalog/services/language-translator/) service instances. This is for customizing the watson instances further to its basic translation abilities.

Please refer to [Watson Tooling document](http://www.ibm.com/watson/developercloud/doc/language-translator/tooling.shtml) to understand the modelling and usage of Watson tool.

## Requirements

* [Node v6.9.5 LTS](https://nodejs.org/en/blog/release/v6.9.1/) or greater
* [npm update to 4.2.0](https://docs.npmjs.com/getting-started/installing-node) or greater
* [yarn](https://yarnpkg.com/lang/en/docs/install/#mac-tab)
* An instance of [Watson Translator](https://console.ng.bluemix.net/catalog/services/language-translator/) on Bluemix with "Advanced Plan"

## Building and Installing

Run `yarn`
and then
Run `yarn run start-grunt` first for building, then `yarn run run-server` for preview on port 9000.

Fetch the credentials from Watson Tranlator instance created on Bluemix to log into the tool. [Refer](http://www.ibm.com/watson/developercloud/doc/language-translator/tooling.shtml#credentials) this section.

## Project Structure

**Overview**

    ├── client
    │   ├── app                 - All of our app specific components go in here
    │   ├── assets              - Custom assets: fonts, images, etc…
    │   ├── components          - Our reusable components, non-specific to to our app
    │
    ├── e2e                     - Our protractor end to end tests
    │
    └── server
        ├── api                 - Our apps server api
        ├── auth                - For handling authentication with different auth strategies
        ├── components          - Our reusable or app-wide components
        ├── config              - Where we do the bulk of our apps configuration
        │   └── local.env.js    - Keep our environment variables out of source control
        │   └── environment     - Configuration specific to the node environment
        └── views               - Server rendered views

**Contacts**

* Steven R Loomis  : srloomis@us.ibm.com 1-720-342-4930
* Parth Gaglani : gaglani@ca.ibm.com 647-770-9365
