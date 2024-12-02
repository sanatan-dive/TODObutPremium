import { Webhook } from "svix";
import {headers} from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "../../../../../lib/prisma";

export async function POST(req: Request) {

    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        return new Response("Missing WEBHOOK_SECRET", { status: 500 });
    }

    const headerPayload = headers();
    const svix_id = (await headerPayload).get("svix-id");
    const svix_timestamp = (await headerPayload).get("svix-timestamp");
    const svix_signature = (await headerPayload).get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing headers", { status: 400 });
    }

    const payload = await req.json();

    const body  = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature}) as WebhookEvent
    } catch (error) {
        console.error('error verifying webhook', error);
        return new Response("Error verifying webhook", { status: 400 });
        
    }

    const { id } = evt.data;
    const eventType = evt.type;

    //logs

    if(eventType === "user.created") {
     try {

            const {email_addresses,primary_email_address_id} = evt.data
            //log practic
        const primaryEmail = email_addresses.find(
            (email) => email.id === primary_email_address_id
          );

          if (!primaryEmail) {
            return new Response("Missing primary email address", { status: 400 });
          }

          //create a user in neon

         const newUser =  await prisma.user.create({
            data: {
                id: evt.data.id!,
              email: primaryEmail.email_address,
              isSubscribed: false
            },
          });
         
          console.log('NEW USER CREATED',newUser)
     } catch (error) {
        console.error('error creating user', error);
        return new Response("Error creating user", { status: 400 });
        
     }
    }

    return new Response("WEbhook recieved succesfully", { status: 200 });
}
