'use strict';

var core = require('@angular-devkit/core');
var schematics = require('@angular-devkit/schematics');
require('../../utils/color.js');
require('child_process');
require('@angular-devkit/schematics/tasks');
require('jsonc-parser');
require('node:os');
require('inquirer');
require('ora');
var utils_AST_Modify_addShortImport = require('../../utils/AST/Modify/add-short-import.js');
require('pluralize');

function scaffoldingFactory({ root = 'src/app' }) {
    return ()=>{
        const folders = [
            'adapters',
            'components',
            'models',
            'pipes',
            'services',
            'stores'
        ];
        const rules = folders.map((folder)=>createFolderWithIndex(`${root}/${folder}`));
        return schematics.chain([
            ...rules,
            addToShortImport(folders)
        ]);
    };
}
function createFolderWithIndex(path) {
    return ()=>{
        const urlTemplates = [
            'index.ts.template'
        ];
        const template = schematics.apply(schematics.url('./files'), [
            schematics.filter((filePath)=>urlTemplates.some((urlTemplate)=>filePath.includes(urlTemplate))),
            schematics.applyTemplates({
                ...schematics.strings
            }),
            schematics.renameTemplateFiles(),
            schematics.move(path)
        ]);
        return schematics.mergeWith(template, schematics.MergeStrategy.Overwrite);
    };
}
function addToShortImport(folders) {
    return (tree)=>{
        const tsconfigPath = core.normalize('/tsconfig.json');
        if (!tree.exists(tsconfigPath)) {
            logAndThrow(`tsconfig.json not found at path: ${tsconfigPath}`);
        }
        let tsconfigContent = tree.readText(tsconfigPath);
        if (!tsconfigContent) {
            logAndThrow(`Failed to read tsconfig.json at path: ${tsconfigPath}`);
        }
        tsconfigContent = folders.reduce((file, folder)=>{
            return utils_AST_Modify_addShortImport.addShortImportToTsConfig(file, `@${folder}`, `./src/app/${folder}/index.ts`);
        }, tsconfigContent);
        tree.overwrite(tsconfigPath, tsconfigContent);
    };
}
// Utility function for consistent error logging and throwing
function logAndThrow(message) {
    console.error(message);
    throw new schematics.SchematicsException(message);
}

exports.scaffoldingFactory = scaffoldingFactory;
