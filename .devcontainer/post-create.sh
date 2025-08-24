#!/bin/bash

# Update npm, image version is obsolete
npm install -g npm@11.5.2

# Install global dependencies
npm install -g vite@7.1.3 nodemon@3.1.10 prettier

# "dirty" indicator that tells you whether or not there are uncommitted changes
git config devcontainers-theme.show-dirty 1


