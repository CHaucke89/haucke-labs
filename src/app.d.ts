import type { SessionUser } from '#lib/auth.ts';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
		}
        interface Platform {
            env: Env;
            cf: CfProperties;
            ctx: ExecutionContext;
        }
    }
}

export {};
