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
  - You have the option to skip the ngrx/signal config. ```ng add @pbuilder/angular --skip-ngrx```.
  - If your app is not a standalone app and you don't have the file `app.config.ts` in your `src` folder, the schematic will not update it.

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

#### Options

If you want to see all the options, you can run the command ```builder info @pbuilder/angular```.
You can see the options of any schematic by running ```builder info [collection-name]:[schematic-name]```.

For this schematics the options are:

- ```packageManager```: The package manager used to install dependencies.

**Usage**:

```bash
ng generate jasmine-to-jest
```

**Outcome**:

- Jasmine settings will be replaced with Jest configurations.
- Testing scripts in your `package.json` will reflect the change to Jest.

I am creating this automation base on this [medium article](https://medium.com/ngconf/configure-jest-in-angular-18-79765fdb0fae#:~:text=To%20use%20Jest%20in%20Angular,use%20Jest%20on%20its%20own.)

---

### 3. **Resource**

- **Description**: Creates a complete resource based on `@ngrx/signals`.
- **Functionality**:
  - Generates an `@ngrx`-powered state management resource, including actions, effects, reducers, and selectors.
  - Provides a boilerplate for working with signals in your Angular application.

**Usage**:

```bash
ng generate resource [resource-name]
```

**Example**:

```bash
ng generate resource users
```

```
└── 📁users
    └── 📁adapters
        └── index.ts
        └── users.adapter.ts
    └── 📁components
        └── 📁user
            └── user.component.html
            └── user.component.scss
            └── user.component.spec.ts
            └── user.component.ts
        └── 📁user-edit
            └── user-edit.component.html
            └── user-edit.component.scss
            └── user-edit.component.spec.ts
            └── user-edit.component.ts
        └── 📁user-update
            └── user-update.component.html
            └── user-update.component.scss
            └── user-update.component.spec.ts
            └── user-update.component.ts
    └── 📁models
        └── index.ts
        └── users.model.ts
    └── 📁services
        └── users.service.spec.ts
        └── users.service.ts
    └── 📁stores
        └── index.ts
        └── users.store.ts
    └── users.component.html
    └── users.component.scss
    └── users.component.spec.ts
    └── users.component.ts
```

**Outcome**:

- Files for managing the `user` resource will be created, following `@ngrx` best practices.

#### Note

This schematics is using the native `ng generate component` and `ng generate service` commands, for this reason we are reading the preferences from the `angular.json` file. If you want to modify something, you can do it in the `angular.json` file.

---

### 4. **Scaffolding**

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
