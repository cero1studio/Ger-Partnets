import fs from "fs"
const env = fs.readFileSync(".env.local", "utf8")
const token = env.split("\n").find(l => l.startsWith("HUBSPOT_TOKEN=")).split("=")[1].trim()

async function hsPost(path, body) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function run() {
  try {
    const dealsWithAssocData = await hsPost("/crm/v4/objects/deals/batch/read", {
      inputs: [{ id: "59176966762" }],
      properties: ["dealname"]
    })
    console.log("Resultado v4:", JSON.stringify(dealsWithAssocData, null, 2))
  } catch(e) {
    console.error("Error:", e.message)
  }
}
run()
