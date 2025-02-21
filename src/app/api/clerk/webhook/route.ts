// /api/clerk/webhook

import { db } from "@/server/db";

export const POST = async (req: Response) => {
    const { data } = await req.json();
    // console.log(data);

    const emailAddress = data.email_addresses[0].email_address;
    const firstName = data.first_name;
    const lastName = data.last_name;
    const imageUrl = data.image_url;
    const id = data.id;

    await db.user.create({
        data: {
            id,
            emailAddress,
            firstName,
            lastName,
            imageUrl,
        },
    })

    console.log(`User created`);

    return new Response("Webhook received", { status: 200 });
}
