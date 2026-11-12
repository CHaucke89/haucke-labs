export type NodeKind = 'mine' | 'upstream' | 'store' | 'external';

export type DiagramNode = {
	id: string;
	label: string;
	sub?: string;
	x: number;
	y: number;
	w?: number;
	h?: number;
	kind: NodeKind;
	detail: string;
};

export type DiagramEdge = {
	from: string;
	to: string;
	label?: string;
	/** Explicit polyline points; otherwise a straight line between facing sides. */
	points?: [number, number][];
	/** Shared x (vertical edge) or y (horizontal edge) for straight edges. */
	at?: number;
	labelAt?: [number, number];
	/** Put a vertical edge's label on its left instead of its right. */
	labelLeft?: boolean;
	both?: boolean;
	dashed?: boolean;
};

export type DiagramGroup = {
	label: string;
	x: number;
	y: number;
	w: number;
	h: number;
	labelBottom?: boolean;
};

export type Diagram = {
	title: string;
	caption: string;
	width: number;
	height: number;
	groups: DiagramGroup[];
	nodes: DiagramNode[];
	edges: DiagramEdge[];
};

export const NODE_W = 170;
export const NODE_H = 56;

const remoteUi: Diagram = {
	title: 'How a frame gets from the car’s screen to your browser',
	caption:
		'Frames flow left to right through shared memory and a WebSocket. Touch input flows back right to left through a Unix socket.',
	width: 940,
	height: 400,
	groups: [
		{ label: 'comma device', x: 10, y: 20, w: 690, h: 370 },
		{ label: 'UI process (raylib)', x: 30, y: 56, w: 210, h: 318 },
		{ label: 'Phone or laptop', x: 720, y: 20, w: 210, h: 370 }
	],
	nodes: [
		{
			id: 'render',
			label: 'Render loop',
			sub: 'raylib / pyray',
			x: 50,
			y: 90,
			kind: 'upstream',
			detail:
				'openpilot’s own UI, drawn every frame with raylib through its Python bindings. The streamer and injector plug into this process so they can see exactly what the screen shows.'
		},
		{
			id: 'streamer',
			label: 'Frame streamer',
			sub: 'capture + JPEG encode',
			x: 50,
			y: 200,
			kind: 'mine',
			detail:
				'Reads the framebuffer on the render thread, then hands the pixels to a worker thread that resizes and JPEG-encodes them, so the UI never waits on encoding. It only captures while a browser is connected.'
		},
		{
			id: 'injector',
			label: 'Touch injector',
			sub: 'patched pyray input',
			x: 50,
			y: 300,
			kind: 'mine',
			detail:
				'Listens on a Unix socket for JSON input events and patches pyray’s polled input functions, so the UI treats remote taps, drags and scrolls like real touchscreen input.'
		},
		{
			id: 'shm',
			label: 'Shared memory',
			sub: 'POSIX shm + header',
			x: 280,
			y: 200,
			w: 160,
			kind: 'store',
			detail:
				'A fixed-size POSIX shared memory block: a 31-byte packed header (timestamp, size, dimensions, ready flag) followed by the JPEG. The image is written first and the header last, so the reader never picks up a half-written frame.'
		},
		{
			id: 'sock',
			label: 'Unix socket',
			sub: '/tmp/ui_touch_socket',
			x: 280,
			y: 300,
			w: 160,
			kind: 'store',
			detail:
				'A local socket that carries input events from the web server into the UI process. Keeping input on its own channel means a slow video stream never delays a tap.'
		},
		{
			id: 'server',
			label: 'Stream server',
			sub: 'Flask + WebSocket :8081',
			x: 490,
			y: 200,
			h: 156,
			kind: 'mine',
			detail:
				'A separate process that polls shared memory for new frames and broadcasts them to every connected browser. It also accepts input over HTTP and, in cloudypilot, refuses it whenever openpilot is engaged.'
		},
		{
			id: 'client',
			label: 'Browser client',
			sub: 'canvas + input capture',
			x: 740,
			y: 200,
			h: 156,
			kind: 'external',
			detail:
				'A single page that draws frames onto a canvas and turns mouse and touch gestures into input events. It can be installed to a phone’s home screen as a PWA.'
		}
	],
	edges: [
		{ from: 'render', to: 'streamer', label: 'framebuffer' },
		{ from: 'streamer', to: 'shm', label: 'JPEG' },
		{ from: 'shm', to: 'server', label: 'poll' },
		{ from: 'server', to: 'client', label: 'frames', at: 230 },
		{ from: 'client', to: 'server', label: 'touch', at: 326 },
		{ from: 'server', to: 'sock', label: 'input', at: 328 },
		{ from: 'sock', to: 'injector' },
		{
			from: 'injector',
			to: 'render',
			points: [
				[50, 340],
				[40, 340],
				[40, 118],
				[50, 118]
			],
			dashed: true
		}
	]
};

