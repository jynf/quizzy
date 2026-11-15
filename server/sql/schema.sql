CREATE TABLE IF NOT EXISTS question_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  question_set_id TEXT NOT NULL
    REFERENCES question_sets(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  position INTEGER NOT NULL,
  UNIQUE (question_set_id, position)
);

CREATE TABLE IF NOT EXISTS answer_choices (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL
    REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  UNIQUE (question_id, position)
);