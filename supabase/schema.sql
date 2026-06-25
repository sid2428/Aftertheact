-- AfterTheAct Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: User
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    google_id TEXT,
    trust_score FLOAT DEFAULT 0.3,
    trust_score_signals JSONB DEFAULT '{"age": 0, "diversity": 0, "prediction": 0, "activity": 0, "moderation": 0.15, "validation": 0}',
    trust_score_updated_at TIMESTAMP WITH TIME ZONE,
    latent_points_alltime INTEGER DEFAULT 0,
    latent_points_season INTEGER DEFAULT 0,
    season_rank INTEGER,
    alltime_rank INTEGER,
    oracle_score FLOAT DEFAULT 0.0,
    oracle_qualifying_episodes INTEGER DEFAULT 0,
    voting_personality_tag VARCHAR(50),
    is_shadow_banned BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    badges JSONB DEFAULT '[]',
    referral_code VARCHAR(20) UNIQUE,
    referred_by_user_id UUID REFERENCES "User"(id),
    notification_prefs JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Episode
CREATE TABLE IF NOT EXISTS "Episode" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    air_date TIMESTAMP WITH TIME ZONE NOT NULL,
    voting_window_open TIMESTAMP WITH TIME ZONE,
    voting_window_close TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'REVEALED', 'ARCHIVED')),
    is_revelation_triggered BOOLEAN DEFAULT false,
    admin_note TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (season_number, episode_number)
);

-- Table: Contestant
CREATE TABLE IF NOT EXISTS "Contestant" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    talent_type VARCHAR(100),
    bio VARCHAR(280),
    image_url TEXT,
    social_url TEXT,
    is_removed_by_request BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: ContestantEpisodeAppearance
CREATE TABLE IF NOT EXISTS "ContestantEpisodeAppearance" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contestant_id UUID REFERENCES "Contestant"(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES "Episode"(id) ON DELETE CASCADE,
    judge_scores JSONB DEFAULT '[]',
    judge_average FLOAT,
    self_score FLOAT,
    peoples_verdict_raw FLOAT,
    peoples_verdict_weighted FLOAT,
    latent_score FLOAT,
    controversy_flag BOOLEAN DEFAULT false,
    total_votes_raw INTEGER DEFAULT 0,
    total_votes_weighted FLOAT DEFAULT 0.0,
    UNIQUE (contestant_id, episode_id)
);

-- Table: UserVote
CREATE TABLE IF NOT EXISTS "UserVote" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES "Episode"(id) ON DELETE CASCADE,
    contestant_id UUID REFERENCES "Contestant"(id) ON DELETE CASCADE,
    score NUMERIC(3,1) CHECK (score BETWEEN 1 AND 10), -- 1.0–10.0, 0.1 precision
    trust_score_at_vote FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, episode_id, contestant_id)
);

-- Table: UserPrediction
CREATE TABLE IF NOT EXISTS "UserPrediction" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES "Episode"(id) ON DELETE CASCADE,
    predicted_top_contestant_id UUID REFERENCES "Contestant"(id) ON DELETE CASCADE,
    predicted_bottom_contestant_id UUID REFERENCES "Contestant"(id) ON DELETE CASCADE,
    predicted_alignment VARCHAR(20) CHECK (predicted_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS')),
    actual_alignment VARCHAR(20) CHECK (actual_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS')),
    top_correct BOOLEAN,
    bottom_correct BOOLEAN,
    alignment_correct BOOLEAN,
    points_earned INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, episode_id)
);

-- Table: Roast
CREATE TABLE IF NOT EXISTS "Roast" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    contestant_id UUID REFERENCES "Contestant"(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES "Episode"(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    upvote_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    moderation_status VARCHAR(20) DEFAULT 'PUBLISHED' CHECK (moderation_status IN ('PUBLISHED', 'HELD', 'REMOVED')),
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: RoastUpvote
CREATE TABLE IF NOT EXISTS "RoastUpvote" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roast_id UUID REFERENCES "Roast"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (roast_id, user_id)
);

-- Table: LatentPointsLedger
CREATE TABLE IF NOT EXISTS "LatentPointsLedger" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES "Episode"(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, episode_id, action_type)
);

-- Table: ModerationLog
CREATE TABLE IF NOT EXISTS "ModerationLog" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roast_id UUID REFERENCES "Roast"(id) ON DELETE SET NULL,
    action VARCHAR(20) CHECK (action IN ('HELD', 'APPROVED', 'REMOVED', 'SHADOW_BANNED')),
    moderator_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    reason_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp (example if needed later)
-- CREATE OR REPLACE FUNCTION update_modified_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Table: CommunityPost
CREATE TABLE IF NOT EXISTS "CommunityPost" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    contestant_tag UUID REFERENCES "Contestant"(id) ON DELETE SET NULL,
    episode_tag UUID REFERENCES "Episode"(id) ON DELETE SET NULL,
    text VARCHAR(280) NOT NULL,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    moderation_status VARCHAR(20) DEFAULT 'VISIBLE' CHECK (moderation_status IN ('VISIBLE', 'HELD', 'REMOVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: CommunityPostLike
CREATE TABLE IF NOT EXISTS "CommunityPostLike" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Table: JudgeRating
CREATE TABLE IF NOT EXISTS "JudgeRating" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    harshness_score INTEGER NOT NULL CHECK (harshness_score BETWEEN 1 AND 10),
    accuracy_score INTEGER NOT NULL CHECK (accuracy_score BETWEEN 1 AND 10),
    entertainment_score INTEGER NOT NULL CHECK (entertainment_score BETWEEN 1 AND 10),
    comment VARCHAR(280),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(judge_id, user_id)
);

-- Table: PostReport
CREATE TABLE IF NOT EXISTS "PostReport" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
    reporter_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (post_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_postreport_post ON "PostReport"(post_id);
ALTER TABLE "PostReport" ENABLE ROW LEVEL SECURITY;