const cloudypilot: Diagram = {
	title: 'Where cloudypilot sits on top of sunnypilot',
	caption:
		'Highlighted boxes are my code. The rest is upstream openpilot and sunnypilot, which my changes hook into at a few small, clear points.',
	width: 940,
	height: 500,
	groups: [
		{ label: 'Build and release', x: 10, y: 20, w: 230, h: 470 },
		{ label: 'On the comma device', x: 260, y: 150, w: 670, h: 240, labelBottom: true }
	],
	nodes: [
		{
			id: 'push',
			label: 'Push to master',
			sub: 'GitHub',
			x: 30,
			y: 56,
			w: 190,
			kind: 'mine',
			detail: 'Every change starts as a commit on master, including periodic syncs from upstream sunnypilot.'
		},
		{
			id: 'ci',
			label: 'CI tests',
			sub: 'GitHub Actions',
			x: 30,
			y: 146,
			w: 190,
			kind: 'mine',
			detail: 'The test workflow has to pass before anything gets built for release.'
		},
		{
			id: 'build',
			label: 'Build on a comma device',
			sub: 'self-hosted runner',
			x: 30,
			y: 236,
			w: 190,
			kind: 'mine',
			detail:
				'The release build runs on real comma hardware registered as a self-hosted GitHub Actions runner, so the compiled code matches the device it ships to.'
		},
		{
			id: 'prebuilt',
			label: 'master-prebuilt',
			sub: 'published branch',
			x: 30,
			y: 326,
			w: 190,
			kind: 'store',
			detail:
				'The compiled, stripped-down release tree is pushed to a prebuilt branch, so devices install in seconds instead of compiling for minutes.'
		},
		{
			id: 'installer',
			label: 'Installer URL',
			sub: 'installer.hauckelabs.dev',
			x: 30,
			y: 416,
			w: 190,
			kind: 'mine',
			detail:
				'A short URL on my own domain that anyone can type into a comma device during setup to install cloudypilot.'
		},
		{
			id: 'car',
			label: 'Car',
			sub: '2026 Kia EV6, CAN bus',
			x: 290,
			y: 56,
			kind: 'external',
			detail:
				'The car talks to the device over its CAN bus through comma’s panda interface. openpilot reads sensors and sends steering and speed commands this way.'
		},
		{
			id: 'controlsd',
			label: 'controlsd',
			sub: 'steering + speed control',
			x: 290,
			y: 180,
			kind: 'upstream',
			detail:
				'The upstream control loop that turns the driving model’s plan into steering and speed commands. cloudypilot extends it with a small mixin rather than editing it in place.'
		},
		{
			id: 'ext',
			label: 'ControlsExtCP',
			sub: 'steer-ratio override',
			x: 290,
			y: 300,
			kind: 'mine',
			detail:
				'My extension to controlsd. When the toggle is on, it replaces the learned steering ratio with a fixed value from settings, clamped to a safe minimum. It has its own unit tests.'
		},
		{
			id: 'params',
			label: 'Params store',
			sub: 'persistent settings',
			x: 510,
			y: 180,
			kind: 'store',
			detail:
				'openpilot’s on-device key-value store for settings. cloudypilot adds its own keys, such as the custom steering ratio and the Remote UI toggle.'
		},
		{
			id: 'cpui',
			label: 'cloudypilot UI layer',
			sub: 'settings, sidebar, home',
			x: 510,
			y: 300,
			kind: 'mine',
			detail:
				'My subclasses of the upstream UI layouts, kept in their own package. They add new settings, the soft reboot button and home screen info without touching upstream files.'
		},
		{
			id: 'ui',
			label: 'UI (raylib)',
			sub: 'onroad + settings screens',
			x: 730,
			y: 180,
			w: 180,
			kind: 'upstream',
			detail: 'The upstream user interface shown on the device’s screen.'
		},
		{
			id: 'remote',
			label: 'Remote UI server',
			sub: 'from op-remote-ui',
			x: 730,
			y: 300,
			w: 180,
			kind: 'mine',
			detail:
				'My remote UI streamer, run as a managed openpilot process when the Remote UI toggle is on. It blocks remote input whenever the system is engaged.'
		},
		{
			id: 'phone',
			label: 'Phone or laptop',
			sub: 'browser on same Wi-Fi',
			x: 730,
			y: 416,
			w: 180,
			kind: 'external',
			detail: 'Any browser on the same network can view and control the device’s screen.'
		}
	],
	edges: [
		{ from: 'push', to: 'ci' },
		{ from: 'ci', to: 'build' },
		{ from: 'build', to: 'prebuilt' },
		{ from: 'prebuilt', to: 'installer' },
		{ from: 'car', to: 'controlsd', label: 'CAN', both: true },
		{ from: 'controlsd', to: 'ext', label: 'steer ratio', both: true },
		{ from: 'params', to: 'controlsd' },
		{ from: 'cpui', to: 'params', label: 'toggles', labelLeft: true },
		{
			from: 'cpui',
			to: 'ui',
			label: 'extends',
			points: [
				[650, 300],
				[650, 266],
				[790, 266],
				[790, 236]
			],
			labelAt: [720, 260]
		},
		{ from: 'ui', to: 'remote', label: 'stream', both: true, at: 860 },
		{ from: 'remote', to: 'phone', label: 'WebSocket', both: true, at: 820 }
	]
};

