#!/bin/sh -l
echo "Set PR number"
echo "pr-number=${{github.event.pull_request.number}}" >> GITHUB_OUTPUT
echo "Rebased"
echo "rebased=true" >> GITHUB_OUTPUT