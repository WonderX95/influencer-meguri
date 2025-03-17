import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../util/db";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    const query = `SELECT influencer.*,users.applyTime FROM influencer 
    LEFT JOIN users ON influencer.userId = users.id
    where influencer.id = ${id}  ORDER BY id DESC`;
    const rows = await executeQuery(query).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    return NextResponse.json(rows[0]);
  } catch (error) {
    throw new Error("something went wrong");
    console.error("Error fetching data:", error);
    return NextResponse.json({ type: "error" });
  }
}
export async function POST() {
  return NextResponse.json({ type: "success" });
}
