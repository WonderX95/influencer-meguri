import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../util/db";
import axios from "axios";

export async function PUT(request: NextRequest) {
  try {
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255)  ,
          email VARCHAR(255)  
        )
      `);
    console.log("Table created successfully!");

    const result = await executeQuery(`
    INSERT INTO users (name, email)
    VALUES ('John Doye', 'john@exatmple.com')
  `).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    console.log("Record inserted successfully!", result);
    return NextResponse.json({ res: "success" });
  } catch (error) {
    throw new Error("something went wrong");

    console.error("Error creating table or inserting record:", error);
    return NextResponse.json({ error: error });
  }
}
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";

  const query = `SELECT * FROM users where password = '${id}'`;
  const rows = await executeQuery(query).catch((e) => {
    throw new Error("something went wrong");
    return NextResponse.json({
      type: "error",
    });
  });

  const current = new Date();
  const currentTime = current.toString();
  if (!rows[0] || rows.length === 0) {
    return NextResponse.json({
      type: "error",
    });
  } else {
    return NextResponse.json({
      ...rows[0],
      current: currentTime,
    });
  }
}
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const query1 = `select name from users where password = '${id}' `;
  const row = await executeQuery(query1).catch((e) => {
    throw new Error("something went wrong");
    return NextResponse.json({
      type: "error",
    });
  });
  if (row[0].name > 0) {
    return NextResponse.json({
      type: "success",
    });
  }
  const query = `delete from users where password = '${id}'`;
  const result = await executeQuery(query).catch((e) => {
    throw new Error("something went wrong");
    return NextResponse.json({
      type: "error",
    });
  });
  return NextResponse.json({
    type: "success",
  });
}
export async function POST(request: NextRequest) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const { gRecaptchaToken } = await request.json();
  console.log("validating", gRecaptchaToken);

  let res: any;
  const formData = `secret=${secretKey}&response=${gRecaptchaToken}`;
  try {
    res = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (e) {
    console.log("recaptcha error:", e);
    throw e;
  }
  console.log(res.data?.score);

  if (res && res.data?.success && res.data?.score >= 0.3) {
    return NextResponse.json({
      success: true,
      score: res.data?.score,
    });
  } else {
    console.log("fail: res.data?.score:", res.data?.score);
    return NextResponse.json({ success: false, score: res.data?.score });
  }
}
