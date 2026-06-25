import { getServiceSupabase } from "./src/lib/supabase.js";
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

async function check() {
  const supabase = getServiceSupabase();
  const { count, error } = await supabase.from("UserPrediction").select("*", { count: 'exact', head: true });
  console.log("Prediction count:", count);
  if (error) console.error("Error:", error);
}
check();
