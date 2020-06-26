'use babel';

/* eslint-disable no-shadow */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ignore from 'ignore';
import { isEmpty } from 'lodash';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';
import { EXCLUDED_NAMES, CRYPTO, IGNORES } from '../constants/files';
import { PLUGIN } from '../constants/common';

class FileUtils {

  projectPaths = [];
  ignoreFilters = new Map();

  constructor() {
    this.init();
    this.initIgnore();
  }

  init() {
    this.projectPaths = atom.project.getPaths();
  }

  getProjectPaths() {
    this.init();
    return this.projectPaths;
  }

  getMainProjectPath() {
    this.init();
    return this.projectPaths[0];
  }

  getIgnoreContent(ignoreFile, checkSyntax) {
    const result = [];
    try {
      const buffer = fs.readFileSync(ignoreFile);
      let lines = buffer.toString().split('\n').filter(line =>
        !!line && line !== "!" && !line.startsWith("#")
      );
      if (checkSyntax) {
        // Default .hgignore syntax is regex, not glob.
        let allow = false;
        for (const line of lines) {
          if (line.startsWith("syntax")) {
            if (line.includes("glob")) {
              allow = true;
            } else {
              allow = false;
            }
          } else {
            if (allow) result.push(line);
          }
        }
      } else {
        result.push(...lines);
      }

    } catch (err) {
      // nothing
    }

    return result;
  }

  initIgnore() {
    this.projectPaths.forEach(path => {
      const rootFilter = ignore();
      rootFilter.add(EXCLUDED_NAMES);

      const gitContent = this.getIgnoreContent(`${path}${PLUGIN.pathSeparator}${IGNORES.gitIgnore}`);
      const hgContent = this.getIgnoreContent(`${path}${PLUGIN.pathSeparator}${IGNORES.hgIgnore}`, true);
      const p4Content = this.getIgnoreContent(`${path}${PLUGIN.pathSeparator}${IGNORES.p4Ignore}`);
      const cvsContent = this.getIgnoreContent(`${path}${PLUGIN.pathSeparator}${IGNORES.cvsIgnore}`);
      const dcContent = this.getIgnoreContent(`${path}${PLUGIN.pathSeparator}${IGNORES.dcIgnore}`);

      rootFilter.add(gitContent);
      rootFilter.add(hgContent);
      rootFilter.add(p4Content);
      rootFilter.add(cvsContent);
      rootFilter.add(dcContent);

      this.ignoreFilters.set(path, rootFilter);
    });
  }

  updateIgnore(folderPath) {
    const isDir = fs.lstatSync(folderPath).isDirectory();
    if (!isDir) {
      return;
    }

    const gitContent = this.getIgnoreContent(`${folderPath}${PLUGIN.pathSeparator}${IGNORES.gitIgnore}`);
    const hgContent = this.getIgnoreContent(`${folderPath}${PLUGIN.pathSeparator}${IGNORES.hgIgnore}`, true);
    const p4Content = this.getIgnoreContent(`${folderPath}${PLUGIN.pathSeparator}${IGNORES.p4Ignore}`);
    const cvsContent = this.getIgnoreContent(`${folderPath}${PLUGIN.pathSeparator}${IGNORES.cvsIgnore}`);
    const dcContent = this.getIgnoreContent(`${folderPath}${PLUGIN.pathSeparator}${IGNORES.dcIgnore}`);

    const rules = [...gitContent, ...hgContent, ...p4Content, ...cvsContent, ...dcContent];
    if (!isEmpty(rules)) {
      const localFilter = ignore();
      localFilter.add(rules);
      this.ignoreFilters.set(folderPath, localFilter);
    }
  }

  getUnconfirmedProjectFolders() {
    this.init();
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    const projectPaths = this.getProjectPaths();

    return projectPaths.filter(projectFolder => !confirmedFolders.includes(projectFolder));
  }

  isIgnored(filePath) {
    if (filePath.includes(IGNORES.git) || filePath.includes(IGNORES.hg) || filePath.includes(IGNORES.idea)) {
      return true;
    }

    // check ignore filters
    for (const entry of this.ignoreFilters.entries()) {
      const [folderPath, filter] = entry;
      if (!filePath.includes(folderPath)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const relativePath = filePath.replace(`${folderPath}${PLUGIN.pathSeparator}`, '');

      let ignored = false;
      try {
        ignored = filter.ignores(relativePath);
      } catch (err) {
        // nothing
      }
      if (ignored) {
        return true;
      }
    }

    const isAllowed = this.isAllowedFile(filePath);
    if (!isAllowed) {
      return true;
    }

    return false;
  }

  isAllowedFile(filePath) {
    const extname = path.extname(filePath);
    if (!extname) {
      return true; // probably it is folder
    }

    const { extensions, configFiles } = Store.get(STORE_KEYS.allowedFiles);
    const basename = path.basename(filePath);

    const isAllowedConfigFile = configFiles.includes(basename);
    const isAllowedExtension = extensions.includes(extname);

    if (!(isAllowedConfigFile || isAllowedExtension)) {
      return false;
    }

    // checking for file size
    const fileSize = fs.lstatSync(filePath).size;

    return (fileSize <= PLUGIN.maxPayload);
  }

  createFileHash(filePath) {
    const fileContent = this.readFileContent(filePath);
    return crypto
      .createHash(CRYPTO.algorithm)
      .update(fileContent)
      .digest(CRYPTO.hashEncode);
  }

  readFileContent(filePath) {
    return fs.readFileSync(filePath, { encoding: CRYPTO.fileEncode });
  }

  getLocalFolderName(folder) {
    const projectPath = this.projectPaths[0];
    if (!projectPath) {
      return folder;
    }

    return folder.replace(projectPath, '');
  }

  getLocalFileName(filePath) {
    return path.basename(filePath) || filePath;
  }

  isIgnoreFile(filePath) {
    const fileName = path.basename(filePath);
    const isGitIgnore = (fileName === IGNORES.gitIgnore);
    const isHgIgnore = (fileName === IGNORES.hgIgnore);
    const isP4Ignore = (fileName === IGNORES.p4Ignore);
    const isCvsIgnore = (fileName === IGNORES.cvsIgnore);
    const isDCIgnore = (fileName === IGNORES.dcIgnore);

    return (isGitIgnore || isHgIgnore || isP4Ignore || isCvsIgnore || isDCIgnore);
  }

  getDirname(filePath) {
    return path.dirname(filePath);
  }
}

const FileUtilsInstance = new FileUtils();

export { FileUtilsInstance as FileUtils };
