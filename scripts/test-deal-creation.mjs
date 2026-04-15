import fs from "fs"
const env = fs.readFileSync(".env.local", "utf8")
const token = env.split("\n").find(l => l.startsWith("HUBSPOT_TOKEN=")).split("=")[1].trim()

async function run() {
  console.log("Probando batch API de asociaciones...");
  const dealIds = ["59176966762"]
  const associationsRes = await fetch(`https://api.hubapi.com/crm/v3/associations/deals/contacts/batch/read`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: dealIds.map(id => ({ id })) })
  }).then(r => {
    if (!r.ok) { console.error("Error batch asoc:", r.status); return { results: [] }; }
    return r.json()
  }).catch(e => {
    console.error("Fetch error:", e.message); return { results: [] };
  })
  console.log("Res:", JSON.stringify(associationsRes, null, 2))
}
run()
