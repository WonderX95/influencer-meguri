import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql";
import { executeQuery } from "../../util/db";
interface RowType extends RowDataPacket {
  // Define the structure of your row
  id: number;
  companyName: string;
  companyNameGana: string;
  representativeName: string;
  representativeNameGana: string;
  responsibleName: string;
  responsibleNameGana: string;
  webSite: string;
  phoneNumber: string;
  emailAddress: string;
  postalCode: string;
  address: string;
  building: string;
  status: string;
  payment: string;
  freeAccount: boolean;
  // Add any other fields you have in your table
}
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    const query = `SELECT company.*, plan.priceID, users.active FROM company
      LEFT JOIN plan ON  company.plan = plan.id 
      LEFT JOIN users ON company.userId = users.id 
      where  company.id = ${id} ORDER BY id DESC`;
    const rows = await executeQuery(query).catch((e) => {
      throw new Error("something went wrong1");
      return NextResponse.json({ type: "error" });
    });
    if (rows.length > 0) {
      return NextResponse.json(rows[0]);
    }
    return NextResponse.json({});
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("something went wrong2");
    return NextResponse.json({ type: "error" });
  }
}
export async function POST() {
  return NextResponse.json({ type: "success" });
}
