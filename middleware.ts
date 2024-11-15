import { NextRequest, NextResponse } from "next/server";

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          ...corsOptions,
        },
      }
    );
  }

  // Handle actual requests
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
