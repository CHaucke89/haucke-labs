-- Daily question counts for /ask. `visitor` is a salted hash of the IP, or '*' for the site-wide total.
CREATE TABLE ask_usage (
	day TEXT NOT NULL,
	visitor TEXT NOT NULL,
	count INTEGER NOT NULL,
	PRIMARY KEY (day, visitor)
);
