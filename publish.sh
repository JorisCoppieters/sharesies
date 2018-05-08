#!/bin/bash

if [[ $# -lt 1 ]]; then
  echo "Please specify a version";
  exit;
fi

NPM=npm
if [[ -e /usr/local/bin/npmme ]]; then
  NPM=/usr/local/bin/npmme
fi

VERSION=$1

function ask {
  read -r -p "$@ [y/N] " response
  case "$response" in
      [yY][eE][sS]|[yY])
          true
          ;;
      *)
          false
          ;;
  esac
}

echo "Updating version number in files..."
sed -i "s/\"version\": \".*\",/\"version\": \"$VERSION\",/g" package.json

if [[ `ask "Do you want to publish $VERSION?" && echo true` == true ]]; then
  echo "Running npm publish..."
  $NPM publish
  echo "Tagging revision..."
  git add .
  git commit -m "Set version to $VERSION"
  git tag -a v$VERSION -m "Published v$VERSION"
  git push origin v$VERSION
else
  echo "Ok...";
fi

