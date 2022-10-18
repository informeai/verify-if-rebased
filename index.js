const core = require('@actions/core');
const github = require('@actions/github');
const command = require('@actions/exec');
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
            // console.log(`Token - ${ghToken}`);
            const octokit = github.getOctokit(ghToken)
            const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
              })
              const headCommit = defaultBranchCommit.data.sha
              console.log('headCommit: ', headCommit)
            const prCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits?sha=${pullRequestBranch}&per_page=100`,{
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
            })

            const allCommits = prCommits.data.map((c)=> c.sha)
            console.log('allCommits: ', allCommits)
            const pr = github.context.payload.pull_request.number
            console.log('pr number: ',pr)
            await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
            await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])
            // gh label create is-rebased --description "branch actual is rebased with default branch" --color 0E8A16 -f
            // gh label create not-rebased --description "branch actual is not rebased with default branch" --color B60205 -f

            if (allCommits.includes(headCommit)){
                console.log(true)
            }else{
                console.log(false)
            }
    
        }
    } catch (error) {
      core.setFailed(error.message);
    }
}

run()