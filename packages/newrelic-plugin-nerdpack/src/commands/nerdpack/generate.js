const {Command, flags} = require('@oclif/command')

const fs = require('fs-extra')
const path = require('path');
const mkdirp = require('mkdirp');

const chalk = require('chalk')
const Handlebars = require('handlebars');
const inquirer = require('inquirer');

const nerdpackSchema = require('../../../src/nerdpack-schema.json');
const { getTemplateDirectory } = require('../../template');
const { resolveHome } = require('../../utilities');

class GenerateCommand extends Command {
  async run() {
    const { flags } = this.parse(GenerateCommand);

    const currentDirectory = process.cwd();
    let cumulativeAnswers = {
      "SAVE_CWD": false
    };
    
    // Template
    const localTemplateDirectory = flags.localTemplateDirectory || false;
    const templateDirectory = await getTemplateDirectory({ localTemplateDirectory });

    // Destination
    if (!flags.destination) {
      const answers = await inquirer.prompt([
          {
            "type": "confirm",
            "name": "SAVE_CWD",
            "message": "Save files to current directory? (no means we'll create one for you)",
            "default": true
          }
      ]);
      cumulativeAnswers['SAVE_CWD'] = answers.SAVE_CWD;
    }

    // Nerdpack Name
    const nerdpackName = await this.getNerdpackName();
    cumulativeAnswers['NERDPACK_NAME'] = nerdpackName;

    const saveHere = cumulativeAnswers['SAVE_CWD'];
    const defaultDestination = saveHere ? currentDirectory : path.join(currentDirectory, nerdpackName);
    const destination = flags.destination ? resolveHome(flags.destination) : false || defaultDestination;
    mkdirp.sync(path.dirname(destination));

    // Questions and template compilation
    const nerdpackFiles = nerdpackSchema.files;
    nerdpackFiles.sort((a, b) => a.questions.length > b.questions.length);

    for (let fileObject of nerdpackFiles) {
      const filePath = fileObject.filePath || '';
      const fileName = fileObject.fileName;
      
      const selected = true;
      if (selected) {
        const src = path.join(templateDirectory, filePath, fileName);
        const dest = path.join(destination, filePath, fileName);

        const newAnswers = await this.processFile({ src, dest, fileObject, cumulativeAnswers});
        cumulativeAnswers = Object.assign({}, cumulativeAnswers, newAnswers);
      }
    }

  }

  async getNerdpackName () {
    const answers = await inquirer.prompt([
      {
          "type": "input",
          "name": "NERDPACK_NAME",
          "message": "What is the name of your Nerdpack?",
          "default": "nr1-the-coolest-nerdpack-ever"
      }
    ]);
    return answers.NERDPACK_NAME;
  }

  async processFile({ src, dest, fileObject, cumulativeAnswers }) {
    // Create intermediate folders
    if (!fs.pathExistsSync(dest)) {
      const destDirectory = path.dirname(dest);
      mkdirp.sync(destDirectory);
    }

    if (fs.existsSync(dest)) {
      const answer = await inquirer.prompt([
        {
          "name": "overwrite_file",
          "type": "confirm",
          "message": dest + " already exists. Do you want to overwrite it?",
          "default": false
        }
      ])
    }

    const questions = fileObject.questions || false;
    let newAnswers = {};

    if ((questions && questions.length > 0 )) {
      const result = await this.wizard({ fileObject, dest, src, cumulativeAnswers });
      const mergedTemplate = result.mergedTemplate
      newAnswers = result.newAnswers;

      fs.writeFileSync(dest, mergedTemplate);
    } else {
      fs.copyFileSync(src, dest);
    }

    this.log(chalk.cyan('Creating: ' + dest));

    return newAnswers;
  }

  async wizard ({ fileObject, src, cumulativeAnswers }) {
    const { fileName, questions } = fileObject;

    if (!questions || questions.length <= 0) {
      return '';  
    }

    // Don't ask the same question twice
    const filteredQuestions = questions.filter((q) => {
      return !cumulativeAnswers[q.name];
    });

    const newAnswers = await inquirer.prompt(filteredQuestions);
    const combinedAnswers = Object.assign({}, cumulativeAnswers, newAnswers);
    const mergedTemplate = await this.compileAndMerge({ src, fileName, combinedAnswers });

    return { mergedTemplate, newAnswers };
  }

  async compileAndMerge ({ src, answers }) {
    const templateString = fs.readFileSync(src).toString();
    const compiledTemplate = Handlebars.compile(templateString);
    const mergedTemplate = compiledTemplate(answers);

    // const message = "Compiling " + inputPath + " templatizing and saving to " + outputPath;
    // this.log(chalk.cyan(message));

    return mergedTemplate;
    
  }
}

GenerateCommand.description = `Generate the contents of an Open Source Nerdpack
...
Extra documentation goes here
`

GenerateCommand.flags = {
  destination: flags.string({char: 'd', description: 'directory to check'}),
  localTemplateDirectory: flags.string({char: 't', description: 'a local directory containing the template'})
}

module.exports = GenerateCommand
