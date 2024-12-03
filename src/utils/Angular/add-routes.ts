import { Rule, Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';

export function updateRoutes(filePath: string, routesToAdd: string[]): Rule {
  return (tree: Tree) => {
    if (!tree.exists(filePath)) {
      throw new Error(`The file at path ${filePath} does not exist.`);
    }

    const fileContent = tree.read(filePath)?.toString('utf-8');
    if (!fileContent) {
      throw new Error(`Could not read the file at path ${filePath}.`);
    }

    // Parse the file into an AST
    const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

    let updatedRoutesContent = '';

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isVariableStatement(node)) {
        const declarationList = node.declarationList.declarations;

        for (const declaration of declarationList) {
          if (
            ts.isVariableDeclaration(declaration) &&
            declaration.name.getText(sourceFile) === 'routes' &&
            declaration.initializer &&
            ts.isArrayLiteralExpression(declaration.initializer)
          ) {
            // Get the existing elements of the routes array
            const existingRoutes = declaration.initializer.elements.map((el) =>
              el.getFullText(sourceFile).trim()
            );

            // Add new routes, avoiding duplicates
            const allRoutes = new Set([...existingRoutes, ...routesToAdd]);

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
    const updatedFileContent = fileContent.replace(
      /export const routes: Routes = \[([^]*?)\];/,
      `export const routes: Routes = [\n${updatedRoutesContent}\n];`
    );

    // Write the updated content back to the file
    tree.overwrite(filePath, updatedFileContent);
    return tree;
  };
}
