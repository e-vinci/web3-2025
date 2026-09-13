#!/bin/bash

# "dirty" indicator that tells you whether or not there are uncommitted changes
git config devcontainers-theme.show-dirty 1
# prefer merge than rebase when pulling
git config pull.rebase false

# Configure git hooks
npm run prepare

# ~/.claude is a named volume (see devcontainer.json "mounts") so Claude Code
# settings/chat history/memory survive container rebuilds. Docker creates the
# mount point as root on first use, and the top-level ~/.claude.json config
# file lives outside that volume by default — fix ownership, then relocate
# ~/.claude.json inside the volume and symlink it back so it persists too.
mkdir -p ~/.claude
sudo chown -R node:node ~/.claude
if [ -f ~/.claude.json ] && [ ! -L ~/.claude.json ]; then
  mv ~/.claude.json ~/.claude/claude.json
fi
ln -sf ~/.claude/claude.json ~/.claude.json