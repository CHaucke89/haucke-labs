export type Project = {
	slug: string;
	name: string;
	tagline: string;
	summary: string;
	highlights: string[];
	tech: string[];
	repo: string;
};

export const projects: Project[] = [
	{
		slug: 'cloudypilot',
		name: 'cloudypilot',
		tagline: 'A driver-assistance fork of sunnypilot, tuned for the 2026 Kia EV6',
		summary:
			'A personal fork of sunnypilot, itself a fork of comma.ai’s openpilot, the open source driver-assistance system. I maintain it against a fast-moving upstream and add controls and quality-of-life features for my own car.',
		highlights: [
			'Post-blinker lateral re-engage delay, later merged upstream into sunnypilot',
			'Soft reboot that restarts the software stack without a hardware reset',
			'Built-in remote UI streamer, toggled from developer settings',
			'Self-hosted installer at installer.hauckelabs.dev'
		],
		tech: ['Python', 'C++', 'raylib', 'Linux', 'CAN'],
		repo: 'https://github.com/CHaucke89/cloudypilot'
	},
	{
		slug: 'op-remote-ui',
		name: 'op-remote-ui-raylib',
		tagline: 'Stream and control an openpilot device from any browser',
		summary:
			'openpilot moved its UI from Qt/C++ to raylib/Python, which broke the community’s remote UI streamer. I ported it to the new stack: frames go from the render loop to a browser over WebSocket with no disk writes, and touch input flows back the other way.',
		highlights: [
			'Framebuffer capture and JPEG encoding straight from the raylib render loop',
			'Zero-copy hand-off through POSIX shared memory with a packed binary header',
			'Flask WebSocket server broadcasting to a canvas client, installable as a PWA',
			'Remote touch, drag and scroll injected by patching pyray input hooks'
		],
		tech: ['Python', 'raylib', 'WebSocket', 'Shared memory', 'Unix sockets'],
		repo: 'https://github.com/CHaucke89/op-remote-ui-raylib'
	},
	{
		slug: 'canfield-deployment-toolkit',
		name: 'Canfield Deployment Toolkit',
		tagline: 'One GUI for every step of setting up a Windows imaging workstation',
		summary:
			'A Windows desktop tool that turns a long manual setup checklist into a single guided app: machine configuration, user accounts, remote-access enrollment, software installs, cleanup and a QC report at the end.',
		highlights: [
			'Modular PowerShell codebase: UI-free helpers, one file per tab, explicit load order',
			'Packaged into a single EXE that self-elevates through UAC',
			'GitHub Actions build the EXE on every push and publish releases on tags',
			'Generates a QC report so each machine leaves in a known state'
		],
		tech: ['PowerShell', 'WinForms', 'GitHub Actions', 'Windows'],
		repo: 'https://github.com/CHaucke89/canfield-deployment-toolkit'
	}
];
