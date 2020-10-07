import { ProposalStatus, VoteValue } from './proposal.config.types';
import { ProposalManifest, Vote } from './types';

export const getStatus = (votes: Vote[], block: number, manifest: ProposalManifest) => {
  if (block < manifest.block + manifest.config.duration) {
    return ProposalStatus.Pending;
  }

  const nYes = votes.filter(v => v.value === VoteValue.Yes).length;
  const nNo = votes.filter(v => v.value !== VoteValue.Yes).length;

  const N = votes.length;
  const nVoted = nYes + nNo;

  if (nVoted / N < manifest.config.quorum) {
    return ProposalStatus.Rejected;
  }

  if (nYes / N >= manifest.config.thresehold) {
    return ProposalStatus.Accepted;
  }

  return ProposalStatus.Rejected;
};
