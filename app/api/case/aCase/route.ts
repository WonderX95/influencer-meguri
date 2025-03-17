import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../util/db";
import { error } from "console";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";

  try {
    const query = `SELECT cases.*, company.companyName, company.emailAddress, company.representativeName, company.responsibleName
      FROM cases
      LEFT JOIN company ON cases.companyId=company.id 
      where cases.id = ${id}
      ORDER BY cases.id DESC
      `;

    const rows = await executeQuery(query).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    const companyId = rows[0].companyId;

    const query1 = `SELECT id FROM cases WHERE companyId = ${companyId}`;
    const rows1 = await executeQuery(query1).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    return NextResponse.json({ data: rows[0], companyCases: rows1 });
  } catch (error) {
    throw new Error("something went wrong");
    console.error("Error fetching data:", error);
    return NextResponse.json({ type: "error" });
  }
}
export async function PUT(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    const { update, reason, approveMode, startAble, resumeMode, companyId } =
      await request.json();

    if (!approveMode) {
      const preQuery = `SELECT company.*,cases.collectionEnd FROM cases
      LEFT JOIN  company ON company.id = cases.companyId
      where cases.id=${id}`;
      const rows = await executeQuery(preQuery).catch((e) => {
        throw new Error("something went wrong");
        return NextResponse.json({ type: "error" });
      });
      const companyStatus = rows[0].status;
      if (companyStatus !== "稼働中" && companyStatus !== "稼動中") {
        return NextResponse.json({
          type: "error",
          msg: "承認されていないため、募集を開始できません。",
        });
      }
      if (resumeMode) {
        const today = new Date();
        if (today > new Date(rows[0].collectionEnd)) {
          return NextResponse.json({
            type: "error",
            msg: "募集終了日時を過ぎています",
          });
        }
      }
    }
    const caseQeury = `select collectionStart,collectionEnd from cases where id=${id}`;
    const caseRow = await executeQuery(caseQeury).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    const collectionStart = new Date(caseRow[0].collectionStart);
    const today = new Date();
    const autoStart = collectionStart > today;
    const preQuery1 = `SELECT company.*,cases.collectionEnd FROM cases
      LEFT JOIN  company ON company.id = cases.companyId
      where cases.id=${id}`;
    const rows1 = await executeQuery(preQuery1).catch((e) => {
      throw new Error("something went wrong");
      return NextResponse.json({ type: "error" });
    });
    const monthlyCollectionCnt = rows1[0].monthlyCollectionCnt;
    const concurrentCollectionCnt = rows1[0].concurrentCollectionCnt;
    const thisMonthCollectionCnt = rows1[0].thisMonthCollectionCnt;
    const conCurrentCnt = rows1[0].conCurrentCnt;
    const autoStartAble =
      startAble &&
      monthlyCollectionCnt > thisMonthCollectionCnt &&
      concurrentCollectionCnt > conCurrentCnt;
    let query = approveMode
      ? `UPDATE cases
    SET status = '${update}', collectionStatus = ${
          autoStartAble ? "'募集中'" : "'募集前'"
        } , reason = '${reason}', autoStart = ${autoStart ? 1 : 0}
    WHERE id = ${id}`
      : `UPDATE cases
    SET collectionStatus = '${update}'
    WHERE id = ${id}`;
    if (approveMode && update === "否認") {
      query = `update cases
              SET status = '${update}', collectionStatus = '募集前' , reason = '${reason}', autoStart = 0
              WHERE id = ${id}`;
    }
    if (autoStartAble && update == "承認") {
      console.log("updateing");
      const updateCompanyQuery = `UPDATE company 
      SET thisMonthCollectionCnt = ${thisMonthCollectionCnt + 1},
          conCurrentCnt = ${conCurrentCnt + 1}
          WHERE id = ${companyId}
      `;
      await executeQuery(updateCompanyQuery).catch((error) => {
        throw error;
        console.log(error);
      });
    }
    if (update === "停止中") {
      const queryWhenPause = `UPDATE cases SET collectionStatus = '${update}',edited = FALSE
      WHERE id = ${id}`;
      const result = await executeQuery(queryWhenPause);
      if (result) return NextResponse.json({ type: "success" });
      else return NextResponse.json({ type: "error" });
    }
    if (update === "募集終了") {
      const queryWhenQuit = `UPDATE company SET conCurrentCnt = conCurrentCnt - 1
      WHERE id = ${companyId}`;
      const approvedInfluencerCtnQuery = `
      SELECT apply.* FROM apply 
      LEFT JOIN influencer ON apply.influencerId = influencer.id
      WHERE caseId = ${id}
      `;
      const appliedInfluencer = await executeQuery(
        approvedInfluencerCtnQuery
      ).catch((e) => {
        throw new Error("something went wrong");
      });
      let finishedApplyCnt = 0;
      let rejectedApplyCnt = 0;
      appliedInfluencer.forEach((apply) => {
        if (apply.status === "否決") {
          rejectedApplyCnt++;
        }
        if (apply.status === "完了") {
          finishedApplyCnt++;
        }
      });

      await executeQuery(queryWhenQuit);

      if (
        !(appliedInfluencer.length > 0) ||
        appliedInfluencer.length === finishedApplyCnt + rejectedApplyCnt
      ) {
        const caseUpdateQuery = `UPDATE cases SET collectionStatus = '完了'
        WHERE id = ${id}`;
        const result = await executeQuery(caseUpdateQuery);
        if (result) {
          return NextResponse.json({ type: "success", updated: "完了" });
        }
      } else {
        const result1 = await executeQuery(query);
        if (result1)
          return NextResponse.json({ type: "success", updated: "募集終了" });
        else return NextResponse.json({ type: "error" });
      }
    }
    if (!approveMode && !resumeMode) {
      const queryForCompany = `SELECT * FROM company WHERE id = '${companyId}'`;
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
      if (!company.freeAccount) {
        if (company.conCurrentCnt === company.concurrentCollectionCnt) {
          return NextResponse.json({
            type: "fail",
            msg: "同時募集限界なので募集を開始できません。",
          });
        }
        if (company.thisMonthCollectionCnt === company.monthlyCollectionCnt) {
          return NextResponse.json({
            type: "fail",
            msg: "今月の募集は上限になりました。来月に開始してください。",
          });
        }
      }
      const today = new Date();
      if (today > new Date(caseRow[0].collectionEnd)) {
        return NextResponse.json({
          type: "error",
          msg: "募集終了日時を過ぎています。募集終了日時を変更して再申請してください。",
        });
      }
      const queryForCompany1 = `UPDATE company SET thisMonthCollectionCnt = ${
        company.thisMonthCollectionCnt + 1
      }
       , 
      conCurrentCnt = ${company.conCurrentCnt + 1}
      where id = ${companyId}
      `;
      await executeQuery(queryForCompany1);
      const result1 = await executeQuery(query);
      if (result1) return NextResponse.json({ type: "success" });
      else return NextResponse.json({ type: "error" });
    }
    const result = await executeQuery(query);
    if (result) return NextResponse.json({ type: "success", autoStartAble });
    else return NextResponse.json({ type: "error" });
  } catch (error) {
    throw new Error("something went wrong");
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
