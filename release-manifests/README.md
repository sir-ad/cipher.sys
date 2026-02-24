# Release Manifests

CIPHER uses separate release tracks for GitHub and npm.

## Files
- `github-track.json`: records the GitHub release run.
- `npm-track.template.json`: template for npm publish run.

## Required fields per run
- `channel`
- `version` or `version_target`
- `git_commit_sha`
- `date_utc`
