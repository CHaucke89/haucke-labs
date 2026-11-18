-- One row per GitHub account, so each visitor has at most one note.
CREATE TABLE guestbook (
	user_id INTEGER PRIMARY KEY,
	login TEXT NOT NULL,
	message TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX guestbook_created_at ON guestbook (created_at DESC);
