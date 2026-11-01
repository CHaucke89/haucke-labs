export type Challenge = { title: string; body: string };

export type Project = {
	slug: string;
	name: string;
	tagline: string;
	summary: string;
	highlights: string[];
	tech: string[];
	repo: string;
	role: string;
	problem: string[];
	built: string[];
	challenges: Challenge[];
	learned: string[];
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
		tech: ['Python', 'C++', 'raylib', 'Linux', 'GitHub Actions'],
		repo: 'https://github.com/CHaucke89/cloudypilot',
		role: 'Sole maintainer of the fork',
		problem: [
			'openpilot and sunnypilot run on a dedicated device mounted in the car and handle steering and speed control on supported vehicles. They’re built for thousands of drivers, so a few settings I wanted for my own car didn’t exist, and some everyday tasks, like restarting the software, were clumsier than they needed to be.',
			'Both upstream projects move quickly. Any fork has to keep up with large, frequent changes without breaking the parts that matter for safety.'
		],
		built: [
			'cloudypilot adds its own layer on top of sunnypilot. Most of my changes live in a separate cloudypilot package that hooks into upstream code at a few clear points, so syncing with upstream stays manageable.',
			'Features include a fixed steering-ratio override in place of the learned value, a configurable low-voltage shutdown threshold, a soft reboot that restarts the software without the hardware-reset prompt, and a home screen that shows the active model and branch. The post-blinker re-engage delay I wrote was accepted into sunnypilot itself.',
			'It also ships with my remote UI streamer built in, so the car’s screen can be viewed and controlled from a phone or laptop on the same network. Builds come from a GitHub Actions workflow on a self-hosted runner, and anyone can install the fork from installer.hauckelabs.dev.'
		],
		challenges: [
			{
				title: 'Staying in sync with upstream',
				body: 'Every upstream sync can touch hundreds of files. Keeping my changes in their own package, with small and well-named hook points into upstream code, turned most syncs into a short review instead of a long merge-conflict session.'
			},
			{
				title: 'Changing safety-relevant code carefully',
				body: 'Some features touch steering control. I kept those changes narrow, left driver monitoring and engagement safety logic alone, wrote tests for new behavior like the soft reboot and the steering-ratio override, and documented the risks clearly for anyone installing the fork.'
			},
			{
				title: 'Remote control without remote risk',
				body: 'Streaming the UI is harmless, but accepting remote touch input while the car is driving is not. The stream server watches openpilot’s engagement state and refuses remote input whenever the system is engaged, so the driver always has sole control.'
			}
		],
		learned: [
			'How to work inside a large, unfamiliar codebase that I don’t control',
			'How to shape a change so an upstream project will accept it',
			'Writing software where a mistake has physical consequences'
		]
	},
	{
		slug: 'op-remote-ui',
		name: 'op-remote-ui-raylib',
		tagline: 'Stream and control an openpilot device from any browser',
		summary:
			'openpilot moved its UI from Qt/C++ to raylib/Python, which broke the community’s remote UI streamer. I ported it to the new stack: frames go from the render loop to a browser over WebSocket with no disk writes, and touch input flows back the other way.',
		highlights: [
			'Framebuffer capture and JPEG encoding straight from the raylib render loop',
			'Low-overhead hand-off through POSIX shared memory with a packed binary header',
			'Flask WebSocket server broadcasting to a canvas client, installable as a PWA',
			'Remote touch, drag and scroll injected by patching pyray input hooks'
		],
		tech: ['Python', 'raylib', 'WebSocket', 'Shared memory', 'Unix sockets'],
		repo: 'https://github.com/CHaucke89/op-remote-ui-raylib',
		role: 'Ported and extended an existing community project',
		problem: [
			'The comma device has a small touchscreen mounted on the windshield. A community tool by ecpp streamed that screen to a browser, which is very handy for changing settings or debugging without leaning into the car.',
			'When openpilot replaced its Qt/C++ interface with one built on raylib and Python, the original tool stopped working, because it relied on Qt APIs that no longer existed.'
		],
		built: [
			'I rewrote the capture and input sides for the new UI. Each frame is read from the raylib framebuffer, JPEG-encoded, and written into POSIX shared memory behind a small packed binary header. A separate Flask server reads that memory and broadcasts frames to any connected browser over WebSocket.',
			'In the other direction, the browser sends touch, drag and scroll events back to the server, which forwards them over a Unix socket to an injector inside the UI process. The injector patches pyray’s input functions so the UI sees remote input as if it came from the touchscreen.',
			'An install script sets everything up on the device. A later version, built into cloudypilot, adds adaptive streaming and can be installed as a phone app (PWA).'
		],
		challenges: [
			{
				title: 'Not slowing down the UI',
				body: 'The UI has to stay smooth while it’s being streamed. Only the GPU readback happens on the render thread; copying, resizing and JPEG encoding run on a worker thread. Frames are only captured when a browser is actually connected.'
			},
			{
				title: 'Torn and partial frames',
				body: 'The writer and reader share memory without locks, so early versions sometimes sent half-written frames. Now the streamer writes the image first and the header last, with a ready flag and timestamp, so the server only sends frames that are complete and new.'
			},
			{
				title: 'Adapting to the network',
				body: 'In the cloudypilot version, the browser reports how delayed frames are arriving. The streamer combines that with encode time and frame size into a single pressure score, then lowers JPEG quality, frame rate or resolution when the link struggles and recovers them when it clears.'
			}
		],
		learned: [
			'Inter-process communication with shared memory and Unix sockets',
			'Reading someone else’s design closely enough to port it to a different stack',
			'Profiling and trading off CPU, bandwidth and latency on a constrained device'
		]
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
		repo: 'https://github.com/CHaucke89/canfield-deployment-toolkit',
		role: 'Sole author',
		problem: [
			'Setting up a workstation for Canfield imaging software meant working through a long list of manual steps: renaming the machine, setting the clock, creating several local accounts, enrolling remote access and device management, finding and running the right installer, and cleaning up old site data.',
			'Doing it by hand was slow and easy to get slightly wrong, and an older setup tool only covered part of the list.'
		],
		built: [
			'The toolkit is a WinForms app written in PowerShell, with one tab per stage of the setup: Computer, Remote Access, Canfield Capture, Users, Cleanup, Scripts and a final Summary that checks the machine and saves a QC report.',
			'It finds installers on attached USB drives automatically, looks up remote-access deploy IDs from a CSV, and replaces all the features of the older setup tool so technicians only need one app.',
			'It can run as a script, but most people use the packaged CDT.exe. GitHub Actions build that EXE on every push and publish a versioned release whenever a tag is pushed.'
		],
		challenges: [
			{
				title: 'Keeping a growing script maintainable',
				body: 'The first version was one large script. I refactored it into UI-free helper modules, a shared UI layer and one file per tab, loaded in a fixed order. The build script inlines everything in that same order to produce a single EXE, so the source stays modular and the output stays a single file.'
			},
			{
				title: 'Admin rights done right',
				body: 'Most tasks need administrator rights, so the app relaunches itself elevated. One bundled utility misbehaves when elevated, so the toolkit deliberately starts that one as a normal user.'
			},
			{
				title: 'Never deleting the wrong thing',
				body: 'The cleanup tool removes old site data, which is risky on a production machine. It has explicit protections for files that must never be deleted, and the installer finder tells apart multiple installers that share a version number.'
			}
		],
		learned: [
			'Designing a tool around the people who use it every day',
			'Refactoring a working script into a maintainable codebase',
			'Automating builds and releases with CI'
		]
	}
];

export function getProject(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}
