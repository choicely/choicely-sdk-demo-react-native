#!/usr/bin/env zsh
set -euo pipefail

cd ios

rm -rf vendor/bundle .bundle
bundle config path vendor/bundle

bundle config set force_ruby_platform true

bundle lock --add-platform "$(ruby -e 'require "rubygems"; puts Gem::Platform.local')"

BUNDLE_FORCE_RUBY_PLATFORM=1 bundle install --path vendor/bundle

bundle exec ruby -e 'require "ffi"; puts "#{RUBY_PLATFORM} ffi=#{FFI::VERSION}"'

bundle exec pod install
