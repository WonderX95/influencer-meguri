import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

export async function POST(req: NextRequest) {
  return NextResponse.json({ Message: "Success", status: 200 });
}

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filePath = path.join(process.cwd(), "public", "img", params.filename);

    const fileBuffer = await fs.readFile(filePath);

    const ext = path.extname(params.filename).toLowerCase();
    let contentType = "application/octet-stream"; // Default
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".gif") contentType = "image/gif";

    // Return the file with the correct content type
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return new NextResponse("File not found", { status: 404 });
  }
}
