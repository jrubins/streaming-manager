// Serves the TMDB stub over HTTP for end-to-end tests: `pnpm --filter @app/api tmdb-stub`.
import { createServer } from 'node:http';
import { createTmdbStub } from '../test/tmdb-stub.ts';

const port = Number(process.env['PORT'] ?? 3200);
const stub = createTmdbStub();

createServer((req, res) => {
  const response = stub.handle(
    new Request(`http://localhost:${port}${req.url ?? '/'}`, {
      method: req.method,
      headers: Object.entries(req.headers).flatMap(([name, value]) =>
        typeof value === 'string' ? [[name, value] as [string, string]] : [],
      ),
    }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers));
  void response.text().then((body) => res.end(body));
}).listen(port, () => {
  console.log(`TMDB stub on http://localhost:${port}`);
});
