const core = require('@actions/core');
const github = require('@actions/github');
const command = require('@actions/exec');
async function run(){
    try {
        const eventName = github.context.eventName;
        console.log('event: ', eventName)
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
            // console.log(`Default Branch - ${defaultBranch}`);
            // console.log(`Pull Request Branch - ${pullRequestBranch}`);
            // console.log(`Token - ${ghToken}`);
            const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
            })
            const headCommit = defaultBranchCommit.data.sha
            // console.log('headCommit: ', headCommit)
            const prCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits?sha=${pullRequestBranch}&per_page=100`,{
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
            })

            const allCommits = prCommits.data.map((c)=> c.sha)
            // console.log('allCommits: ', allCommits)
            const pr = github.context.payload.pull_request.number
            if(github.context.payload.pull_request.number) core.setOutput('pr-number',github.context.payload.pull_request.number)
            // console.log('pr number: ',pr)
            await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
            await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])

            if (allCommits.includes(headCommit)){
                //gh pr edit ${{ github.event.pull_request.number}} --add-label "is-rebased" --remove-label "not-rebased"
                await command.exec('gh',['pr','edit',`${pr}`,'--add-label="is-rebased"','--remove-label="not-rebased"'])
                core.setOutput('rebased',true)
                // console.log(true)
            }else{
                //gh pr edit ${{ github.event.pull_request.number}} --add-label "not-rebased" --remove-label "is-rebased"
                await command.exec('gh',['pr','edit',`${pr}`,'--add-label="not-rebased"','--remove-label="is-rebased"'])
                core.setOutput('rebased',false)
                // console.log(true)
            }
    
        }
        if(eventName == 'push'){
            const reactive = core.getBooleanInput('reactive');
            console.log('reactive: ',reactive)
            const ref = github.context.ref
            console.log('ref: ',ref)
            if(reactive){
                if(!defaultBranch.length) {
                    core.setFailed('Default Branch invalid')
                }
                const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo
                })
                const headCommit = defaultBranchCommit.data.sha
                console.log('headCommit: ', headCommit)
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
                console.log('allPrsBranches: ',allPrsBranches)

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