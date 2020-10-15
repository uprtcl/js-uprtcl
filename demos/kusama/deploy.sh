#!/bin/bash

env="$1"

# incase we want to have multiple stages in the future
if [ $env != "prd" ] && [ $env != "test" ] && [ $env != "dev" ]; then
  echo "Unknown env $env, valid envs are prd or test"
  exit 1
fi

# this is where we compress any JS and CSS files
rm -rf stage
mkdir stage

cp -r ./dist-pages/* ./stage

bucket="s3://uprtcl-frontend-$env"

echo $bucket;
# GZIP encode every css and js files then rename them to remove the .gz ext
find ./stage/*.js -exec gzip -9 {} \; -exec mv {}.gz {} \;
find ./stage/*.css -exec gzip -9 {} \; -exec mv {}.gz {} \;

# Add 1yr cache to Assets
aws s3 sync ./stage "$bucket" --include "*" --exclude "*.css" --exclude "*.js" --exclude "*.html" --cache-control "max-age=31536000"
# Add 1 year cache to CSS and JS
aws s3 sync ./stage "$bucket" --exclude "*" --include "*.js" --include "*.css" --content-encoding gzip --cache-control "max-age=31536000"
# Add 2min cache to main html file
aws s3 sync ./stage "$bucket" --exclude "*" --include "*.html" --cache-control "max-age=120"

rm -rf ./stage
