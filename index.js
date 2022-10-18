const core = require('@actions/core');
const github = require('@actions/github');

async function run(){
    try {
        const eventName = github.context.eventName;
        console.log('event: ', eventName)
        if(eventName == 'pull_request'){
            const defaultBranch = core.getInput('default-branch');
            const pullRequestBranch = core.getInput('pull-request-branch');
            const ghToken = core.getInput('gh-token');
            if(!defaultBranch.length) {
                core.setFailed('Default Branch invalid')
            }
            if(!pullRequestBranch.length) {
                core.setFailed('Pull Request Branch invalid')
            }
            if(!ghToken.length) {
                core.setFailed('Token is required')
            }
            console.log(`Default Branch - ${defaultBranch}`);
            console.log(`Pull Request Branch - ${pullRequestBranch}`);
            console.log(`Token - ${ghToken}`);
            const octokit = github.getOctokit(ghToken)
            const headCommit = await octokit.rest.git.getCommit({
                repo: github.context.repo
            })
            console.log('headCommit: ',headCommit)
            
    
        }
    } catch (error) {
      core.setFailed(error.message);
    }
}

run()