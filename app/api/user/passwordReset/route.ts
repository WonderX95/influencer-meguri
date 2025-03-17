import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../util/db";
import { generateRandomString } from "../util";
const bcrypt = require("bcrypt");

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const query3 = `SELECT * FROM users where email = '${email}'`;
    const rows = await executeQuery(query3).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({
        type: "error",
      });
    });

    if (rows.length === 0 || !rows.length) {
      return NextResponse.json({
        type: "error",
        msg: "入力に誤りがあります",
      });
    }

    if (!rows[0]?.name) {
      return NextResponse.json({
        type: "error",
        msg: "入力に誤りがあります",
      });
    }
    if (rows[0].role === "インフルエンサー") {
      const query4 = `SELECT * FROM influencer where userId = ${rows[0].id}`;
      const rows4 = await executeQuery(query4).catch((e) => {
        throw new Error("something went wrong");
        return NextResponse.json({
          type: "error",
        });
      });
      if (!(rows4?.length > 0)) {
        return NextResponse.json({
          type: "error",
          msg: "入力に誤りがあります",
        });
      }
      if (!(rows4[0].status === "稼働中")) {
        return NextResponse.json({
          type: "error",
          msg: "入力に誤りがあります",
        });
      }
    }
    const randomString = generateRandomString();
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(randomString, salt);
    await executeQuery(`
        UPDATE users SET password = '${hashedPassword}', plainPassword = '${randomString}'
        WHERE email = '${email}'
        `);
    return NextResponse.json({
      type: "success",
      data: { email, password: randomString },
    });
  } catch (e) {
    console.error("Error creating user record:", e);
    throw new Error("something went wrong");
    return NextResponse.json({ type: "error" });
  }
}
