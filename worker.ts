import { handleStatsRequest } from '@/handleStatsRequest';

type WorkerEnv = {
  GITHUB_PERSONAL_ACCESS_TOKEN: string;
};

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api') {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET' },
        });
      }

      return handleStatsRequest(request, env.GITHUB_PERSONAL_ACCESS_TOKEN);
    }

    return Response.redirect(
      'https://github.com/galaxy-sea/repository-contribution-stats',
      302,
    );
  },
};
