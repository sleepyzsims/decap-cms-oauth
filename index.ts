import decapCMSLoginScript from './decap-cms-login-script';

interface Env {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname, searchParams: params } = new URL(request.url);

    switch (pathname) {
      case '/auth':
        return redirectToAuthFlow(env);

      case '/callback':
        return await fetchAccessToken(params, env);

      default:
        return new Response();
    }
  },
};

async function fetchAccessToken(
  requestParams: URLSearchParams,
  env: Env
): Promise<Response> {
  try {
    const code = requestParams.get('code');

    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'decap-cms-github-oauth-api-cloudflare',
          accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.CLIENT_ID,
          client_secret: env.CLIENT_SECRET,
          code,
        }),
      }
    ).then((res) => res.json());

    const loginResponse = decapCMSLoginScript(response.access_token);

    return new Response(loginResponse, {
      status: 201,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(err.message, {
      status: 500,
    });
  }
}

function redirectToAuthFlow(env: Env): Response {
  return Response.redirect(
    `https://github.com/login/oauth/authorize?client_id=${env.CLIENT_ID}&scope=repo,user`,
    302
  );
}
