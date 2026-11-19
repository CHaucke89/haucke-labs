-- Keys notes by (provider, provider_user_id) so GitHub and Google accounts stay separate.
-- SQLite can't change a primary key in place, so the table is rebuilt.
CREATE TABLE guestbook_new (
	provider TEXT NOT NULL,
	provider_user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	avatar_url TEXT,
	message TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	PRIMARY KEY (provider, provider_user_id)
);

INSERT INTO guestbook_new
SELECT 'github', CAST(user_id AS TEXT), login, 'https://avatars.githubusercontent.com/u/' || user_id || '?s=80',
	message, created_at, updated_at
FROM guestbook;

DROP TABLE guestbook;
ALTER TABLE guestbook_new RENAME TO guestbook;

CREATE INDEX guestbook_created_at ON guestbook (created_at DESC);
