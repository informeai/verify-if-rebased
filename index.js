const core = require('@actions/core');
const github = require('@actions/github');
const command = require('@actions/exec');
async function run(){
    try {
        const eventName = github.context.eventName;
        const defaultBranch = core.getInput('default-branch');
        const pullRequestBranch = core.getInput('pull-request-branch');
        const ghToken = core.getInput('gh-token');
        const octokit = github.getOctokit(ghToken)
        if(eventName == 'pull_request'){
            if(!defaultBranch.length) {
                core.setFailed('Default Branch invalid')
            }
            if(!pullRequestBranch.length) {
                core.setFailed('Pull Request Branch invalid')
            }
            if(!ghToken.length) {
                core.setFailed('Token is required')
            }
            const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
            })
            const headCommit = defaultBranchCommit.data.sha
            const prCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits?sha=${pullRequestBranch}&per_page=100`,{
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
            })

            const allCommits = prCommits.data.map((c)=> c.sha)
            const pr = github.context.payload.pull_request.number
            if(github.context.payload.pull_request.number) core.setOutput('pr-number',github.context.payload.pull_request.number)
            await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
            await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])

            if (allCommits.includes(headCommit)){
                await command.exec('gh',['pr','edit',`${pr}`,'--add-label="is-rebased"','--remove-label="not-rebased"'])
                core.setOutput('rebased',true)
            }else{
                await command.exec('gh',['pr','edit',`${pr}`,'--add-label="not-rebased"','--remove-label="is-rebased"'])
                core.setOutput('rebased',false)
            }
    
        }
        else if(eventName == 'push'){
            const reactive = core.getBooleanInput('reactive');
            const ref = github.context.ref
            if(reactive && ref.includes(defaultBranch)){
                if(!defaultBranch.length) {
                    core.setFailed('Default Branch invalid')
                }
                const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo
                })
                const headCommit = defaultBranchCommit.data.sha
                const resultPRS = await octokit.request(`GET /repos/{owner}/{repo}/pulls`,{
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo
                })
                const allPrsBranches = resultPRS.data.map((p) =>{
                    return {
                        ref: p.head.ref,
                        number: p.number
                    }
                })

                await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
                await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])

                await Promise.allSettled(allPrsBranches.map(async(branch)=>{
                    const prCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits?sha=${branch.ref}&per_page=100`,{
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo
                    })
                    const allCommits = prCommits.data.map((c)=> c.sha)
                    if (allCommits.includes(headCommit)){
                        await command.exec('gh',['pr','edit',`${branch.number}`,'--add-label="is-rebased"','--remove-label="not-rebased"'])
                    }else{
                        await command.exec('gh',['pr','edit',`${branch.number}`,'--add-label="not-rebased"','--remove-label="is-rebased"'])
                    }
                    
                }))

            }
        }
    } catch (error) {
      core.setFailed(error.message);
    }
}

run()