const canfield: Diagram = {
	title: 'How the toolkit is organized and shipped',
	caption:
		'The top two rows run on the technician’s machine. The bottom row is how a modular source tree becomes one downloadable EXE.',
	width: 940,
	height: 400,
	groups: [
		{ label: 'At runtime', x: 10, y: 20, w: 920, h: 230 },
		{ label: 'Build and release', x: 10, y: 270, w: 920, h: 120 }
	],
	nodes: [
		{
			id: 'entry',
			label: 'Install-Toolkit.ps1',
			sub: 'start + self-elevate',
			x: 30,
			y: 56,
			w: 190,
			kind: 'mine',
			detail:
				'The entry point. It relaunches itself with administrator rights if needed, then loads every source file in a fixed order.'
		},
		{
			id: 'loadorder',
			label: 'LoadOrder.ps1',
			sub: 'ordered file list',
			x: 30,
			y: 166,
			w: 190,
			kind: 'store',
			detail:
				'One list of source files in dependency order. Both the script and the EXE build use it, so they can never load files in different orders.'
		},
		{
			id: 'ui',
			label: 'Main window',
			sub: 'WinForms + progress',
			x: 270,
			y: 56,
			kind: 'mine',
			detail:
				'The WinForms window plus shared helpers for progress bars and messages, so every tab looks and behaves the same way.'
		},
		{
			id: 'tabs',
			label: 'Tabs',
			sub: '7 files, one per stage',
			x: 490,
			y: 56,
			kind: 'mine',
			detail:
				'Computer, Remote Access, Canfield Capture, Users, Cleanup Tool, Scripts and Summary. Each tab is its own file and only handles UI, calling helpers for the real work.'
		},
		{
			id: 'lib',
			label: 'Helpers (lib/)',
			sub: 'UI-free logic',
			x: 490,
			y: 166,
			kind: 'mine',
			detail:
				'USB discovery, sponsor CSV lookup, local users, database cleanup, validation and status checks. Keeping these free of UI code makes them easy to reason about and reuse.'
		},
		{
			id: 'inputs',
			label: 'USB drives + files',
			sub: 'installers, CSV, Scripts',
			x: 730,
			y: 56,
			w: 180,
			kind: 'external',
			detail:
				'Installers found on attached USB drives (with a Browse fallback), the sponsor CSV for remote-access deploy IDs, and an optional Scripts folder.'
		},
		{
			id: 'windows',
			label: 'Windows',
			sub: 'accounts, registry, clock',
			x: 730,
			y: 166,
			w: 180,
			kind: 'external',
			detail:
				'Built-in PowerShell cmdlets and the registry: renaming the PC, managing local accounts, setting the time zone, and reading installer sources to tell apart versions.'
		},
		{
			id: 'actions',
			label: 'GitHub Actions',
			sub: 'push → build, tag → release',
			x: 30,
			y: 306,
			w: 190,
			kind: 'mine',
			detail:
				'Every push builds the EXE as an artifact. Pushing a version tag builds it again, stamps the version and publishes a GitHub Release.'
		},
		{
			id: 'build',
			label: 'Build-Toolkit-Exe.ps1',
			sub: 'inline src in order',
			x: 270,
			y: 306,
			kind: 'mine',
			detail:
				'Reads LoadOrder.ps1 and inlines every source file into one script, so the shipped EXE has no loose files to lose.'
		},
		{
			id: 'ps2exe',
			label: 'PS2EXE',
			sub: 'script → executable',
			x: 490,
			y: 306,
			kind: 'upstream',
			detail:
				'An open source tool that wraps a PowerShell script into a Windows executable with an icon and an admin prompt.'
		},
		{
			id: 'release',
			label: 'CDT.exe',
			sub: 'versioned release',
			x: 730,
			y: 306,
			w: 180,
			kind: 'store',
			detail: 'The single file technicians download and run. It asks for admin rights through UAC on launch.'
		}
	],
	edges: [
		{ from: 'entry', to: 'ui', label: 'opens' },
		{ from: 'ui', to: 'tabs', label: 'hosts' },
		{ from: 'entry', to: 'loadorder', label: 'reads' },
		{ from: 'tabs', to: 'lib', label: 'calls' },
		{ from: 'lib', to: 'windows' },
		{
			from: 'inputs',
			to: 'lib',
			points: [
				[730, 100],
				[705, 100],
				[705, 140],
				[630, 140],
				[630, 166]
			]
		},
		{
			from: 'loadorder',
			to: 'build',
			label: 'same order',
			points: [
				[125, 222],
				[125, 262],
				[355, 262],
				[355, 306]
			],
			labelAt: [240, 256]
		},
		{ from: 'actions', to: 'build', label: 'runs' },
		{ from: 'build', to: 'ps2exe' },
		{ from: 'ps2exe', to: 'release' }
	]
};

