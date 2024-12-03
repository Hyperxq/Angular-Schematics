'use strict';

var schematics = require('@angular-devkit/schematics');
require('../../utils/color.js');
var utils_commands = require('../../utils/commands.js');
require('@angular-devkit/schematics/tasks');
require('jsonc-parser');
require('node:os');
require('@angular-devkit/core');
require('inquirer');
require('ora');
var utils_files = require('../../utils/files.js');
var utils_packageManager = require('../../utils/package-manager.js');
require('typescript');
var utils_Angular_workspace = require('../../utils/Angular/workspace.js');

function jasmineToJestFactory({ packageManager }) {
    return async ()=>{
        // * 1. Install jest deps
        await utils_commands.spawnAsync(packageManager, [
            utils_packageManager.installAsDevCommands[packageManager],
            `jest @types/jest @jest/globals jest-preset-angular`
        ], {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true
        });
        // * 2. Uninstall jasmine deps
        await utils_commands.spawnAsync(packageManager, [
            utils_packageManager.uninstallCommands[packageManager],
            `@types/jasmine jasmine-core karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter`
        ], {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true
        });
        // * 3. Replace tsconfig.spec.json
        // * 4. Add setup-jest.ts
        // * 5. Add jest.config.js
        // * 6. remove test worker
        return schematics.chain([
            replaceTsconfigSpec(),
            addJestConfig(),
            updateAngularJson()
        ]);
    };
}
function updateAngularJson() {
    return utils_Angular_workspace.updateWorkspace((workspace)=>{
        const projectName = utils_Angular_workspace.getDefaultProjectName(workspace);
        const project = utils_Angular_workspace.getProject(workspace, projectName);
        if (project.targets.has('test')) {
            project.targets.delete('test');
            console.log(`Removed 'test' target from project: ${projectName}`);
        }
    });
}
function replaceTsconfigSpec() {
    return ()=>{
        return utils_files.addFilesToTree({}, `./`, [
            'tsconfig.spec.json.template'
        ], './files');
    };
}
function addJestConfig() {
    return ()=>{
        return utils_files.addFilesToTree({}, `./`, [
            'setup-jest.ts.template',
            'jest.config.js.template'
        ], './files');
    };
}

exports.jasmineToJestFactory = jasmineToJestFactory;
