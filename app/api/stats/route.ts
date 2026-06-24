import { NextResponse } from "next/server";
import { getGithubStats, GithubError } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Missing ?username parameter." },
      { status: 400 }
    );
  }

  try { 
    const stats = await getGithubStats(username);
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    if (err instanceof GithubError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong fetching GitHub data." },
      { status: 500 }
    );
  }
}
