import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../util/db";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.API_KEY);

import { ADMIN_EMAIL } from "../sendEmail/config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    switch (body.type) {
      case "checkout.session.completed":
        break;
      case "invoice.paid":
        const email = body.data.object.customer_email;
        const companyQuery = `SELECT responsibleName from company where emailAddress = '${email}'`;
        const company = await executeQuery(companyQuery).catch((e) => {
          throw new Error("something went wrong");
          return NextResponse.json({ type: "error" });
        });
        if (!(company.length > 0)) {
          return NextResponse.json({ type: "error" });
        }
        const customerCompany = company[0].responsibleName;
        const msg = {
          to: email,
          from: ADMIN_EMAIL,
          subject: "【インフルエンサーめぐり】決済完了のご連絡",
          html: `<div>${customerCompany} 様
          <br/>
          <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。<br/>
          <br/>本日、ご登録のカードで請求処理をさせていただきました。
          <br/>明細は、ログイン後に「企業情報変更」の「決済情報変更」ボタンよりご確認いただけます。
          <br/>請求書、領収書も発行可能となっております。<br/>
          <br/>引き続き、インフルエンサーめぐりをよろしくお願いします。<br/>
          <br/>-----------------------------------------------------
          <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
          </div>https://influencer-meguri.jp/ask
          
          `,
        };

        const res = await sgMail.send(msg).catch((e) => {
          throw new Error("something went wrong");
        });
        if (!res) {
          return NextResponse.json({ type: "error" });
        }

        const customerId = body.data.object.customer;
        const paymentId = body.data.object.subscription;
        const query = `SELECT payment, paymentCnt
                            FROM company
                            WHERE emailAddress = '${email}'
                         `;
        const rows = await executeQuery(query).catch((e) => {
          throw new Error("something went wrong");
        });

        if (!rows || !rows.length || rows.length === 0) {
          return NextResponse.json({
            type: "error",
            msg: "no result.",
          });
        }
        const query2 = `SELECT plan.monthCnt, plan.concurrentCnt from plan
                      LEFT JOIN company ON company.plan = plan.id
                      WHERE company.emailAddress = '${email}'
                      `;
        await executeQuery(query2).catch((e) => {
          throw new Error("something went wrong");
        });
        let currentDate = new Date();

        const jstOffset = 9 * 60 * 60000; // JST is UTC + 9 hours
        let jstTime = new Date(currentDate.getTime() + jstOffset);

        jstTime.setDate(jstTime.getDate() + 30);
        const dateString = jstTime.toISOString();
        let updateString;

        if (
          rows[0].payment === "" ||
          rows[0].payment === "null" ||
          rows[0].payment === null
        ) {
          updateString = dateString;
        } else {
          const lastPaymentInfo = new Date(rows[0].payment);
          lastPaymentInfo.setDate(lastPaymentInfo.getDate() + 30);
          updateString = lastPaymentInfo.toISOString();
        }

        let paymentCnt = rows[0].paymentCnt;
        if (!(paymentCnt > 0)) {
          paymentCnt = 0;
        }
        paymentCnt++;

        const query1 = `update company set payment = '${updateString}',paymentId = '${paymentId}', paymentCnt = ${paymentCnt} ,
                      customerId = '${customerId}',
                      thisMonthCollectionCnt = 0 where emailAddress = '${email}'`;

        await executeQuery(query1).catch((e) => {
          throw new Error("something went wrong");
        });
        ////////////////////
        const queryForCompany = `SELECT * FROM company WHERE emailAddress = '${email}'`;
        const result = await executeQuery(queryForCompany).catch((e) => {
          throw new Error("something went wrong");
        });

        if (result.length === 0) {
          return NextResponse.json({
            type: "error",
            msg: "入力に誤りがあります。",
          });
        }
        const entireCompanyInfo = result[0];

        let possibleAutoCollectionCnt = Math.min(
          entireCompanyInfo.monthlyCollectionCnt -
            entireCompanyInfo.thisMonthCollectionCnt,
          entireCompanyInfo.concurrentCollectionCnt -
            entireCompanyInfo.conCurrentCnt
        );
        if (possibleAutoCollectionCnt < 0) {
          possibleAutoCollectionCnt = 0;
        } else {
          if (possibleAutoCollectionCnt > 0) {
            console.log(
              `${possibleAutoCollectionCnt} cases of company ${entireCompanyInfo.companyName} are available to start`
            );
          }
        }
        const countQuery = `
            SELECT caseName,id
            FROM cases
            WHERE companyId = ${entireCompanyInfo.id}
            AND status = '承認'
            AND collectionStatus != '停止中'
            AND collectionStatus != '募集終了'
            AND collectionStatus != '完了'
            AND collectionStatus != '募集中'
            AND (collectionStart < NOW() OR collectionStart IS NULL OR collectionStart = '')
            AND collectionEnd > NOW()
            LIMIT ${
              entireCompanyInfo.freeAccount ? 1000 : possibleAutoCollectionCnt
            }  
            `;
        const count = await executeQuery(countQuery).catch((e) => {
          throw new Error("something went wrong");
        });
        const affectedIds = count.map((row) => row.id);
        console.log(affectedIds);
        if (affectedIds.length > 0) {
          const updateQuery = `
              UPDATE cases
              SET collectionStatus = '募集中'
              WHERE id IN (${affectedIds})
            `;

          const res = await executeQuery(updateQuery).catch((e) => {
            throw new Error("something went wrong");
          });

          await Promise.all(
            count.map(async (aCase) => {
              const msg = {
                to: email,
                from: ADMIN_EMAIL,
                subject: "【インフルエンサーめぐり】案件の募集を開始しました",
                html: `<div>${entireCompanyInfo.responsibleName} 様<br/>
                    <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。
                    <br/>案件「 ${aCase?.caseName} 」の募集を開始しましたのでログインしてご確認ください。<br/>
                    <br/>-----------------------------------------------------
                    <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
                    </div> https://influencer-meguri.jp/ask
                  `,
              };

              const res = await sgMail.send(msg).catch((e) => {
                throw new Error("something went wrong");
              });
              if (!res) {
                return NextResponse.json({ type: "error" });
              }
            })
          );
        }
        if (affectedIds.length > 0) {
          const updateCompanyQuery = `
                UPDATE company
                SET thisMonthCollectionCnt = thisMonthCollectionCnt + ${affectedIds.length},
                conCurrentCnt = conCurrentCnt + ${affectedIds.length}
                WHERE id = ${entireCompanyInfo.id}
                `;
          console.log(
            `company ${entireCompanyInfo.id} updated with autoStartvalue ${affectedIds.length} and diffuse ${affectedIds.length}`
          );
          await executeQuery(updateCompanyQuery).catch((e) => {
            throw new Error("something went wrong");
          });
        }

        break;
      case "invoice.payment_failed":
        console.log("failed", body);
        const email_fail = body.data.object.customer_email;
        console.log(email_fail);
        const companyQuery_fail = `SELECT responsibleName,companyName from company where emailAddress = '${email_fail}'`;
        const company_fail = await executeQuery(companyQuery_fail).catch(
          (e) => {
            throw new Error("something went wrong");
          }
        );
        if (!(company_fail.length > 0)) {
          return NextResponse.json({ type: "error" });
        }
        const customerCompany_fail = company_fail[0].responsibleName;
        const customerCompany_fail_name = company_fail[0].companyName;
        const msg_fail = {
          to: email_fail,
          from: ADMIN_EMAIL,
          subject: "【インフルエンサーめぐり】決済エラーのご連絡",
          html: `<div>${customerCompany_fail} 様
                  <br/>
                  <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。<br/>
                  <br/>ご登録いただいたカードで決済ができませんでした。
                  <br/>ログイン後に「企業情報変更」の「決済情報変更」ボタンよりカード情報のご確認・変更をお願いします。
                  <br/>
                  <br/>-----------------------------------------------------
                  <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
                  </div>https://influencer-meguri.jp/ask

                  `,
        };

        const res_fail = await sgMail.send(msg_fail).catch((e) => {
          throw new Error("something went wrong");
        });
        if (!res_fail) {
          return NextResponse.json({ type: "error" });
        }
        const msg_fail_admin = {
          from: ADMIN_EMAIL,
          to: ADMIN_EMAIL,
          subject: "【インフルエンサーめぐり】決済エラー",
          html: `<div>以下の企業で決済ができませんでした。<br/>
                 <br/>
                  ${customerCompany_fail_name}
                  `,
        };

        await sgMail.send(msg_fail_admin).catch((e) => {
          throw new Error("something went wrong");
        });
        break;
      default:
        console.log(`Unhandled event type`);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    throw new Error("something went wrong");
  }
}
