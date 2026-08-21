#!/bin/bash

# "dirty" indicator that tells you whether or not there are uncommitted changes
git config devcontainers-theme.show-dirty 1
# prefer merge than rebase when pulling
git config pull.rebase false

# Configure git hooks
npm run prepare