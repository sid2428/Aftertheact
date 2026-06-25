CREATE OR REPLACE FUNCTION score_episode_predictions(p_episode_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_episode RECORD;
    v_top_score FLOAT;
    v_bottom_score FLOAT;
    v_avg_divergence FLOAT;
    v_actual_alignment VARCHAR(20);
    v_prediction RECORD;
    
    v_top_correct BOOLEAN;
    v_bottom_correct BOOLEAN;
    v_align_correct BOOLEAN;
    v_base_points INTEGER;
    v_total_points INTEGER;
    
    v_user_totals RECORD;
    v_new_season_lp INTEGER;
    v_new_alltime_lp INTEGER;
    v_new_qualifying INTEGER;
    
    v_badge_ladder JSONB;
BEGIN
    -- 1. Idempotency Lock
    -- Select FOR UPDATE to lock the episode row during this transaction
    SELECT * INTO v_episode FROM "Episode" WHERE id = p_episode_id FOR UPDATE;
    
    IF v_episode.is_revelation_triggered THEN
        -- Already triggered, fail silently (idempotent)
        RETURN;
    END IF;

    -- 2. Determine Actual Outcomes
    -- Top score
    SELECT MAX(peoples_verdict_weighted) INTO v_top_score FROM "ContestantEpisodeAppearance" WHERE episode_id = p_episode_id;
    -- Bottom score
    SELECT MIN(peoples_verdict_weighted) INTO v_bottom_score FROM "ContestantEpisodeAppearance" WHERE episode_id = p_episode_id;
    
    -- Alignment
    SELECT AVG(ABS(COALESCE(peoples_verdict_weighted, 0) - COALESCE(judge_average, 0))) INTO v_avg_divergence
    FROM "ContestantEpisodeAppearance" WHERE episode_id = p_episode_id;
    
    IF v_avg_divergence < 1.5 THEN
        v_actual_alignment := 'ALIGNED';
    ELSE
        -- Without full sentiment analysis, we'll assume HARSH for divergence if Judges were harsher, etc. 
        -- For V1, if it's diverged, we check if judge_avg < peoples_verdict
        -- Let's do a simple check: sum of judge vs sum of people
        DECLARE
            v_sum_judge FLOAT;
            v_sum_people FLOAT;
        BEGIN
            SELECT SUM(judge_average), SUM(peoples_verdict_weighted) INTO v_sum_judge, v_sum_people FROM "ContestantEpisodeAppearance" WHERE episode_id = p_episode_id;
            IF v_sum_judge < v_sum_people THEN
                v_actual_alignment := 'HARSH';
            ELSE
                v_actual_alignment := 'GENEROUS';
            END IF;
        END;
    END IF;

    -- Update all user predictions with actuals
    UPDATE "UserPrediction" SET actual_alignment = v_actual_alignment WHERE episode_id = p_episode_id;

    -- 3. Loop through Predictions
    FOR v_prediction IN SELECT * FROM "UserPrediction" WHERE episode_id = p_episode_id LOOP
        
        -- Check if episode was a single contestant episode
        IF v_top_score = v_bottom_score THEN
            UPDATE "UserPrediction" SET points_earned = 0 WHERE id = v_prediction.id;
            CONTINUE;
        END IF;

        -- Top Correct?
        SELECT EXISTS(
            SELECT 1 FROM "ContestantEpisodeAppearance" 
            WHERE episode_id = p_episode_id AND contestant_id = v_prediction.predicted_top_contestant_id AND peoples_verdict_weighted = v_top_score
        ) INTO v_top_correct;
        
        -- Bottom Correct?
        SELECT EXISTS(
            SELECT 1 FROM "ContestantEpisodeAppearance" 
            WHERE episode_id = p_episode_id AND contestant_id = v_prediction.predicted_bottom_contestant_id AND peoples_verdict_weighted = v_bottom_score
        ) INTO v_bottom_correct;
        
        v_align_correct := (v_prediction.predicted_alignment = v_actual_alignment);
        
        v_base_points := 0;
        IF v_top_correct THEN v_base_points := v_base_points + 50; END IF;
        IF v_bottom_correct THEN v_base_points := v_base_points + 50; END IF;
        IF v_align_correct THEN v_base_points := v_base_points + 100; END IF;
        
        v_total_points := v_base_points;
        IF v_top_correct AND v_bottom_correct AND v_align_correct THEN
            v_total_points := v_base_points * 2; -- Perfect Oracle Bonus
        END IF;
        
        UPDATE "UserPrediction" SET 
            top_correct = v_top_correct,
            bottom_correct = v_bottom_correct,
            alignment_correct = v_align_correct,
            points_earned = v_total_points
        WHERE id = v_prediction.id;
        
        IF v_total_points > 0 THEN
            INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
            VALUES (v_prediction.user_id, p_episode_id, 'prediction_score', v_total_points)
            ON CONFLICT (user_id, episode_id, action_type) DO NOTHING;
        END IF;
        
        -- Aggregate
        SELECT latent_points_season, latent_points_alltime, oracle_qualifying_episodes, badges 
        INTO v_user_totals FROM "User" WHERE id = v_prediction.user_id;
        
        v_new_season_lp := COALESCE(v_user_totals.latent_points_season, 0) + v_total_points;
        v_new_alltime_lp := COALESCE(v_user_totals.latent_points_alltime, 0) + v_total_points;
        v_new_qualifying := COALESCE(v_user_totals.oracle_qualifying_episodes, 0) + 1;
        
        -- Badges
        v_badge_ladder := COALESCE(v_user_totals.badges, '[]');
        
        -- Perfect Oracle
        IF v_top_correct AND v_bottom_correct AND v_align_correct THEN
            IF NOT (v_badge_ladder @> '["Perfect Oracle"]'::jsonb) THEN
                v_badge_ladder := v_badge_ladder || '["Perfect Oracle"]'::jsonb;
            END IF;
        END IF;
        
        -- Tier badges (Highest earned overrides lower)
        IF v_new_season_lp >= 3000 THEN
            v_badge_ladder := v_badge_ladder - 'Initiate' - 'Seer' - 'Oracle' || '["Prophet"]'::jsonb;
        ELSIF v_new_season_lp >= 1200 THEN
            v_badge_ladder := v_badge_ladder - 'Initiate' - 'Seer' || '["Oracle"]'::jsonb;
        ELSIF v_new_season_lp >= 400 THEN
            v_badge_ladder := v_badge_ladder - 'Initiate' || '["Seer"]'::jsonb;
        ELSE
            -- Base tier if none others exist
            IF NOT (v_badge_ladder @> '["Initiate"]'::jsonb OR v_badge_ladder @> '["Seer"]'::jsonb OR v_badge_ladder @> '["Oracle"]'::jsonb OR v_badge_ladder @> '["Prophet"]'::jsonb) THEN
                v_badge_ladder := v_badge_ladder || '["Initiate"]'::jsonb;
            END IF;
        END IF;

        UPDATE "User" SET 
            latent_points_season = v_new_season_lp,
            latent_points_alltime = v_new_alltime_lp,
            oracle_qualifying_episodes = v_new_qualifying,
            badges = v_badge_ladder
        WHERE id = v_prediction.user_id;
        
    END LOOP;
    
    -- 4. Recompute Oracle Scores globally
    -- oracle_score = total_base / (200 * qualifying)
    UPDATE "User" u SET oracle_score = (
        SELECT COALESCE(
            SUM(
                CASE WHEN top_correct THEN 50 ELSE 0 END +
                CASE WHEN bottom_correct THEN 50 ELSE 0 END +
                CASE WHEN alignment_correct THEN 100 ELSE 0 END
            ) / NULLIF(200.0 * u.oracle_qualifying_episodes, 0), 0)
        FROM "UserPrediction" WHERE user_id = u.id AND points_earned IS NOT NULL
    )
    WHERE u.id IS NOT NULL; -- satisfies pg-safeupdate; matches all users

    -- 5. Ranks (Using Window Functions!)
    WITH Ranks AS (
        SELECT id,
            DENSE_RANK() OVER (ORDER BY latent_points_season DESC) as s_rank,
            DENSE_RANK() OVER (ORDER BY latent_points_alltime DESC) as a_rank
        FROM "User"
    )
    UPDATE "User" u SET 
        season_rank = r.s_rank,
        alltime_rank = r.a_rank
    FROM Ranks r WHERE u.id = r.id;

    -- 6. Mark Episode Revealed
    UPDATE "Episode" SET status = 'REVEALED', is_revelation_triggered = true WHERE id = p_episode_id;

END;
$$;
