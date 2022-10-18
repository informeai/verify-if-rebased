const core = require('@actions/core');
const github = require('@actions/github');

try {
    const defaultBranch = core.getInput('default-branch');
    const pullRequestBranch = core.getInput('pull-request-branch');
    const ghToken = core.getInput('gh-token');
    console.log(`Default Branch - ${defaultBranch}!`);
    console.log(`Pull Request Branch - ${pullRequestBranch}!`);
    console.log(`Token - ${ghToken}!`);
    // core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}