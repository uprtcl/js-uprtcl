export interface DAOConnector {
    getMembers(): Promise<string[]>;
}