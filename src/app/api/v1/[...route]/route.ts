import { API_VERSION_HEADER, INTERNAL_API_REQUEST_HEADER } from '@/lib/apiVersioning';

type RouteParams = {
  params: {
    route: string[];
  };
};

async function proxyRequest(request: Request, params: RouteParams['params']) {
  const routeSegments = params.route;

  if (!routeSegments || routeSegments.length === 0) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUrl = new URL(request.url);
  targetUrl.pathname = `/api/${routeSegments.join('/')}`;

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(INTERNAL_API_REQUEST_HEADER, 'true');
  forwardedHeaders.set(API_VERSION_HEADER, 'v1');

  const init: RequestInit = {
    method: request.method,
    headers: forwardedHeaders,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  const response = await fetch(targetUrl.toString(), init);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set(API_VERSION_HEADER, 'v1');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, { params }: RouteParams) {
  return proxyRequest(request, params);
}

export async function POST(request: Request, { params }: RouteParams) {
  return proxyRequest(request, params);
}

export async function PUT(request: Request, { params }: RouteParams) {
  return proxyRequest(request, params);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return proxyRequest(request, params);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return proxyRequest(request, params);
}

export async function OPTIONS(request: Request, { params }: RouteParams) {
  return proxyRequest(request, params);
}
