import { Logger } from "@uprtcl/micro-orchestrator";

import { ProposalsProvider } from "@uprtcl/evees";
import { ProposalDetails, Proposal, NewProposal } from "@uprtcl/evees";
import { CASStore } from "@uprtcl/multiplatform";
import { OrbitDBCustom } from "@uprtcl/orbitdb-provider";
import { EveesOrbitDBEntities } from "../custom-stores/orbit-db.stores";
import { Entity } from "@uprtcl/cortex";

export interface ProposalManifest {
  toPerspectiveId: string;
  fromPerspectiveId: string;
  timestamp: number;
  owners: string[];
}

const defaultDetails: ProposalDetails = {
  updates: [],
  newPerspectives: [],
};

export class ProposalsOrbitDB implements ProposalsProvider {
  logger = new Logger("PROPOSALS-ORBITDB");

  constructor(protected orbitdb: OrbitDBCustom, protected store: CASStore) {
    if (
      orbitdb.getManifest(EveesOrbitDBEntities.Proposal) === undefined ||
      orbitdb.getManifest(EveesOrbitDBEntities.ProposalsToPerspective) ===
        undefined
    ) {
      throw new Error(
        "orbitdb custom must include the EveesOrbitDBEntities.Proposal EveesOrbitDBEntities.ProposalsToPerspective stores"
      );
    }
  }

  async canPropose(perspectiveId?: string) {
    return true;
  }

  async ready(): Promise<void> {
    await Promise.all([this.orbitdb.ready()]);
  }

  async createProposal(proposal: NewProposal): Promise<string> {
    await this.ready();

    this.logger.info("createProposal()", { proposal });
    const proposalManifest: ProposalManifest = {
      fromPerspectiveId: proposal.fromPerspectiveId,
      toPerspectiveId: proposal.toPerspectiveId,
      owners: [this.orbitdb.identity.id],
      timestamp: Date.now(),
    };

    /** Derive a proposal id from the proposal manifest */
    const proposalId = await this.store.create(proposalManifest);

    await this.updateProposalInternal(proposalId, proposal.details, true);

    /** Now add the proposal to the set of proposals to perspective */
    const proposalsToPerspeciveStore = await this.orbitdb.getStore(
      EveesOrbitDBEntities.ProposalsToPerspective,
      { toPerspectiveId: proposal.toPerspectiveId },
      true
    );

    await proposalsToPerspeciveStore.add(proposalId);

    this.logger.info("createProposal() - done", {
      proposalId,
      proposalManifest,
      details: proposal.details,
    });

    return proposalId;
  }

  async canRemove(proposalId: string, userId?: string) {
    userId = userId || this.orbitdb.identity.id;
    const proposalManifest = (await this.store.get(
      proposalId
    )) as ProposalManifest;
    return proposalManifest.owners.includes(userId as string);
  }

  async getProposalStore(proposalId: string, pin: boolean = false) {
    const proposalManifest = (await this.store.get(
      proposalId
    )) as ProposalManifest;
    const proposalEntity: Entity<ProposalManifest> = {
      id: proposalId,
      object: proposalManifest,
    };
    return this.orbitdb.getStore(
      EveesOrbitDBEntities.Proposal,
      proposalEntity,
      pin
    );
  }

  async getProposalDetails(proposalId): Promise<ProposalDetails> {
    const proposalStore = await this.getProposalStore(proposalId);
    const [latestEntry] = proposalStore.iterator({ limit: 1 }).collect();

    const output = latestEntry ? latestEntry.payload.value : defaultDetails;
    return { ...output };
  }

  async updateProposal(
    proposalId: string,
    details: ProposalDetails
  ): Promise<void> {
    return this.updateProposalInternal(proposalId, details);
  }

  async deleteProposal(proposalId: string): Promise<void> {
    const proposalManifest = (await this.store.get(
      proposalId
    )) as ProposalManifest;

    /** remove from list of proposals */
    const proposalsToPerspeciveStore = await this.orbitdb.getStore(
      EveesOrbitDBEntities.ProposalsToPerspective,
      { toPerspectiveId: proposalManifest.toPerspectiveId },
      true
    );

    await proposalsToPerspeciveStore.delete(proposalId);

    /** drop and unpin */
    const proposalEntity: Entity<ProposalManifest> = {
      id: proposalId,
      object: proposalManifest,
    };
    return this.orbitdb.dropStore(
      EveesOrbitDBEntities.Proposal,
      proposalEntity
    );
  }

  private async updateProposalInternal(
    proposalId: string,
    details: ProposalDetails,
    pin: boolean = false
  ): Promise<void> {
    this.logger.log("updateProposalInternal", { proposalId, details });

    const proposalStore = await this.getProposalStore(proposalId, pin);
    await proposalStore.add(details);

    this.logger.log("updateProposalInternal - done", { proposalId, details });
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    await this.ready();

    this.logger.info("getProposal() - pre", { proposalId });

    const proposalManifest = (await this.store.get(
      proposalId
    )) as ProposalManifest;
    const proposalDetails = await this.getProposalDetails(proposalId);

    const proposal: Proposal = {
      id: proposalId,
      creatorId: "",
      toPerspectiveId: proposalManifest.toPerspectiveId,
      fromPerspectiveId: proposalManifest.fromPerspectiveId,
      details: proposalDetails,
    };

    this.logger.info("getProposal() - post", { proposal });

    return proposal;
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    await this.ready();

    this.logger.info("getProposalsToPerspective() - pre", { perspectiveId });

    const proposalsStore = await this.orbitdb.getStore(
      EveesOrbitDBEntities.ProposalsToPerspective,
      { toPerspectiveId: perspectiveId },
      true
    );

    const proposalIds = [...proposalsStore.values()];
    this.logger.info("getProposalsToPerspective() - post", { proposalIds });

    return proposalIds;
  }
}
