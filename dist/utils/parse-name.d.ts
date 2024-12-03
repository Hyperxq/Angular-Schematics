import { Path } from '@angular-devkit/core';

interface Location {
    name: string;
    path: Path;
}
declare function parseName(name: string, path?: string): Location;

export { type Location, parseName };
