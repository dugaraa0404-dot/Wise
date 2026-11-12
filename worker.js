/** LANDWISE entry point. Cloudflare Workers runs this file directly; Render's server.js wraps it. */
import { handleRequest } from './landwise-api.js';

export default { fetch: handleRequest };
