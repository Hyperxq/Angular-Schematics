# Angular Schematics Documentation

This collection provides powerful Angular schematics to streamline development workflows. Each schematic is designed to automate common tasks, improve maintainability, and promote best practices.

## Installation

To add this schematic collection to your project, use the following command:

```bash
ng add @pbuilder/angular
```

---

## Schematics Overview

### 1. **ng-add**
- **Description**: Automatically executed when you add this schematic collection using `ng add`.
- **Functionality**: 
  - Sets up the required configurations for this schematic collection.
  - Ensures that dependencies are installed and the workspace is ready for other schematics.

**Usage**:
```bash
ng add @pbuilder/angular
```

---

### 2. **jasmine-to-jest**
- **Description**: Migrates Angular workspaces from Jasmine to Jest.
- **Functionality**:
  - Updates testing configurations to use Jest.
  - Modifies test files and adjusts necessary settings for compatibility with Jest.

**Usage**:
```bash
ng generate jasmine-to-jest
```

**Outcome**:
- Jasmine settings will be replaced with Jest configurations.
- Testing scripts in your `package.json` will reflect the change to Jest.

---

### 3. **ngrx-resource**
- **Description**: Creates a complete resource based on `@ngrx/signals`.
- **Functionality**:
  - Generates an `@ngrx`-powered state management resource, including actions, effects, reducers, and selectors.
  - Provides a boilerplate for working with signals in your Angular application.

**Usage**:
```bash
ng generate resource [resource-name]
```

**Example**:
[insert-code]

**Outcome**:
- Files for managing the `user` resource will be created, following `@ngrx` best practices.

---

### 4. **scaffolding**
- **Description**: Generates a specific architecture for your Angular application.
- **Functionality**:
  - Allows you to scaffold predefined architectural patterns or custom layouts.
  - Provides templates for components, services, modules, and more.

**Usage**:
```bash
ng generate scaffolding
```

**Outcome**:
- A directory structure and files for the selected architecture type will be created.

---

## Notes
- For each schematic, use `ng generate [schematic-name]` followed by the required options to execute.
- All schematics include a schema file for customizable options. Use `--help` with any command for details.

---

This collection is designed to improve productivity and maintainability. Explore each schematic and see how they can elevate your Angular projects!
