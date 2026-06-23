const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin(email) {
  if (!email) {
    console.error("Usage: node makeAdmin.js <email>");
    process.exit(1);
  }

  console.log(`Looking up user with email: ${email}...`);
  
  const { data: user, error } = await supabase
    .from('User')
    .select('id, username, email, is_admin')
    .eq('email', email)
    .single();

  if (error || !user) {
    console.error("Error finding user. Are you sure they have logged in via Google at least once?");
    console.error(error?.message || "User not found.");
    process.exit(1);
  }

  if (user.is_admin) {
    console.log(`User ${user.username} (${user.email}) is already an admin.`);
    process.exit(0);
  }

  console.log(`Promoting ${user.username} to admin...`);

  const { error: updateError } = await supabase
    .from('User')
    .update({ is_admin: true })
    .eq('id', user.id);

  if (updateError) {
    console.error("Failed to promote user:", updateError.message);
    process.exit(1);
  }

  console.log("Success! They now have access to the /admin dashboard.");
}

const email = process.argv[2];
makeAdmin(email);
