const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = fs.readFileSync("./src/.env", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

env.split("\n").forEach(line => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) supabaseKey = line.split("=")[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count, error } = await supabase.from("UserPrediction").select("*", { count: 'exact', head: true });
  console.log("Prediction count:", count);
  if (error) console.error("Error:", error);
}
check();
