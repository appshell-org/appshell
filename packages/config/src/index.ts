/**
 * @appshell/config package API
 */
export { default as configmap } from './configmap';
export { default as deregister } from './deregister';
export { default as generateEnv } from './generate.env';
export { default as generateGlobalConfig } from './generate.global-config';
export { default as generateManifest } from './generate.manifest';
export { default as outdated } from './outdated';
export { default as register } from './register';
export { default as sync } from './sync';
export type {
  AppshellConfig,
  AppshellConfigRemote,
  AppshellGlobalConfig,
  AppshellIndex,
  AppshellManifest,
  AppshellRemote,
  AppshellTemplate,
  Metadata,
  PackageSpec,
  Schema,
  SharedModuleSpec,
} from './types';
export * as utils from './utils';
export * as validators from './validators';
