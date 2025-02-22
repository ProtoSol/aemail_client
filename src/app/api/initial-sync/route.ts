// /api/initial-sync

import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const { accountId, userId } = await req.json()
    if (!accountId || !userId) {
        return NextResponse.json({ message: 'Missing Account Id or User Id' }, { status: 400 });
    }

    // search for the account in db
    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId
        }
    })

    if (!dbAccount) {
        return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    // Perfrom the initial sync
    const account = new Account(dbAccount.accessToken);
    const response = await account.performInitialSync();
    if (!response) {
        return NextResponse.json({ error: 'Failed to Perform Initial Sync' }, { status: 500 })
    }

    const { emails, deltaToken } = response

    console.log('Emails: ', emails)

    // await db.account.update({
    //     where: {
    //         id: accountId
    //     },
    //     data: {
    //         nextDeltaToken: deltaToken
    //     }
    // })

    // await syncEmailsToDatabase(emails);

    console.log('Initial Sync Completed', deltaToken);
    return NextResponse.json({ sucess: true }, { status: 200 });
}
