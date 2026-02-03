#!/bin/bash
docker run --rm \
  -e GH_TOKEN="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" \
  -e REPO_URL="https://github.com/stephengpope/thepopebot.git" \
  -e BRANCH="job/test-3" \
  thepopebot
