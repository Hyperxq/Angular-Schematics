'use strict';

var utils_color = require('./color.js');
var utils_commands = require('./commands.js');
var utils_dependencies = require('./dependencies.js');
var utils_eol = require('./eol.js');
var utils_jsonFile = require('./json-file.js');
var utils_packageJson = require('./package-json.js');
var utils_parseName = require('./parse-name.js');
var utils_prompt = require('./prompt.js');
var utils_spinner = require('./spinner.js');
var utils_AST_Modify_addShortImport = require('./AST/Modify/add-short-import.js');
var utils_files = require('./files.js');
var utils_packageManager = require('./package-manager.js');



exports.colors = utils_color.colors;
exports.removeColor = utils_color.removeColor;
exports.spawnAsync = utils_commands.spawnAsync;
exports.NodeDependencyType = utils_dependencies.NodeDependencyType;
exports.addPackageJsonDependency = utils_dependencies.addPackageJsonDependency;
exports.getPackageJsonDependency = utils_dependencies.getPackageJsonDependency;
exports.installDependencies = utils_dependencies.installDependencies;
exports.removePackageJsonDependency = utils_dependencies.removePackageJsonDependency;
exports.getEOL = utils_eol.getEOL;
exports.JSONFile = utils_jsonFile.JSONFile;
exports.addElementToPackageJson = utils_packageJson.addElementToPackageJson;
exports.addScriptToPackageJson = utils_packageJson.addScriptToPackageJson;
exports.parseName = utils_parseName.parseName;
exports.askChoices = utils_prompt.askChoices;
exports.askConfirmation = utils_prompt.askConfirmation;
exports.askQuestion = utils_prompt.askQuestion;
exports.Spinner = utils_spinner.Spinner;
exports.addShortImportToTsConfig = utils_AST_Modify_addShortImport.addShortImportToTsConfig;
exports.addFilesToTree = utils_files.addFilesToTree;
exports.installAsDevCommands = utils_packageManager.installAsDevCommands;
exports.installCommands = utils_packageManager.installCommands;
exports.uninstallCommands = utils_packageManager.uninstallCommands;
