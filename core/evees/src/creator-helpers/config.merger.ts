import { ClientRemote, EveesConfig } from '../evees/interfaces/index';

export const defaultConfig = (remotes: ClientRemote[], config: EveesConfig = {}): EveesConfig => {
  config.defaultRemote = config.defaultRemote ? config.defaultRemote : remotes[0];

  config.officialRemote = config.officialRemote
    ? config.officialRemote
    : remotes.length > 1
    ? remotes[1]
    : remotes[0];

  config.editableRemotesIds = config.editableRemotesIds
    ? config.editableRemotesIds
    : [remotes[0].id];

  return config;
};
