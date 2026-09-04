import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("Copiá estas claves:");
console.log("");
console.log("# En Next (.env):");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log("");
console.log("# En Supabase Edge Function (supabase secrets set):");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:TU@MAIL.COM");
console.log("PUSH_WEBHOOK_SECRET=<clave larga aleatoria, ej. openssl rand -hex 32>");
console.log("");
console.log(
  "Además, seteá en la DB (scripts/seed-push-config.mjs) push_function_url y push_webhook_secret con el mismo secret.",
);