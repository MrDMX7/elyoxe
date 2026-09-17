/* The contact-form endpoint: API Gateway → Lambda → SES, deployed from
   ~/workspace/automation/contact-form. Mirrors `contact_endpoint` in ../site.json. */
export const CONTACT_ENDPOINT = "https://hybw54y21l.execute-api.ap-south-1.amazonaws.com/";

/* The public demo of the reply engine: API Gateway → Lambda → Claude, deployed
   from ~/workspace/saas/whatsapp-agent (stack `elyoxe-wa-agent`, ap-south-1).
   Same src/, same agent.py as the WhatsApp webhook — a different door, with a
   daily cap and nothing written down. */
export const DEMO_ENDPOINT = "https://s6kue5dqub.execute-api.ap-south-1.amazonaws.com/prod/demo";
