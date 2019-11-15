const {Command, flags} = require('@oclif/command')

const chalk = require('chalk')
const fs = require('fs-extra')

const os = require('os');
const path = require('path');

const { spawnSync } = require('child_process')

const Handlebars = require('handlebars');
const inquirer = require('inquirer');

function resolveHome(filepath) {
  if (filepath[0] === '~') {
      return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

class GenerateCommand extends Command {
  async run() {
    const { flags } = this.parse(GenerateCommand);

    const homeDir = os.homedir();
    const tmpdir = os.tmpdir();
    const currentDirectory = process.cwd();

    const destination = flags.destination ? resolveHome(flags.destination) : false || currentDirectory

    // Base the following on https://github.com/newrelic/open-source-tools
    const repositoryDirectory = await this.updateTemplate({ tmpdir });
    const templateDirectory = path.join(repositoryDirectory, 'nerdpacks', 'oss-template');

    // Copy to user's specified directory
    await this.copyNerdpackTemplate({ source: templateDirectory, destination: destination });
    await this.wizard({ source: templateDirectory, destination: destination });
  }

  async updateTemplate ({ tmpdir }) {
    const repository = 'https://github.com/newrelic/open-source-tools';
    const targetFolder = 'open-source-tools';
    const templateDirectory = path.join(tmpdir, targetFolder)

    const exists = fs.existsSync(templateDirectory);

    if (!exists) {
      await this.githubClone({ tmpdir, repository, targetFolder });
    }

    if (exists) {
      await this.resetGithubClone({ tmpdir, targetFolder });
      await this.updateGithubClone({ tmpdir, targetFolder });
    }

    return templateDirectory
  }

  async githubClone ({ tmpdir, repository, targetFolder }) {
    const command = 'git';
    const args = [ 'clone', repository, targetFolder ];
    const options = {
      cwd: tmpdir
    };

    const {error, status, stdout, stderr} = spawnSync(command, args, options);

    if (stdout) {
      this.log(chalk.cyan(stdout));
    }

    if (error || status !== 0) {
      throw new Error ("Error cloning template..." + stderr);
    }
  }

  async resetGithubClone ({ tmpdir, targetFolder }) {
    const command = 'git';
    const args = [ 'reset', '--hard', 'HEAD' ];
    const options = {
      cwd: path.join(tmpdir, targetFolder)
    };

    const {error, status, stdout, stderr} = spawnSync(command, args, options);

    // if (stdout) {
    //   this.log(chalk.cyan(stdout));
    // }

    if (error || status !== 0) {
      throw new Error ("Error resetting git repository to HEAD..." + stderr);
    }
  }

  async updateGithubClone ({ tmpdir, targetFolder }) {
    const command = 'git';
    const args = [ 'pull', 'origin', 'master' ];
    const options = {
      cwd: path.join(tmpdir, targetFolder)
    };

    const {error, status, stdout, stderr} = spawnSync(command, args, options);

    // if (stdout) {
    //   this.log(chalk.cyan(stdout));
    // }

    if (error || status !== 0) {
      throw new Error ("Error pull latest changes from Github clone..." + stderr);
    }
  }

  async copyNerdpackTemplate ({ source, destination }) {
    const sourceExists = fs.existsSync(source);
    const destinationExists = fs.existsSync(destination)

    if (!sourceExists) {
      throw new Error('Template folder is missing');
    }

    // Don't overwrite existing files (yet)
    if (destinationExists) {
      const questions = [
        {
          type: 'confirm',
          name: 'overwrite_destination_directory',
          message: 'Destination Directory already exists. Do you wish to overwrite it?'
        }

      ]
      const answers = await inquirer.prompt(questions);

      if (answers.overwrite_destination_directory !== true) {
        throw new Error("Directory already exists, and you don't want to overwrite it");
      }

    }

    // fs.copy only copies contents, not the folder itself
    if (!destinationExists) {
      let result = await fs.copy(source, destination);
    }
  }

  async wizard ({ source, destination }) {
    const fileOptions = [
      {
        fileName: 'package.json',
        questions: [
          {
            type: 'input',
            name: 'NERDPACK_NAME',
            message: "What is the name of your Nerdpack? ex. nr1-the-coolest-nerdpack-ever"
          }
        ]
      }
    ];

    for (let file of fileOptions) {
      // TO DO - Allow user to opt in/out of overwriting existing files?

      const answers = await inquirer.prompt(file.questions);
      await this.generateFileWithUserInputs({ source, destination, fileName: file.fileName, data: answers });
    }
    
  }

  async generateFileWithUserInputs ({ source, destination, fileName, data }) {
    const inputPath = path.join(source, fileName);
    const outputPath = path.join(destination, fileName);
    
    const templateString = fs.readFileSync(inputPath).toString();
    const compiledTemplate = Handlebars.compile(templateString);
    const templateOutput = compiledTemplate(data);

    const message = "Compiling " + inputPath + " templatizing and saving to " + outputPath;
    this.log(chalk.cyan(message));

    const outResult = fs.writeFileSync(outputPath, templateOutput);
  }
}

GenerateCommand.description = `Validate the contents of an Open Source Nerdpack
...
Extra documentation goes here
`

GenerateCommand.flags = {
  destination: flags.string({char: 'd', description: 'directory to check'}),
}

module.exports = GenerateCommand
