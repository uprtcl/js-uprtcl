import { TemplateResult } from "lit-element";
import { Behaviour, Evees } from "@uprtcl/evees";

export interface DiffLens {
    name: string;
    render: (evees: Evees, newEntity: any, oldEntity: any, summary: boolean) => TemplateResult;
    type?: string;
  }
  
  export interface HasDiffLenses<T = any> extends Behaviour<T> {
    diffLenses: () => DiffLens[];
  }
  