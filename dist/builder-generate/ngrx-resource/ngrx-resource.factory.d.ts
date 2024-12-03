import { Rule, Tree } from '@angular-devkit/schematics';

interface Collection {
    [schematicName: string]: Schematic;
}
type Schematic = Record<string, any>;
declare function ngrxResourceFactory({ name: pluralPath }: {
    name: string;
}): Rule;
declare function readSchematicsPreSettings(tree: Tree): Promise<Collection>;

export { ngrxResourceFactory, readSchematicsPreSettings };
