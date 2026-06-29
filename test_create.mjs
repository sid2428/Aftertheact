import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: epData, error: epError } = await supabase
    .from("Episode")
    .select("id")
    .limit(1);
    
  if (epError || !epData.length) {
    console.error("No episodes found", epError);
    return;
  }
  const episodeId = epData[0].id;
  const data = {
    name: "Test User",
    talent_type: "Singing",
    bio: "Test bio",
    judge_average: 8.5,
    self_score: 9,
    peoples_verdict_weighted: 8
  };
  
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
  
  const { data: newContestant, error: contestantError } = await supabase
    .from("Contestant")
    .insert({
      name: data.name,
      slug: slug,
      talent_type: data.talent_type,
      bio: data.bio
    })
    .select("id")
    .single();

  if (contestantError) {
    console.error("Contestant creation failed:", contestantError);
    return;
  }

  const { error: appearanceError } = await supabase
    .from("ContestantEpisodeAppearance")
    .insert({
      contestant_id: newContestant.id,
      episode_id: episodeId,
      judge_average: parseFloat(data.judge_average || 0),
      self_score: parseFloat(data.self_score || 0),
      peoples_verdict_weighted: parseFloat(data.peoples_verdict_weighted || 0)
    });

  if (appearanceError) {
    console.error("Appearance creation failed:", appearanceError);
  } else {
    console.log("Successfully added contestant to episode!");
  }
  
  // Cleanup
  await supabase.from("ContestantEpisodeAppearance").delete().eq("contestant_id", newContestant.id);
  await supabase.from("Contestant").delete().eq("id", newContestant.id);
}
test();
