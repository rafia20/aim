-- AIM Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  city VARCHAR(100),
  budget_weekly NUMERIC(10,2),
  cooking_days INTEGER,
  prep_minutes INTEGER,
  household_size INTEGER DEFAULT 1,
  on_relevant_medication BOOLEAN DEFAULT FALSE
);

-- User profile
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bodyweight_kg NUMERIC(6,2),
  height_cm NUMERIC(6,2),
  sex VARCHAR(20),
  age INTEGER,
  dietary_preferences JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  UNIQUE(user_id)
);

-- Goals (protocol module catalog - seeded from config)
CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  evidence_tier VARCHAR(20) NOT NULL,
  timeline_weeks INTEGER NOT NULL,
  food_policy JSONB NOT NULL,
  endpoint JSONB NOT NULL,
  target_rules JSONB NOT NULL,
  evidence_sources JSONB NOT NULL,
  evaluation_rule JSONB NOT NULL,
  intake_questions JSONB NOT NULL
);

-- User goals
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id VARCHAR(50) REFERENCES goals(id),
  started_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done'))
);

-- Baselines (day-zero endpoint capture)
CREATE TABLE IF NOT EXISTS baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  metric VARCHAR(100) NOT NULL,
  value NUMERIC(10,2),
  photo_url TEXT,
  captured_at TIMESTAMP DEFAULT NOW()
);

-- Food items
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  tags JSONB DEFAULT '[]',
  protein_g NUMERIC(8,2) DEFAULT 0,
  fiber_g NUMERIC(8,2) DEFAULT 0,
  glycemic_load NUMERIC(8,2) DEFAULT 0,
  fermented BOOLEAN DEFAULT FALSE,
  calories_per_100g NUMERIC(8,2) DEFAULT 0,
  serving_size_g NUMERIC(8,2) DEFAULT 100
);

-- Food prices by city
CREATE TABLE IF NOT EXISTS food_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  est_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  week_index INTEGER NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grocery lists
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_cost NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nudges log
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  swap_from VARCHAR(200),
  swap_to VARCHAR(200),
  reason TEXT,
  accepted BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tracking logs
CREATE TABLE IF NOT EXISTS tracking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  metric VARCHAR(100) NOT NULL,
  value NUMERIC(10,2),
  notes TEXT,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Progress evaluations
CREATE TABLE IF NOT EXISTS progress_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  evaluated_at TIMESTAMP DEFAULT NOW(),
  baseline_value NUMERIC(10,2),
  current_value NUMERIC(10,2),
  delta NUMERIC(10,2),
  is_working BOOLEAN
);
