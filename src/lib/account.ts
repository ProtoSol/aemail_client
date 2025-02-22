import { EmailMessage, SyncResponse, SyncUpdatedResponse } from "@/types";
import axios from "axios";

export class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync() {
        const response = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync', {}, {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params: {
                daysWithin: 2,
                bodyType: 'html'
            }
        })
        return response.data;
    }

    async getUpdatedEmails({ deltaToken, pageToken }: { deltaToken?: string, pageToken?: string }) {
        let params: Record<string, string> = {};
        if (deltaToken) params.deltaToken = deltaToken;
        if (pageToken) params.pageToken = pageToken;

        const response = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated', {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params
        })
        return response.data;
    }

    async performInitialSync() {
        try {
            // Perform the initial sync
            let syncResponse = await this.startSync()
            while (!syncResponse.ready) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                syncResponse = await this.startSync();
            }
            // access the bookmark delta token
            let storedDeltaToken: string = syncResponse.syncUpdatedToken;

            let updatedResponse = await this.getUpdatedEmails({ deltaToken: storedDeltaToken }); // Point

            if (updatedResponse.nextDeltaToken) {
                // sync is complete
                storedDeltaToken = updatedResponse.nextDeltaToken;
            }
            let allEmails: EmailMessage[] = updatedResponse.records;

            // fetch all the pages
            while (updatedResponse.nextPageToken) {
                updatedResponse = await this.getUpdatedEmails({ pageToken: updatedResponse.nextPageToken });
                allEmails = allEmails.concat(updatedResponse.records);
                if (updatedResponse.nextDeltaToken) {
                    // sync is complete
                    storedDeltaToken = updatedResponse.nextDeltaToken;
                }
            }

            console.log('Total Emails:', allEmails.length);
            // Store the latest delta token

            await this.getUpdatedEmails({ deltaToken: storedDeltaToken });

            return {
                emails: allEmails,
                deltaToken: storedDeltaToken
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error During Sync', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.error('Unexpected Error During Sync', error);
            }
        }
    }
}
