import { useActionState, useEffect, useState } from 'react';
import { loginUrl, PROVIDER_IDS, PROVIDERS, type SessionUser } from '../../src/lib/auth.ts';
import { formatDate } from '../../src/lib/github.ts';
import {
	MAX_MESSAGE,
	profileUrl,
	type GuestbookEntry,
	type GuestbookState
} from '../../src/lib/guestbook.ts';

const API = '/api/guestbook';

type Status = { error: string } | { saved: true } | null;
type Intent = { type: 'save'; message: string } | { type: 'delete' };

async function request(init?: RequestInit): Promise<GuestbookState> {
	const res = await fetch(API, init);
	const body = await res.json().catch(() => null);
	if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : 'Something went wrong. Try again.');
	return body;
}

export function Guestbook() {
	const [state, setState] = useState<GuestbookState | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);

	const load = () => {
		setLoadFailed(false);
		request().then(setState, () => setLoadFailed(true));
	};
	useEffect(load, []);

	const [status, dispatch, saving] = useActionState(async (_: Status, intent: Intent): Promise<Status> => {
		try {
			if (intent.type === 'save') {
				setState(
					await request({
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ message: intent.message })
					})
				);
				return { saved: true };
			}
			setState(await request({ method: 'DELETE' }));
			return null;
		} catch (e) {
			return { error: (e as Error).message };
		}
	}, null);

	if (loadFailed) {
		return (
			<p className="error" role="alert">
				Couldn’t load the guestbook.{' '}
				<button type="button" className="secondary" onClick={load}>
					Retry
				</button>
			</p>
		);
	}
	if (!state) return <p className="empty">Loading…</p>;
	if (!state.available) return <p className="empty">The guestbook isn’t available here.</p>;

	return (
		<>
			{state.user ? (
				// A new key remounts the form, so the draft resets to the saved note after each change.
				<NoteForm
					key={state.mine?.updatedAt ?? 'new'}
					user={state.user}
					mine={state.mine}
					status={status}
					saving={saving}
					dispatch={dispatch}
				/>
			) : (
				<>
					<p>Sign in to leave a note:</p>
					<div className="row">
						{PROVIDER_IDS.map((id) => (
							<a key={id} className="signin" href={loginUrl(id, location.pathname)}>
								Sign in with {PROVIDERS[id]}
							</a>
						))}
					</div>
				</>
			)}
			{state.entries.length === 0 ? (
				<p className="empty">No notes yet. Be the first.</p>
			) : (
				<ol className="entries">
					{state.entries.map((entry) => (
						<Entry key={`${entry.provider}:${entry.userId}`} entry={entry} />
					))}
				</ol>
			)}
		</>
	);
}

interface NoteFormProps {
	user: SessionUser;
	mine: GuestbookEntry | null;
	status: Status;
	saving: boolean;
	dispatch: (intent: Intent) => void;
}

function NoteForm({ user, mine, status, saving, dispatch }: NoteFormProps) {
	const [draft, setDraft] = useState(mine?.message ?? '');
	const length = [...draft].length;

	return (
		<form action={() => dispatch({ type: 'save', message: draft })}>
			<label htmlFor="message">
				Signed in with {PROVIDERS[user.provider]} as <strong>{user.name}</strong>.{' '}
				{mine ? 'Edit your note' : 'Leave a note'}:
			</label>
			<textarea
				id="message"
				name="message"
				rows={3}
				maxLength={MAX_MESSAGE * 2}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
			/>
			<div className="row">
				<span className={`count mono${length > MAX_MESSAGE ? ' over' : ''}`}>
					{length}/{MAX_MESSAGE}
				</span>
				{status && 'error' in status && (
					<span className="error" role="alert">
						{status.error}
					</span>
				)}
				{status && 'saved' in status && (
					<span className="saved" role="status">
						Saved. Thanks!
					</span>
				)}
				{mine && (
					<button
						type="submit"
						className="secondary"
						disabled={saving}
						formAction={() => dispatch({ type: 'delete' })}
					>
						Delete
					</button>
				)}
				<button type="submit" disabled={saving || length === 0 || length > MAX_MESSAGE}>
					{mine ? 'Update' : 'Sign'}
				</button>
			</div>
		</form>
	);
}

function Entry({ entry }: { entry: GuestbookEntry }) {
	const profile = profileUrl(entry);
	return (
		<li>
			{entry.avatar ? (
				<img
					className="avatar"
					src={entry.avatar}
					alt=""
					width={40}
					height={40}
					loading="lazy"
					referrerPolicy="no-referrer"
				/>
			) : (
				<span className="avatar initial" aria-hidden="true">
					{entry.name.charAt(0).toUpperCase()}
				</span>
			)}
			<div>
				<p className="meta">
					{profile ? <a href={profile}>{entry.name}</a> : <strong>{entry.name}</strong>}
					<span className="via">via {PROVIDERS[entry.provider]}</span>
					<time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
				</p>
				<p className="message">{entry.message}</p>
			</div>
		</li>
	);
}
