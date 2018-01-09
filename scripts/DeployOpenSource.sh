#!/bin/sh

BLUEMIX_API_DEFAULT="https://api.ng.bluemix.net"
LT_SERVICE_NAME="Language Translator Instance Parth"
CLOUDANT_SERVICE_NAME="Cloudant for Language Translator Parth"
OBJECT_STORAGE_SERVICE_NAME="Object Storage for Language Translator Parth"
MONITORING_SERVICE_NAME="Monitoring for Language Translator Parth"
APP_NAME="Watson Language Translator Tooling Parth"
#APP_DOMAIN="ng.mybluemix.net"
APP_DOMAIN="mybluemix.net"
APP_HOST_NAME="lt-ui-opensource"
BLUEMIX_ORG="gaas"
BLUEMIX_SPACE="test"

SCRIPTDIR=$(dirname $0)
#Return to base directory of project
cd $SCRIPTDIR/..
: ${BLUEMIX_API:=$BLUEMIX_API_DEFAULT}

if [ -z ${BLUEMIX_ORG} ];
then echo "BLUEMIX_ORG must be set"; exit 1;
fi

if [ -z ${BLUEMIX_SPACE} ];
then echo "BLUEMIX_SPACE must be set"; exit 1;
fi

echo api endpoint is $BLUEMIX_API
cf api $BLUEMIX_API

echo BLUEMIX_ORG=${BLUEMIX_ORG}
echo BLUEMIX_SPACE=${BLUEMIX_SPACE}

cf login -o $BLUEMIX_ORG -s $BLUEMIX_SPACE

if [ $? -ne 0 ]
then echo "Exiting login failed "; exit 1;
fi

#Language Translator Service Instance

cf service "${LT_SERVICE_NAME}" --guid

if [ $? -ne 0 ]
then
  echo "Creating the Language Translator Service Instance";
  cf create-service language_translator standard "${LT_SERVICE_NAME}"
fi


#Cloudant Service Instance

cf service "${CLOUDANT_SERVICE_NAME}" --guid

if [ $? -ne 0 ]
then
  echo "Creating the Cloudant Instance for Language Translator Tooling";
  cf create-service cloudantNoSQLDB Shared "${CLOUDANT_SERVICE_NAME}"
fi

#ObjectStorage Service Instance

cf service "${OBJECT_STORAGE_SERVICE_NAME}" --guid

if [ $? -ne 0 ]
then
  echo "Creating the Object Storage instance for Language Translator Tooling";
  cf create-service objectstorage free "${OBJECT_STORAGE_SERVICE_NAME}"
fi

#Monitoring Service Instance

cf service "${MONITORING_SERVICE_NAME}" --guid

if [ $? -ne 0 ]
then
  echo "Creating the Monitoring service instance for Language Translator Tooling";
  cf create-service MonitoringAndAnalytics Free "${MONITORING_SERVICE_NAME}"
fi

#Build the UI
yarn
sudo npm install -g bower

bower install

yarn run start-grunt

cd dist

#now push our app
cf push "${APP_NAME}" -d "${APP_DOMAIN}" -p . -i 1 -c "NODE_ENV=production node server/start.js" -b sdk-for-nodejs --no-manifest --no-start -n "${APP_HOST_NAME}"

#now bind it to service instances
cf bind-service "${APP_NAME}" "${LT_SERVICE_NAME}"
cf bind-service "${APP_NAME}" "${CLOUDANT_SERVICE_NAME}"
cf bind-service "${APP_NAME}" "${OBJECT_STORAGE_SERVICE_NAME}"
cf bind-service "${APP_NAME}" "${MONITORING_SERVICE_NAME}"

#Set Environment Variables
cf set-env "${APP_NAME}" TRANSLATION_SERVICE_NAME "${LT_SERVICE_NAME}"
cf set-env "${APP_NAME}" CLOUDANT_SERVICE_NAME "${CLOUDANT_SERVICE_NAME}"
cf set-env "${APP_NAME}" OBJECT_STORAGE_SERVICE_NAME "${OBJECT_STORAGE_SERVICE_NAME}"
cf set-env "${APP_NAME}" FILE_STORAGE_URL "http://${APP_HOST_NAME}.${APP_DOMAIN}/api"

#Start the app
cf start "${APP_NAME}"
