import { NextRequest, NextResponse } from "next/server";

function getBackendBase(): string | null {
  const base = (
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  ).replace(/\/$/, "");
  return base || null;
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const backendBase = getBackendBase();
  if (!backendBase) {
    return NextResponse.json(
      {
        success: false,
        message:
          "API proxy not configured. Set NEXT_PUBLIC_API_BASE_URL (or API_PROXY_TARGET) on Vercel.",
      },
      { status: 502 }
    );
  }

  const path = pathSegments.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${backendBase}/${path}${search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret) headers.set("x-admin-secret", adminSecret);

  if (backendBase.includes("ngrok")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Backend unreachable. Is ngrok running and is NEXT_PUBLIC_API_BASE_URL correct on Vercel?",
      },
      { status: 502 }
    );
  }

  const responseBody = await upstream.text();
  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
