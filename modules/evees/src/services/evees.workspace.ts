import { injectable, inject } from 'inversify';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ApolloClient, ApolloLink } from 'apollo-boost';
import Observable from 'zen-observable-ts';
import { cloneDeep } from 'lodash-es';

@injectable()
export class EveesWorkspace {

  workspace: ApolloClient<any>;

  constructor(@inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>) {
    this.workspace = this.buildWorkspace(this.client);
  }

  private buildWorkspace(client: ApolloClient<any>): ApolloClient<any> {
    const link = new ApolloLink((operation, forward) => {
      return new Observable(observer => {
        client
          .query({
            query: operation.query,
            variables: operation.variables,
            context: operation.getContext()
          })
          .then(result => {
            observer.next(result);
            observer.complete();
          })
          .catch(error => {
            observer.error(error);
            observer.complete();
          });

        return () => {};
      });
    });

    const workspace = new ApolloClient<any>({
      cache: cloneDeep(client.cache),
      typeDefs: client.typeDefs,
      link: link
    });

    return workspace;
  }
  
  public query() {
    this.workspace.query();
  }
 
  public addUprtclAction() {}

  public execute() {}
}
