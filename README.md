# Verify If Rebased
Action for verify if PR is rebased, and set labels to pr - (is-rebased/not-rebased)

## Usage
```
- uses: informeai/verify-if-rebased
  with:
    # Default branch of repository
    # param default - (github.event.repository.default_branch)
    default-branch: ''
    
    # Branch of pull request
    # param default - (github.event.pull_request.head.ref )
    pull-request-branch: ''
    
    # Token with credentials for repository
    # is required
    gh-token: ''

```