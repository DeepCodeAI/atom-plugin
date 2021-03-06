'use babel';

import { STORE_KEYS } from '../lib/constants/store';
import {
  mockState,
  bundleID as mockBundleID,
} from './mocks';

describe('Deepcode Plugin tests', () => {
  let workspaceElement;
  let activationPromise;
  let dcPackage;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = async () => {
      await atom.packages.activatePackage('deepcode');
      const pkg = atom.packages.getActivePackage('deepcode');

      dcPackage = pkg.mainModule;

      dcPackage.setPluginState(mockState);
      dcPackage.initHTTP(mockState[STORE_KEYS.serviceURL]);

      return Promise.resolve();
    }
  });

  describe('Pre-test configuring', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('configured Shared state properly', () => {
      const state = dcPackage.getPluginState();
      const keys = [
        STORE_KEYS.accountType,
        STORE_KEYS.sessionToken,
        STORE_KEYS.serviceURL,
      ];
      for (const key of keys) {
        expect(state[key]).toEqual(mockState[key]);
      }
    });

    it('configured Project state properly', () => {
      const state = dcPackage.getPluginState();
      const keys = [
        STORE_KEYS.confirmedFolders,
        STORE_KEYS.allowedFiles,
        STORE_KEYS.bundleID,
      ];
      for (const key of keys) {
        expect(state[key]).toEqual(mockState[key]);
      }
    });
  });

  describe('Fetching files filters list', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('fetches filters from server', () => {
      dcPackage.setPluginState({
        [STORE_KEYS.allowedFiles]: {},
      });

      runs(() => {
        dcPackage.checkFilters(result => {
          expect(result).toEqual(mockState[STORE_KEYS.allowedFiles]);
        });
      });
    });
  });
});
