#!/bin/bash

# Update npm, image version is obsolete
npm install -g npm@11.5.2

# Install global dependencies
npm install -g vite@7.1.3 nodemon@3.1.10 prettier

# "dirty" indicator that tells you whether or not there are uncommitted changes
git config devcontainers-theme.show-dirty 1
# prefer merge than rebase when pulling
git config pull.rebase false

# Configure git hooks
npm run prepare


sudo apt update

pushd /tmp 
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb 
sudo dpkg -i google-chrome-stable_current_amd64.deb 
sudo apt install --fix-broken -y
rm google-chrome-stable_current_amd64.deb
popd