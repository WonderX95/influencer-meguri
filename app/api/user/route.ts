import { NextRequest, NextResponse } from "next/server";
import { generateRandomString } from "./util";
import { executeQuery } from "../util/db";
import axios from "axios";
const bcrypt = require("bcrypt");

export async function POST(request: NextRequest) {
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
export async function PUT(request: NextRequest) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const { gRecaptchaToken, email, type } = await request.json();
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

  if (res && res.data?.success && res.data?.score >= 0.3) {
    try {
      const query3 = `SELECT * FROM users where email = '${email}'`;
      const rows = await executeQuery(query3).catch((e) => {
        throw new Error("something went wrong");
        return NextResponse.json({
          type: "error",
        });
      });
      const today = new Date();
      const todayString = today.toString();
      if (rows.length !== 0) {
        if (rows[0]?.name === null) {
          const applyTime = new Date(rows[0]?.applyTime);
          const timeDiff = today.getTime() - applyTime.getTime();
          const minutesDiff = timeDiff / (1000 * 60);
          console.log("diff", minutesDiff);
          if (minutesDiff > 60) {
            const deleteQuery = `delete from users where email = '${email}'`;
            await executeQuery(deleteQuery);
          } else {
            return NextResponse.json({
              type: "error",
              msg: "ご登録いただいたメールアドレスは仮申請中です",
            });
          }
        } else {
          return NextResponse.json({
            type: "error",
            msg: "メールアドレスが既に登録されている",
          });
        }
      }

      const randomString = generateRandomString();
      const saltRounds = 10;
      const salt = bcrypt.genSaltSync(saltRounds);
      const hash = bcrypt.hashSync(randomString, salt);
      await executeQuery(`
        INSERT INTO users (email,password ,role, applyTime, plainPassword)
        VALUES ('${email}','${hash}','${type}', '${todayString}', '${randomString}')
        `);
      const rows1 = await executeQuery(query3).catch((e) => {
        throw new Error("something went wrong");
        return NextResponse.json({
          type: "error",
        });
      });

      if (rows1.length) {
        return NextResponse.json({
          success: true,
          score: res.data?.score,
          type: "success",
          data: { email, password: randomString, id: rows1[0].id, hash },
        });
      }
    } catch (e) {
      console.error("Error creating user record:", e);
      throw new Error("something went wrong");
    }
  } else {
    console.log("fail: res.data?.score:", res.data?.score);
    return NextResponse.json({ success: false, score: res.data?.score });
  }
}
