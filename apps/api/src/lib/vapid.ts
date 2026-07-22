import webpush from "web-push";

export const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

export const hasVapidConfig = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

let configured = false;

export function configureWebPush(): void {
  if (configured || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  configured = true;
}
