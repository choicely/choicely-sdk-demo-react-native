#!/usr/bin/env zsh
set -euo pipefail

npm install --no-audit --no-fund --progress=false

cd ios

rm -rf vendor/bundle .bundle
bundle config path vendor/bundle

bundle config set force_ruby_platform true

bundle lock --add-platform "$(ruby -e 'require "rubygems"; puts Gem::Platform.local')"

BUNDLE_FORCE_RUBY_PLATFORM=1 bundle install --path vendor/bundle

bundle exec ruby -e 'require "ffi"; puts "#{RUBY_PLATFORM} ffi=#{FFI::VERSION}"'

pod deintegrate

RCT_USE_PREBUILT_RNCORE=1 RCT_USE_RN_DEP=1 bundle exec pod install

rm -rf .build/DerivedData-iOS
