// /api/aurinko/callback

import { waitUntil } from "@vercel/functions";
import { exchangeCodeForAcessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const GET = async (req: NextRequest) => {

    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;

    const status = params.get('status');
    if (status != 'success') {
        return NextResponse.json({ message: 'Failed to link account' }, { status: 400 });
    }

    // get the code for exchanging the token
    const code = params.get('code');
    if (!code) {
        return NextResponse.json({ message: 'Code not found' }, { status: 400 });
    }

    const token = await exchangeCodeForAcessToken(code);
    if (!token) {
        return NextResponse.json({ message: 'Failed to exchange code for token' }, { status: 400 });
    }

    const acccountDetails = await getAccountDetails(token.accessToken);
    // console.log(acccountDetails);

    await db.account.upsert({
        where: {
            id: token.accountId.toString()
        },
        update: {
            accessToken: token.accessToken,
        },
        create: {
            id: token.accountId.toString(),
            userId,
            emailAddress: acccountDetails.email,
            name: acccountDetails.name,
            accessToken: token.accessToken
        }
    })

    // Trigger the initial sync
    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
            accountId: token.accountId.toString(),
            userId
        }).then(response => {
            console.log("Initial Sync Triggered", response.data);
        }).catch(error => {
            console.error("Error Triggering Initial Sync", error);
        })
    )

    return NextResponse.redirect(new URL('/mail', req.url));
}
