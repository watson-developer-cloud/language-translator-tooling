# Language Translator Tooling [![Build Status](https://travis-ci.org/watson-developer-cloud/language-translator-tooling.svg?branch=master)](https://travis-ci.org/watson-developer-cloud/language-translator-tooling) [![Greenkeeper badge](https://badges.greenkeeper.io/watson-developer-cloud/language-translator-tooling.svg)](https://greenkeeper.io/)

#### demo: https://language-translator-tooling.mybluemix.net/login

This web application allows users to model and train [Language Translator](https://console.ng.bluemix.net/catalog/services/language-translator/) service instances.

Please refer to the [Language Translator documentation](https://www.ibm.com/watson/developercloud/doc/language-translator/index.html) to understand how to create taxonomy models and use this tool.

## Requirements

* [Node v6.9.5 LTS](https://nodejs.org/en/blog/release/v6.9.1/) or greater
* [npm update to 4.2.0](https://docs.npmjs.com/getting-started/installing-node) or greater
* [yarn](https://yarnpkg.com/lang/en/docs/install/#mac-tab)
* An instance of [Watson Translator](https://console.ng.bluemix.net/catalog/services/language-translator/) on Bluemix with "Advanced Plan"

## Building and Installing

Run `yarn`
and then
Run `yarn run start-grunt` first for building, then `yarn run run-server` for preview on port 9000.

Fetch the credentials from Watson Tranlator instance created on IBM Cloud to log into the tool. [Refer](https://console.bluemix.net/docs/services/watson/getting-started-credentials.html#getting-credentials-manually) this section.
Here `login-BlueGUID` refers to the ServiceGUID of your instance on IBM Cloud. This is found on url when you browse to your service instance https://console.bluemix.net/services/`{serviceGUID}`?ace_config=....

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

## License

This library is licensed under Apache 2.0. Full license text is available in
[COPYING][license].

[license]: http://www.apache.org/licenses/LICENSE-2.0
