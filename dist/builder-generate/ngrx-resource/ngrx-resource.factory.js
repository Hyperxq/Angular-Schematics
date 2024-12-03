'use strict';

var schematics = require('@angular-devkit/schematics');
require('../../utils/color.js');
require('child_process');
require('@angular-devkit/schematics/tasks');
require('jsonc-parser');
require('node:os');
var utils_parseName = require('../../utils/parse-name.js');
require('inquirer');
require('ora');
var utils_files = require('../../utils/files.js');
var pluralize = require('pluralize');
var utils_Angular_addRoutes = require('../../utils/Angular/add-routes.js');
var utils_Angular_workspace = require('../../utils/Angular/workspace.js');
var ts = require('typescript');
var core = require('@angular-devkit/core');
var builderGenerate_ngrxResource_serviceContent_data = require('./service-content.data.js');
var path = require('path');
var builderGenerate_ngrxResource_routes_data = require('./routes.data.js');

function ngrxResourceFactory({ name: pluralPath }) {
    return async (tree)=>{
        const schematicsPreSettings = await readSchematicsPreSettings(tree);
        const { name } = utils_parseName.parseName(pluralPath);
        return schematics.chain([
            createNgrxResource(schematicsPreSettings, pluralPath),
            utils_Angular_addRoutes.updateRoutes('src/app/app.routes.ts', builderGenerate_ngrxResource_routes_data.routesToAdd(name))
        ]);
    };
}
async function readSchematicsPreSettings(tree) {
    // Read the workspace configuration
    const workspace = await utils_Angular_workspace.readWorkspace(tree);
    const projectName = utils_Angular_workspace.getDefaultProjectName(workspace);
    const project = utils_Angular_workspace.getProject(workspace, projectName);
    const result = {};
    Object.entries(project.extensions?.schematics ?? {}).forEach(([schematicName, settings])=>{
        const [collection, schematic] = schematicName.split(':');
        result[collection] = {
            [schematic]: settings
        };
    });
    return result;
}
function createNgrxResource(schematics$1, resourcePath, url = 'PLACEHOLDER') {
    return async (tree)=>{
        const workspace = await utils_Angular_workspace.getWorkspace(tree);
        const projectName = utils_Angular_workspace.getDefaultProjectName(workspace);
        const { sourceRoot, prefix } = utils_Angular_workspace.getProject(workspace, projectName);
        const { name, path: path$1 } = utils_parseName.parseName(resourcePath);
        const pluralPath = core.normalize(path.join(path$1, pluralize.plural(name)));
        const fullPath = core.normalize(path.join(sourceRoot, prefix, pluralPath));
        // Generate the main component, with native schematic
        const angularCollection = schematics$1['@schematics/angular'] ?? {};
        const componentSchematic = angularCollection['component'] ?? {};
        const componentRule = schematics.externalSchematic('@schematics/angular', 'component', {
            name: `${pluralPath}`,
            project: projectName,
            ...componentSchematic
        });
        // Generate sub-components,
        const subComponentsRules = [
            `${pluralPath}/components/${pluralize.singular(name)}Edit`,
            `${pluralPath}/components/${pluralize.singular(name)}Update`,
            `${pluralPath}/components/${pluralize.singular(name)}`
        ].map((c)=>schematics.externalSchematic('@schematics/angular', 'component', {
                name: c,
                project: projectName,
                ...componentSchematic
            }));
        // Generate models
        const modelsRules = utils_files.addFilesToTree({
            name
        }, `${fullPath}`, [
            '__name@plural@dasherize__.model.ts.template',
            'index.ts.template'
        ], './files');
        // Generate services with the angular schematic,
        // Update the service with the changes,
        const serviceSchematic = angularCollection['service'] ?? {};
        const serviceFilePath = core.normalize(path.join(fullPath, `services/${pluralize.plural(name)}.service.ts`));
        const serviceRule = schematics.externalSchematic('@schematics/angular', 'service', {
            name: `${pluralPath}/services/${pluralize.plural(name)}`,
            project: projectName,
            ...serviceSchematic
        });
        // Generate store,
        const storeRules = utils_files.addFilesToTree({
            name
        }, `${fullPath}`, [
            '__name@plural@dasherize__.store.ts.template',
            'index.ts.template'
        ], './files');
        // Generate adapters
        const adapterRules = utils_files.addFilesToTree({
            name
        }, `${fullPath}`, [
            '__name@plural@dasherize__.adapter.ts.template',
            'index.ts.template'
        ], './files');
        return schematics.chain([
            schematics.branchAndMerge(schematics.chain([
                componentRule,
                serviceRule,
                storeRules,
                adapterRules,
                modelsRules,
                ...subComponentsRules
            ]), schematics.MergeStrategy.Overwrite),
            schematics.branchAndMerge(updateService(serviceFilePath, pluralize.singular(name), url), schematics.MergeStrategy.Overwrite)
        ]);
    };
}
function updateService(servicePath, serviceName, url) {
    return (tree)=>{
        const fileExists = tree.exists(servicePath);
        if (!fileExists) {
            throw new Error(`The service file at path ${servicePath} does not exist.`);
        }
        const fileContent = tree.read(servicePath)?.toString('utf-8');
        if (!fileContent) {
            throw new Error(`Could not read the service file at path ${servicePath}.`);
        }
        // Parse the file into an AST
        const sourceFile = ts.createSourceFile(servicePath, fileContent, ts.ScriptTarget.Latest, true);
        // Sections to store extracted parts
        const imports = new Set();
        let decorator = '';
        let classHeader = '';
        // Traverse the AST to extract the sections
        ts.forEachChild(sourceFile, (node)=>{
            if (ts.isImportDeclaration(node)) {
                // Extract import statements
                const importText = node.getFullText(sourceFile).trim();
                imports.add(importText);
            } else if (ts.isClassDeclaration(node)) {
                // Extract decorators using getDecorators (for versions without decorators directly available)
                const decorators = ts.getDecorators?.(node)?.map((d)=>d.getText(sourceFile)) || [];
                decorator = decorators.join('\n');
                classHeader = `export class ${node.name?.getText(sourceFile) || ''}`;
                node.members.map((member)=>member.getFullText(sourceFile).trim()).join('\n');
            }
        });
        if (!classHeader) {
            throw new Error(`No class declaration found in the file: ${servicePath}`);
        }
        // Ensure required imports are present
        const requiredImports = [
            `import { HttpClient } from '@angular/common/http';`,
            `import { inject } from '@angular/core';`,
            `import { Observable } from 'rxjs';`,
            `import { map, catchError } from 'rxjs/operators';`,
            `import { ${pluralize.singular(core.strings.classify(serviceName))}, Update${pluralize.singular(core.strings.classify(serviceName))}, Create${pluralize.singular(core.strings.classify(serviceName))} } from '../models';`,
            `import { ${pluralize.singular(core.strings.classify(serviceName))}Adapter } from '../adapters';`
        ];
        requiredImports.forEach((imp)=>imports.add(imp));
        // Generate new class body
        const newClassBody = builderGenerate_ngrxResource_serviceContent_data.serviceContent(serviceName, url);
        // Construct the updated file content
        const updatedFileContent = builderGenerate_ngrxResource_serviceContent_data.fullServiceContent(imports, decorator, classHeader, newClassBody).trim();
        // Overwrite the file with updated content
        tree.overwrite(servicePath, updatedFileContent);
        return tree;
    };
}

exports.ngrxResourceFactory = ngrxResourceFactory;
exports.readSchematicsPreSettings = readSchematicsPreSettings;
