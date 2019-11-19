const os = require('os');
const fs = require('fs-extra')
const path = require('path');
const chalk = require('chalk')

const { githubClone, resetGithubClone, updateGithubClone } = require('./github');
const { isOnline } = require('./utilities');

const updateTemplate = async function ({ tmpdir }) {
// async updateTemplate ({ tmpdir }) {
  const repository = 'https://github.com/newrelic/open-source-tools';
  const targetFolder = 'open-source-tools';
  const templateDirectory = path.join(tmpdir, targetFolder)

  const exists = fs.existsSync(templateDirectory);

  if (!exists) {
    await githubClone({ tmpdir, repository, targetFolder });
  }

  if (exists) {
    await resetGithubClone({ tmpdir, targetFolder });
    await updateGithubClone({ tmpdir, targetFolder });
  }

  return templateDirectory
}

 /*
  * If we're offline, use a local folder as the "template"
  * #BecauseIBuiltThisOnAPlane
  */
const getTemplateDirectory = async function ({ localTemplateDirectory }) {
// async getTemplateDirectory ({ localTemplateDirectory }) {
  const tmpdir = os.tmpdir();
  const isOffline = !await isOnline();

  let templateDirectory;

  if (isOffline && localTemplateDirectory){
    console.log(chalk.yellow("Offline, attempting to load template from passed in directory"));
    const repositoryDirectory = localTemplateDirectory;
    templateDirectory = path.join(repositoryDirectory, 'nerdpacks', 'oss-template');
  } else {
    console.log(chalk.yellow("Online, loading template from cloned git repository"));
    // Clone from Github a copy of our open-source-tools nerdpack template to user's specified directory
    const repositoryDirectory = await updateTemplate({ tmpdir });
    templateDirectory = path.join(repositoryDirectory, 'nerdpacks', 'oss-template');  
  }

  return templateDirectory;
}

module.exports = {
  getTemplateDirectory
}