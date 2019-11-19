const path = require('path');
const { spawnSync } = require('child_process');

// export async function githubClone ({ tmpdir, repository, targetFolder }) {
const githubClone = async function ({ tmpdir, repository, targetFolder }) {
  const command = 'git';
  const args = [ 'clone', repository, targetFolder ];
  const options = {
    cwd: tmpdir
  };

  const {error, status, stdout, stderr} = spawnSync(command, args, options);

  if (error || status !== 0) {
    throw new Error ("Error cloning template..." + stderr);
  }
}

// export async function resetGithubClone ({ tmpdir, targetFolder }) {
const resetGithubClone = async function ({ tmpdir, targetFolder }) {
  const command = 'git';
  const args = [ 'reset', '--hard', 'HEAD' ];
  const options = {
    cwd: path.join(tmpdir, targetFolder)
  };

  const {error, status, stdout, stderr} = spawnSync(command, args, options);

  if (error || status !== 0) {
    throw new Error ("Error resetting git repository to HEAD..." + stderr);
  }
}

// export async function updateGithubClone ({ tmpdir, targetFolder }) {
const updateGithubClone = async function ({ tmpdir, targetFolder }) {
  const command = 'git';
  const args = [ 'pull', 'origin', 'master' ];
  const options = {
    cwd: path.join(tmpdir, targetFolder)
  };

  const {error, status, stdout, stderr} = spawnSync(command, args, options);

  if (error || status !== 0) {
    throw new Error ("Error pull latest changes from Github clone..." + stderr);
  }
}

module.exports = {
  githubClone,
  resetGithubClone,
  updateGithubClone
}