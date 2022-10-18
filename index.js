const core = require('@actions/core');
const github = require('@actions/github');
const command = require('@actions/exec');

async function verifyInputs(core,defaultBranch, pullRequestBranch, ghToken){
    console.log('Verify inputs')
    if(!defaultBranch.length) {
        core.setFailed('Default Branch invalid')
    }
    if(!pullRequestBranch.length) {
        core.setFailed('Pull Request Branch invalid')
    }
    if(!ghToken.length) {
        core.setFailed('Token is required')
    }
}

async function getHeadCommit(github,defaultBranch){
    console.log('Get Head Commit')
    const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    })
    return defaultBranchCommit.data.sha
}

async function getPrCommits(pullRequestBranch){
    console.log('Get Commits from PR')
    const prCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits?sha=${pullRequestBranch}&per_page=100`,{
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    })

    return prCommits.data.map((c)=> c.sha)
}

async function createLabels(command){
    console.log('Create labels if not exist')
    await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
    await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])
    return
}

async function executeVerify(core,command,allCommits,headCommit){
    console.log('Execute verify in PR and set label')
    if (allCommits.includes(headCommit)){
        await command.exec('gh',['pr','edit',`${pr}`,'--add-label="is-rebased"','--remove-label="not-rebased"'])
        core.setOutput('rebased',true)
    }else{
        await command.exec('gh',['pr','edit',`${pr}`,'--add-label="not-rebased"','--remove-label="is-rebased"'])
        core.setOutput('rebased',false)
    }
    return
}

async function setPrNumberOutput(github,core){
    console.log('Set number pr to output')
    const pr = github.context.payload.pull_request.number
    if(github.context.payload.pull_request.number) core.setOutput('pr-number',github.context.payload.pull_request.number)
    return
}
async function run(){
    try {
        const eventName = github.context.eventName;
        const defaultBranch = core.getInput('default-branch');
        const pullRequestBranch = core.getInput('pull-request-branch');
        const ghToken = core.getInput('gh-token');
        const reactive = core.getBooleanInput('reactive');
        const octokit = github.getOctokit(ghToken)
        if(eventName == 'pull_request' && !reactive){
            console.log('Single mode active')
            await verifyInputs(core,defaultBranch,pullRequestBranch,ghToken)
            // if(!defaultBranch.length) {
            //     core.setFailed('Default Branch invalid')
            // }
            // if(!pullRequestBranch.length) {
            //     core.setFailed('Pull Request Branch invalid')
            // }
            // if(!ghToken.length) {
            //     core.setFailed('Token is required')
            // }
            // console.log('Get Head Commit')
            // const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
            //     owner: github.context.repo.owner,
            //     repo: github.context.repo.repo
            // })
            // const headCommit = defaultBranchCommit.data.sha
            const headCommit = await getHeadCommit(github,defaultBranch)
            // console.log('Get Commits from PR')
            // const prCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits?sha=${pullRequestBranch}&per_page=100`,{
            //     owner: github.context.repo.owner,
            //     repo: github.context.repo.repo
            // })

            // const allCommits = prCommits.data.map((c)=> c.sha)
            const allCommits = await getPrCommits(pullRequestBranch)

            // const pr = github.context.payload.pull_request.number
            // if(github.context.payload.pull_request.number) core.setOutput('pr-number',github.context.payload.pull_request.number)
            await setPrNumberOutput(github,core)
            await createLabels(command)
            await executeVerify(core,command,allCommits,headCommit)
            // console.log('Create labels if not exist')
            // await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
            // await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])
            
            // console.log('Execute verify in PR and set label')
            // if (allCommits.includes(headCommit)){
            //     await command.exec('gh',['pr','edit',`${pr}`,'--add-label="is-rebased"','--remove-label="not-rebased"'])
            //     core.setOutput('rebased',true)
            // }else{
            //     await command.exec('gh',['pr','edit',`${pr}`,'--add-label="not-rebased"','--remove-label="is-rebased"'])
            //     core.setOutput('rebased',false)
            // }
    
        }
        else if(eventName == 'push'){
            const ref = github.context.ref
            if(reactive && ref.includes(defaultBranch)){
                console.log('Reactive mode active')
                if(!defaultBranch.length) {
                    core.setFailed('Default Branch invalid')
                }
                console.log('Get Head Commit')
                const defaultBranchCommit = await octokit.request(`GET /repos/{owner}/{repo}/commits/${defaultBranch}`, {
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo
                })
                const headCommit = defaultBranchCommit.data.sha
                console.log('Get Prs from repo')
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
                console.log('Create labels if not exist')
                await command.exec('gh',['label','create','is-rebased','--description="branch actual is rebased with default branch"','--color=0E8A16','-f'])
                await command.exec('gh',['label','create','not-rebased','--description="branch actual is not rebased with default branch"','--color=B60205','-f'])
                console.log('Execute verify if rebased in all prs and set label')
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