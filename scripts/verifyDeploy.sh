#!/bin/bash
set -x
rm -f cookies.txt
url=https://lt-ci.mybluemix.net/api/authenticate
curl -v -c cookies.txt -b cookies.txt $url
csrftoken=$(grep XSRF cookies.txt | tr '\t' ' ' | tr -s " " | cut -d " " -f 7)
username="****"
password=****
curl -v -c cookies.txt -b cookies.txt -H "x-csrf-token: $csrftoken" -d "username=${username}&password=${password}" $url
