'use strict';

var schematics = require('@angular-devkit/schematics');
var ts = require('typescript');
var utils_Angular_workspace = require('../utils/Angular/workspace.js');
require('../utils/color.js');
var utils_commands = require('../utils/commands.js');
require('@angular-devkit/schematics/tasks');
require('jsonc-parser');
require('node:os');
require('@angular-devkit/core');
require('inquirer');
require('ora');
require('pluralize');

function builderAddFactory() {
    return async ()=>{
        await utils_commands.spawnAsync("ng", [
            'add',
            '@ngrx/signals@latest --skip-confirmation'
        ], {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true
        });
        return schematics.chain([
            addCliConfig(),
            updateAppConfig('src/app/app.config.ts')
        ]);
    };
}
function addCliConfig() {
    return utils_Angular_workspace.updateWorkspace((workspace)=>{
        const newCollection = '@pbuilder/angular';
        // Check if the `cli` property exists in the root of the workspace
        if (!workspace.extensions.cli) {
            // Add the `cli` configuration
            workspace.extensions.cli = {
                schematicCollections: [
                    newCollection,
                    '@schematics/angular'
                ]
            };
            console.log(`Added 'cli' configuration to the workspace`);
        } else {
            // If the `cli` property exists, add the collection at the beginning of the array
            const cliConfig = workspace.extensions.cli;
            if (Array.isArray(cliConfig.schematicCollections)) {
                // Use a Set to ensure uniqueness and add the new collection
                const uniqueCollections = new Set([
                    ...cliConfig.schematicCollections,
                    newCollection
                ]);
                cliConfig.schematicCollections = Array.from(uniqueCollections);
                console.log(`Updated 'schematicCollections' with '${newCollection}'`);
            } else {
                // If schematicCollections is not an array, initialize it properly
                cliConfig.schematicCollections = [
                    newCollection
                ];
                console.log(`Initialized 'schematicCollections' with '${newCollection}'`);
            }
        }
    });
}
function updateAppConfig(filePath) {
    return (tree)=>{
        if (!tree.exists(filePath)) {
            throw new Error(`The file at path ${filePath} does not exist.`);
        }
        const fileContent = tree.read(filePath)?.toString('utf-8');
        if (!fileContent) {
            throw new Error(`Could not read the file at path ${filePath}.`);
        }
        // Parse the file into an AST
        const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
        // Collect required imports and appConfig updates
        const importsToAdd = new Set();
        const updatedProviders = new Set();
        ts.forEachChild(sourceFile, (node)=>{
            // Process import declarations
            if (ts.isImportDeclaration(node)) {
                const importText = node.getText(sourceFile);
                if (!importText.includes('provideHttpClient') && importText.includes('@angular/common/http')) {
                    importsToAdd.add(`import { provideHttpClient, withFetch } from '@angular/common/http';`);
                } else if (!importText.includes('withComponentInputBinding') && importText.includes('@angular/router')) {
                    importsToAdd.add(`import { provideRouter, withComponentInputBinding } from '@angular/router';`);
                } else {
                    importsToAdd.add(importText);
                }
                importsToAdd.add(`import { provideHttpClient, withFetch } from '@angular/common/http';`);
            }
            // Process appConfig object
            if (ts.isVariableStatement(node)) {
                const declarationList = node.declarationList.declarations;
                for (const declaration of declarationList){
                    if (ts.isVariableDeclaration(declaration) && declaration.name.getText(sourceFile) === 'appConfig') {
                        if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer) && declaration.initializer.properties) {
                            const providersProperty = declaration.initializer.properties.find((p)=>ts.isPropertyAssignment(p) && p.name.getText(sourceFile) === 'providers');
                            if (providersProperty && ts.isPropertyAssignment(providersProperty)) {
                                const arrayLiteral = providersProperty.initializer;
                                if (ts.isArrayLiteralExpression(arrayLiteral)) {
                                    // Process existing providers
                                    arrayLiteral.elements.forEach((element)=>{
                                        const providerText = element.getFullText(sourceFile).trim();
                                        if (providerText.startsWith('provideRouter')) {
                                            // Update provideRouter with an additional parameter
                                            updatedProviders.add(`provideRouter(routes, withComponentInputBinding())`);
                                        } else {
                                            updatedProviders.add(providerText);
                                        }
                                    });
                                    // Add new providers
                                    updatedProviders.add(`provideHttpClient(withFetch())`);
                                }
                            }
                        }
                    }
                }
            }
        });
        // Construct the updated file content
        const updatedFileContent = `
${Array.from(importsToAdd).join('\n')}

export const appConfig: ApplicationConfig = {
  providers: [${Array.from(updatedProviders).join(', ')}],
};
    `.trim();
        // Write the updated content back to the file
        tree.overwrite(filePath, updatedFileContent);
        return tree;
    };
}

exports.addCliConfig = addCliConfig;
exports.builderAddFactory = builderAddFactory;
