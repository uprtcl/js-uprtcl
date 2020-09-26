import { ProposalStatus, VoteValue } from './proposal.config.types';
import { ProposalManifest } from './types';

export const getProposalStatus = (
  manifest: ProposalManifest,
  votes: any[],
  time: BigInt
): ProposalStatus => {
  if (time < manifest.block + BigInt(manifest.config.duration)) {
    return ProposalStatus.Pending;
  }

  const nYes = votes.filter(v => v === VoteValue.Yes).length;
  const nNo = votes.filter(v => v === VoteValue.No).length;

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

export const isValid = (status: ProposalStatus): boolean => {
  return status === ProposalStatus.Accepted;
};