const site: Diagram = {
	title: 'How this site is built and where the live data comes from',
	caption:
		'The top row runs on every push. Below it, Home Assistant and the printer camera reach the site through Cloudflare without any open ports at home.',
	width: 940,
	height: 470,
	groups: [
		{ label: 'Build and deploy', x: 10, y: 20, w: 690, h: 110 },
		{ label: 'Home network', x: 10, y: 140, w: 220, h: 320 },
		{ label: 'Cloudflare', x: 250, y: 140, w: 450, h: 320 },
		{ label: 'Visitor', x: 720, y: 20, w: 210, h: 440 }
	],
	nodes: [
		{
			id: 'push',
			label: 'Push to master',
			sub: 'GitHub',
			x: 30,
			y: 56,
			kind: 'mine',
			detail: 'Every change to the site starts as a commit on the master branch.'
		},
		{
			id: 'builds',
			label: 'Workers Builds',
			sub: 'build + prerender',
			x: 270,
			y: 56,
			kind: 'upstream',
			detail:
				'Cloudflare’s CI picks up each push, runs the SvelteKit build, prerenders every static page with the latest GitHub stats baked in, and deploys the Worker.'
		},
		{
			id: 'static',
			label: 'Prerendered pages',
			sub: 'HTML, CSS, images',
			x: 490,
			y: 56,
			kind: 'store',
			detail:
				'Home, About, project pages and the sitemap, served as static files from the nearest Cloudflare location. The browser refreshes GitHub stats on its own afterwards.'
		},
		{
			id: 'ha',
			label: 'Home Assistant',
			sub: 'every 5 minutes',
			x: 30,
			y: 176,
			kind: 'upstream',
			detail:
				'My home automation server. An automation sends a JSON snapshot of the readings I chose to share, with a bearer token, every five minutes.'
		},
		{
			id: 'cam',
			label: 'Printer camera',
			sub: 'mjpg-streamer',
			x: 30,
			y: 376,
			kind: 'upstream',
			detail:
				'A camera on my 3D printer that serves snapshots and an MJPEG stream on the local network only.'
		},
		{
			id: 'ingest',
			label: 'POST /api/lab',
			sub: 'token + validation',
			x: 270,
			y: 176,
			kind: 'mine',
			detail:
				'A Worker route that checks the token in constant time, caps the body size and keeps only well-formed readings before storing them.'
		},
		{
			id: 'kv',
			label: 'Workers KV',
			sub: 'latest snapshot',
			x: 270,
			y: 276,
			kind: 'store',
			detail:
				'A key-value store at the edge. It holds a single key: the most recent snapshot and the time the Worker received it.'
		},
		{
			id: 'lab',
			label: '/lab page',
			sub: 'rendered per request',
			x: 490,
			y: 276,
			kind: 'mine',
			detail:
				'Reads the snapshot from KV on every request and marks it live, stale or offline by its age. Its data requests are never cached.'
		},
		{
			id: 'access',
			label: 'Access + Tunnel',
			sub: 'service token',
			x: 270,
			y: 376,
			kind: 'upstream',
			detail:
				'Cloudflare Tunnel connects the camera outward to Cloudflare, and Cloudflare Access blocks anyone without a login or a service token.'
		},
		{
			id: 'camera',
			label: '/lab/camera',
			sub: 'authenticated proxy',
			x: 490,
			y: 376,
			kind: 'mine',
			detail:
				'Fetches the camera with the Access service token and streams the bytes straight to the browser, so visitors never see the camera’s address or need a login.'
		},
		{
			id: 'browser',
			label: 'Browser',
			sub: 'desktop or phone',
			x: 740,
			y: 56,
			h: 376,
			kind: 'external',
			detail:
				'Loads the static pages, polls the Lab page every 30 seconds for new readings, and shows the camera as a snapshot or live stream.'
		}
	],
	edges: [
		{ from: 'push', to: 'builds' },
		{ from: 'builds', to: 'static', label: 'deploy' },
		{ from: 'static', to: 'browser', label: 'HTML' },
		{ from: 'ha', to: 'ingest', label: 'snapshot' },
		{ from: 'ingest', to: 'kv', label: 'store' },
		{ from: 'kv', to: 'lab', label: 'read' },
		{ from: 'lab', to: 'browser', label: 'poll', both: true },
		{ from: 'cam', to: 'access', label: 'MJPEG' },
		{ from: 'access', to: 'camera' },
		{ from: 'camera', to: 'browser', label: 'stream' }
	]
};

export const diagrams: Record<string, Diagram> = {
	cloudypilot,
	'op-remote-ui': remoteUi,
	'canfield-deployment-toolkit': canfield,
	'haucke-labs': site
};
