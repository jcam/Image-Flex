#!/bin/bash
#build.sh

sam build --use-container
mkdir -p target
cd .aws-sam/build/GetOrCreateImageFunction/
zip -r ../../../target/GetOrCreateImage.zip *
cd ../UriToS3KeyFunction/
zip -r ../../../target/UriToS3Key.zip *

