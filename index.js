const core = require('@actions/core');
const github = require('@actions/github');

try {
    const defaultBranch = core.getInput('default-branch');
    const pullRequestBranch = core.getInput('pull-request-branch');
    const ghToken = core.getInput('gh-token');
    const eventName = core.getInput('event-name');
    if(!defaultBranch.length) {
        core.setFailed('Default Branch invalid')
    }
    if(!pullRequestBranch.length) {
        core.setFailed('Pull Request Branch invalid')
    }
    if(!ghToken.length) {
        core.setFailed('Token is required')
    }
    const octokit = github.getOctokit(ghToken)
    
    console.log(`Default Branch - ${defaultBranch}`);
    console.log(`Pull Request Branch - ${pullRequestBranch}`);
    console.log(`Token - ${ghToken}`);
    console.log('event: ', eventName)
} catch (error) {
  core.setFailed(error.message);
}