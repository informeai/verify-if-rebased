const core = require('@actions/core');
const github = require('@actions/github');

try {
    const defaultBranch = core.getInput('default-branch');
    const pullRequestBranch = core.getInput('pull-request-branch');
    const ghToken = core.getInput('gh-token');
    if(!defaultBranch.length) {
        core.error('Default Branch invalid')
    }
    if(!pullRequestBranch.length) {
        core.error('Pull Request Branch invalid')
    }
    if(!ghToken.length) {
        core.error('Token invalid')
    }
    const octokit = github.getOctokit(ghToken)
    
    console.log(`Default Branch - ${defaultBranch}`);
    console.log(`Pull Request Branch - ${pullRequestBranch}`);
    console.log(`Token - ${ghToken}`);
} catch (error) {
  core.setFailed(error.message);
}