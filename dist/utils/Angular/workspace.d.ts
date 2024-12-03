import { workspaces, json } from '@angular-devkit/core';
import { Rule, Tree } from '@angular-devkit/schematics';

type WorkspaceDefinition = workspaces.WorkspaceDefinition;
type WorkspaceHost = workspaces.WorkspaceHost;
type ProjectDefinition = workspaces.ProjectDefinition;
type TargetDefinition = workspaces.TargetDefinition;
declare function updateWorkspace(updater: (workspace: WorkspaceDefinition) => void | Rule | PromiseLike<void | Rule>): Rule;
declare function readWorkspace(tree: Tree, path?: string): Promise<WorkspaceDefinition>;
declare function getWorkspace(tree: Tree, path?: string): Promise<WorkspaceDefinition>;
declare function writeWorkspace(tree: Tree, workspace: WorkspaceDefinition, path?: string): Promise<void>;
declare function buildDefaultPath(project: workspaces.ProjectDefinition): string;
declare function createDefaultPath(tree: Tree, projectName: string): Promise<string>;
declare function allWorkspaceTargets(workspace: workspaces.WorkspaceDefinition): Iterable<[string, workspaces.TargetDefinition, string, workspaces.ProjectDefinition]>;
declare function allTargetOptions(target: workspaces.TargetDefinition, skipBaseOptions?: boolean): Iterable<[string | undefined, Record<string, json.JsonValue | undefined>]>;
declare function getDefaultProjectName(workspace: WorkspaceDefinition): string;
declare function getProject(workspace: WorkspaceDefinition, projectName: string): ProjectDefinition;

export { type ProjectDefinition, type TargetDefinition, type WorkspaceDefinition, type WorkspaceHost, allTargetOptions, allWorkspaceTargets, buildDefaultPath, createDefaultPath, getDefaultProjectName, getProject, getWorkspace, readWorkspace, updateWorkspace, writeWorkspace };
