import { Rule } from '@angular-devkit/schematics';

declare function updateRoutes(filePath: string, routesToAdd: string[]): Rule;

export { updateRoutes };
