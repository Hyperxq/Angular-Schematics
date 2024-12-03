'use strict';

var ts = require('typescript');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var ts__namespace = /*#__PURE__*/_interopNamespaceDefault(ts);

function updateRoutes(filePath, routesToAdd) {
    return (tree)=>{
        if (!tree.exists(filePath)) {
            throw new Error(`The file at path ${filePath} does not exist.`);
        }
        const fileContent = tree.read(filePath)?.toString('utf-8');
        if (!fileContent) {
            throw new Error(`Could not read the file at path ${filePath}.`);
        }
        // Parse the file into an AST
        const sourceFile = ts__namespace.createSourceFile(filePath, fileContent, ts__namespace.ScriptTarget.Latest, true);
        let updatedRoutesContent = '';
        ts__namespace.forEachChild(sourceFile, (node)=>{
            if (ts__namespace.isVariableStatement(node)) {
                const declarationList = node.declarationList.declarations;
                for (const declaration of declarationList){
                    if (ts__namespace.isVariableDeclaration(declaration) && declaration.name.getText(sourceFile) === 'routes' && declaration.initializer && ts__namespace.isArrayLiteralExpression(declaration.initializer)) {
                        // Get the existing elements of the routes array
                        const existingRoutes = declaration.initializer.elements.map((el)=>el.getFullText(sourceFile).trim());
                        // Add new routes, avoiding duplicates
                        const allRoutes = new Set([
                            ...existingRoutes,
                            ...routesToAdd
                        ]);
                        // Create updated routes content
                        updatedRoutesContent = Array.from(allRoutes).join(',\n');
                    }
                }
            }
        });
        if (!updatedRoutesContent) {
            throw new Error(`Could not find or update the 'routes' variable in the file.`);
        }
        // Construct the updated file content
        const updatedFileContent = fileContent.replace(/export const routes: Routes = \[([^]*?)\];/, `export const routes: Routes = [\n${updatedRoutesContent}\n];`);
        // Write the updated content back to the file
        tree.overwrite(filePath, updatedFileContent);
        return tree;
    };
}

exports.updateRoutes = updateRoutes;
