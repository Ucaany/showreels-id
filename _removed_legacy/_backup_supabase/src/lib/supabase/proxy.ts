import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

function makeProxyResponse(request: NextRequest, forwardedHeaders?: Headers) {
  if (!forwardedHeaders) {
    return NextResponse.next({
      request,
    });
  }

  return NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });
}

export async function updateSession(
  request: NextRequest,
  forwardedHeaders?: Headers
) {
  let response = makeProxyResponse(request, forwardedHeaders);

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = makeProxyResponse(request, forwardedHeaders);

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
