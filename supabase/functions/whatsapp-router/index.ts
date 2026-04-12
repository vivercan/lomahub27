import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

// Types
interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WebhookChange {
  value: {
    messages?: WebhookMessage[];
    statuses?: Array<{ id: string; status: string }>;
    messaging_product: string;
    metadata: { phone_number_id: string; display_phone_number: string };
  };
}

interface WebhookEntry {
  changes: WebhookChange[];
}

interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

interface RoutingResult {
  shouldRoute: boolean;
  system: "lomahub27" | "aria27" | "unknown";
  phoneNumber: string;
  foundInTables: string[];
}

// Initialize Supabase client
function createSupabaseClient(): ReturnType<typeof createClient> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, supabaseKey);
}

// Check if phone number exists in LomaHUB27's database
async function isPhoneInLomaHUB27(
  supabase: ReturnType<typeof createClient>,
  phoneNumber: string
): Promise<RoutingResult> {
  const foundInTables: string[] = [];
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  try {
    const { data: autorizados, error: authError } = await supabase
      .from("whatsapp_autorizados")
      .select("id")
      .or(`telefono.eq.${cleanPhone},telefono.eq.+${cleanPhone}`)
      .limit(1);
    if (authError && authError.code !== "PGRST116") {
      console.error("Error checking whatsapp_autorizados:", authError);
    } else if (autorizados && autorizados.length > 0) {
      foundInTables.push("whatsapp_autorizados");
    }
    const { data: clientes, error: clientError } = await supabase
      .from("clientes")
      .select("id")
      .or(`contacto_telefono.eq.${cleanPhone},contacto_telefono.eq.+${cleanPhone}`)
      .limit(1);
    if (clientError && clientError.code !== "PGRST116") {
      console.error("Error checking clientes:", clientError);
    } else if (clientes && clientes.length > 0) {
      foundInTables.push("clientes");
    }
  } catch (error) {
    console.error("Database error checking phone in LomaHUB27:", error);
    return { shouldRoute: true, system: "aria27", phoneNumber, foundInTables: [] };
  }
  if (foundInTables.length > 0) {
    return { shouldRoute: true, system: "lomahub27", phoneNumber, foundInTables };
  }
  return { shouldRoute: true, system: "aria27", phoneNumber, foundInTables: [] };
}

// Call LomaHUB27's WhatsApp webhook handler
async function callLomaHUB27Handler(payload: WebhookPayload): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl) {
    console.error("Cannot call LomaHUB27 handler: missing SUPABASE_URL");
    return new Response(JSON.stringify({ error: "Failed to route to LomaHUB27 handler", timestamp: new Date().toISOString() }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const lomaHUB27HandlerUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
  try {
    const response = await fetch(lomaHUB27HandlerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify(payload),
    });
    console.log(`[LomaHUB27 Handler] Status: ${response.status}, StatusText: ${response.statusText}`);
    return new Response(JSON.stringify({ success: true, routed_to: "lomahub27", handler_status: response.status }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error calling LomaHUB27 handler:", error);
    return new Response(JSON.stringify({ error: "Failed to contact LomaHUB27 handler", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// Forward webhook to aria27
async function forwardToAria27(payload: WebhookPayload): Promise<Response> {
  const aria27Url = Deno.env.get("ARIA27_WEBHOOK_URL");
  if (!aria27Url) {
    console.error("Cannot forward to aria27: missing ARIA27_WEBHOOK_URL environment variable");
    return new Response(JSON.stringify({ error: "aria27 webhook URL not configured", timestamp: new Date().toISOString() }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    const response = await fetch(aria27Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[aria27 Forward] Status: ${response.status}, StatusText: ${response.statusText}`);
    return new Response(JSON.stringify({ success: true, routed_to: "aria27", remote_status: response.status }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error forwarding to aria27:", error);
    return new Response(JSON.stringify({ error: "Failed to forward to aria27", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// Extract phone number from webhook payload
function extractPhoneNumber(payload: WebhookPayload): string | null {
  try {
    const entry = payload.entry?.[0];
    if (!entry) return null;
    const change = entry.changes?.[0];
    if (!change) return null;
    const message = change.value?.messages?.[0];
    if (!message || !message.from) return null;
    return message.from;
  } catch (error) {
    console.error("Error extracting phone number:", error);
    return null;
  }
}

// Validate Meta webhook signature
function validateWebhookToken(token: string | null): boolean {
  const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
  if (!expectedToken) {
    console.warn("WHATSAPP_WEBHOOK_VERIFY_TOKEN not set - webhook validation disabled");
    return true;
  }
  return token === expectedToken;
}

// Main handler
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Handle GET requests (Meta verification challenge)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");
    const token = url.searchParams.get("hub.verify_token");
    console.log(`[GET] Verification request - mode: ${mode}`);
    if (mode === "subscribe" && challenge) {
      if (!validateWebhookToken(token)) {
        console.warn("[GET] Invalid verification token");
        return new Response("Unauthorized", { status: 403 });
      }
      console.log("[GET] Verification successful - returning challenge");
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Bad Request", { status: 400 });
  }

  // Handle POST requests (webhook messages)
  if (req.method === "POST") {
    let payload: WebhookPayload;
    try {
      payload = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    console.log("[POST] Webhook received", { object: payload.object, entry_count: payload.entry?.length || 0, timestamp: new Date().toISOString() });
    if (payload.object !== "whatsapp_business_account") {
      console.warn("[POST] Invalid object type:", payload.object);
      return new Response("OK", { status: 200 });
    }
    const phoneNumber = extractPhoneNumber(payload);
    if (!phoneNumber) {
      console.log("[POST] No messages found in webhook - likely status update");
      return new Response("OK", { status: 200 });
    }
    console.log(`[POST] Message from: ${phoneNumber}`);
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createSupabaseClient();
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      console.log("[POST] DB initialization failed - forwarding to aria27 as fallback");
      return forwardToAria27(payload);
    }
    let routing: RoutingResult;
    try {
      routing = await isPhoneInLomaHUB27(supabase, phoneNumber);
    } catch (error) {
      console.error("Routing check failed:", error);
      routing = { shouldRoute: true, system: "aria27", phoneNumber, foundInTables: [] };
    }
    console.log("[POST] Routing decision:", { phoneNumber, system: routing.system, foundInTables: routing.foundInTables });
    if (routing.system === "lomahub27") {
      console.log("[POST] Routing to LomaHUB27 handler");
      return callLomaHUB27Handler(payload);
    } else {
      console.log("[POST] Routing to aria27");
      return forwardToAria27(payload);
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
}

// Start the edge function
Deno.serve(handler);
