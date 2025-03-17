import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../util/db";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    const queryForCompany = `SELECT * FROM company WHERE id = '${id}'`;
    const result = await executeQuery(queryForCompany).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    if (result.length === 0) {
      return NextResponse.json({
        type: "error",
        msg: "入力に誤りがあります。",
      });
    }
    const company = result[0];

    const query = `SELECT * FROM cases where companyId = ${id} ORDER BY id DESC`;
    const rows = await executeQuery(query).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });

    return NextResponse.json(rows);
  } catch (error) {
    throw new Error("something went wrong");
    console.error("Error fetching data:", error);
    return NextResponse.json({ type: "error" });
  }
}
export async function POST() {
  return NextResponse.json({ type: "success" });
}
