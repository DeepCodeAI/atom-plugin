'use babel';

import { COMMON_IGNORE_DIRS } from './commonIgnoreDirs';

export const FILE_STATUS = {
  created: 'created',
  modified: 'modified',
  deleted: 'deleted',
  same: 'same',
};

export const CRYPTO = {
  algorithm: 'sha256',
  hashEncode: 'hex',
  fileEncode: 'utf8',
};

export const IGNORES = {
  git: '.git',
  hg: '.hg',
  gitIgnore: '.gitignore',
  hgIgnore: '.hgignore',
  p4Ignore: '.p4ignore',
  cvsIgnore: '.cvsignore',
  dcIgnore: '.dcignore',
  idea: '.idea',
};

export const EXCLUDED_NAMES = [
  'node_modules',
  '/node_modules',
  'node_modules/',
  '.git',
  '/.git',
  '.git/',
  '.hg',
  '/.hg',
  '.hg/',
  '.idea',
  '/.idea',
  '.idea/',
  IGNORES.gitIgnore,
  IGNORES.hgIgnore,
  IGNORES.p4Ignore,
  IGNORES.cvsIgnore,
  IGNORES.dcIgnore,
  ...COMMON_IGNORE_DIRS,
];
