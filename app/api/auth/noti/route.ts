import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../util/db";

export interface RowType {
  id: number;
  companyNoti: string;
  mainNoti: string;
  influencerNoti: string;
}
export async function POST(request: NextRequest) {
  try {
    const { companyNoti, mainNoti, influencerNoti } = await request.json();
    await executeQuery(`
            INSERT INTO notification (companyNoti, mainNoti, influencerNoti)
            VALUES ('${companyNoti}', '${mainNoti}','${influencerNoti}')
          `);
    return NextResponse.json({ type: "success" });
  } catch (error) {
    throw new Error("something went wrong");
    console.error("Error creating table or inserting record:", error);
    return NextResponse.json({ type: "error" });
  }
}

export async function GET() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS notification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyNoti text  ,
        mainNoti text  ,
        influencerNoti text  
      )
    `);
  console.log("Table created successfully!");
    const notification = await executeQuery(
      `SELECT * from notification `
    ).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    const last =
      notification.length === 0
        ? { companyNoti: "", newNoti: "", influencerNoti: "" }
        : notification[notification.length - 1];
    return NextResponse.json({ type: "success", data: last });
  } catch (error) {
    console.error("Error creating table or inserting record:", error);
    throw new Error("Error creating table or inserting record:");
    return NextResponse.json({ type: "error" });
  }
}
