"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import TextArea from "@/components/atoms/textarea";
import Link from "next/link";
import axios from "axios";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Modal from "../../utils/modal";
import moment from "moment-timezone";
import ImgsViewer from "react-images-viewer";

const confirmMsg = "操作が成功しました。";
export interface ApplicationProps {
  modalMode?: boolean;
  companyMode?: boolean;
  influencerDetailMode?: boolean;
  influencerMode?: boolean;
  caseID?: number;
  onCancel?: () => void;
}

const ApplicationPage: React.FC<ApplicationProps> = ({
  modalMode,
  companyMode,
  influencerMode,
  influencerDetailMode,
  caseID,
  onCancel,
}: ApplicationProps) => {
  const [data, setData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [reason, setReason] = useState("");
  const [wantedSNS, setWantedSNS] = useState([]);
  const [error, setError] = useState("");
  const [valid, setValid] = useState(false);
  const { id } = useParams();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [openImage, setOpenImg] = useState(false);
  const [curImg, setCurImg] = useState(0);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let result;
        if (influencerMode) {
          result = await axios.get(`/api/case/aCase/?id=${caseID}`);
        } else {
          result = await axios.get(`/api/case/aCase/?id=${id}`);
          if (result.data.data.previous > 0) {
            const previousResult = await axios.get(
              `/api/case/aCase/?id=${result.data.data.previous}`
            );
            setPreviousData(previousResult.data.data);
          }
        }
        if (result?.data.type === "error") {
          setValid(false);
          if (!influencerMode && typeof window !== "undefined") {
            router.push("/applicationList");
          }
        } else {
          setValid(true);
          setData(result.data.data);
          setReason(result.data.data.reason);
          setWantedSNS(JSON.parse(result.data.data.wantedSNS));
          if (!modalMode) {
            document.title = result.data.data.caseName;
          }
        }
      } catch (e) {
        router.push("/logout");
      }
    };

    fetchData();
  }, [caseID]);
  const approve = (val: boolean) => {
    const approveApplication = async () => {
      const reason1 = val ? "" : reason;
      if (!val && (reason1 === "" || reason1 === undefined)) {
        setError("否認理由を入力してください");
        return;
      }
      const reject = data.status === "承認 / 申請中" ? "承認 / 否認" : "否認";

      const storedJSTTime = moment.tz(data.collectionStart, "Asia/Tokyo");

      const currentJSTTime = moment.tz("Asia/Tokyo");

      let startAble = false;

      if (currentJSTTime.isAfter(storedJSTTime)) {
        startAble = true;
      }
      if (!(data?.collectionStart.length > 0)) {
        startAble = true;
      }
      const storedColectionEndTime = moment.tz(
        data.collectionEnd,
        "Asia/Tokyo"
      );
      if (currentJSTTime.isAfter(storedColectionEndTime)) {
        console.log("collectionEnd is past");
        startAble = false;
      }

      const update = val ? "承認" : reject;
      const result = await axios.put(`/api/case/aCase/?id=${id}`, {
        update,
        reason: reason1,
        approveMode: true,
        startAble,
        companyId: data?.companyId,
      });
      if (result.data.type === "success") {
        if (update === reject)
          await axios.post("/api/sendEmail", {
            to: data?.emailAddress,
            subject:
              "【インフルエンサーめぐり】募集案件の内容修正をお願いします",
            html: `
            <div>
            ${data?.responsibleName}様<br/>
          <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。<br/>
          <br/>募集案件「 ${data.caseName} 」が否認されました。
          <br/>否認理由をご確認の上、修正いただき再申請をお願いします。<br/>
          <br/>-----------------------------------------------------
          <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
          </div> 
          https://influencer-meguri.jp/ask
          `,
          });
        if (update === "承認") {
          await axios.post("/api/sendEmail", {
            to: data?.emailAddress,
            subject: "【インフルエンサーめぐり】募集案件を承認しました",
            html: `
            <div>
            ${data?.responsibleName}様<br/>
          <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。<br/>
          <br/>募集案件「 ${data?.caseName} 」を承認しましたのでログインしてご確認ください。<br/>
          <br/>-----------------------------------------------------
          <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
          </div>https://influencer-meguri.jp/ask
          `,
          });
          if (result.data?.autoStartAble) {
            await axios.post("/api/sendEmail", {
              to: data?.emailAddress,
              subject: "【インフルエンサーめぐり】案件の募集を開始しました",
              html: `<div>${data.responsibleName} 様<br/>
              <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。
              <br/>案件「 ${data?.caseName} 」の募集を開始しましたのでログインしてご確認ください。<br/>
              <br/>-----------------------------------------------------
              <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
              </div> https://influencer-meguri.jp/ask
              `,
            });
          }
        }

        setShowConfirm(true);
        setError("");
      } else {
        const msg = result.data.msg ?? "サーバーでエラーが発生しました。";
        setError(msg);
      }
    };
    approveApplication();
  };
  const widthClass = modalMode ? "" : "w-[40%]";
  const topClass = modalMode ? " pt-[50px]" : "";
  const dateString = (dateValue: string) => {
    if (dateValue?.length > 0) {
      return dateValue.replaceAll("-", "/").replace("T", " ").substring(0, 16);
    }
    return "";
  };
  if (!valid) return <></>;
  return (
    <div
      className={
        modalMode
          ? "text-center bg-[white]  px-[35px] sp:px-[12px] sp:text-small w-[40%] sp:w-[90%] m-auto relative shadow-lg "
          : "text-center bg-[white] px-[35px] sp:px-[12px] sp:text-small "
      }
    >
      <div
        className={
          showConfirm
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 top-0 overflow-auto duration-500"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 top-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <Modal
          body={confirmMsg}
          onOk={() => {
            setShowConfirm(false);
            router.push("/applicationList");
          }}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
      {!modalMode && (
        <div className="flex items-center py-[20px]  w-[full] border-b-[1px] border-[#DDDDDD] mt-[70px] sp:mt-[96px]">
          <span className="text-title sp:text-sptitle">{data?.caseName}</span>
        </div>
      )}
      {modalMode && (
        <button
          className="absolute bg-[#5E5E5E] text-[white] px-[15px] py-[10px] top-0 right-0 cursor-pointer"
          onClick={(e) => {
            if (onCancel) onCancel();
          }}
        >
          x
        </button>
      )}
      <div
        className={
          "flex items-center gap-x-[67px] mobile:flex-col mobile:justify-start text-left  py-[20px] sp:w-full m-auto border-b-[1px] border-[#DDDDDD] mt-[90px] sp:mt-[30px] sp:px-[18px] " +
          widthClass +
          topClass
        }
      >
        <span className="w-[35%] mobile:w-full flex justify-end sp:justify-start">
          <span className="mobile:w-full text-[#6F6F6F]">企業名</span>
        </span>
        {!modalMode && (
          <Link
            href={`/company/${data?.companyId}`}
            className="mobile:w-full text-left"
          >
            <span className="text-[#3F8DEB] underline underline-[#3F8DEB] underline-offset-[3px] mobile:w-full text-left">
              {data?.companyName}
            </span>
          </Link>
        )}
        {modalMode && (
          <span className="mobile:w-full text-left">{data?.companyName}</span>
        )}
      </div>
      <div
        className={
          "flex items-center gap-x-[67px] mobile:flex-col mobile:justify-start text-left py-[15px] mobile:flex-column  sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%] mobile:w-full flex justify-end sp:justify-start">
          <span className="mobile:w-full text-[#6F6F6F]">案件種別</span>
        </span>
        <span className="mobile:w-full text-left">{`${
          data.caseType === "来 店" ? "来店" : data.caseType
        }型`}</span>
      </div>
      <div
        className={
          "flex items-center gap-x-[67px] mobile:flex-col mobile:justify-start text-left py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%] mobile:w-full flex justify-end sp:justify-start">
          <span className="text-[#6F6F6F]">案件名</span>
        </span>
        <span className="mobile:w-full text-left">{data?.caseName}</span>
      </div>
      {data?.caseImages?.length > 0 && (
        <div
          className={`${
            modalMode ? "visible" : "hidden"
          } py-4 flex flex-wrap gap-[10px] justify-center items-center `}
        >
          {JSON.parse(data?.caseImages).map((a, idx) => (
            <div key={idx} className="w-1/2 p-[10px] lg:w-1/4 ">
              <img
                onClick={() => {
                  setOpenImg(true);
                  setCurImg(idx);
                }}
                src={a}
                alt="alt"
                className="cursor-pointer shadow-md"
              />
            </div>
          ))}
        </div>
      )}
      {data?.caseImages?.length > 0 && (
        <div
          className={`${
            modalMode ? "hidden" : "visible"
          } py-4 flex w-[40%] sp:w-full mx-auto flex-wrap justify-center items-center `}
        >
          {JSON.parse(data?.caseImages).map((a, idx) => (
            <div key={idx} className="w-1/2 p-[5px] lg:w-1/4">
              <img
                onClick={() => {
                  setOpenImg(true);
                  setCurImg(idx);
                }}
                src={a}
                alt="alt"
                className="cursor-pointer shadow-md "
              />
            </div>
          ))}
          <ImgsViewer
            imgs={JSON.parse(data?.caseImages).map((a) => {
              return { src: a };
            })}
            currImg={curImg}
            isOpen={openImage}
            onClickPrev={() => {
              setCurImg(curImg - 1);
            }}
            onClickNext={() => {
              setCurImg(curImg + 1);
            }}
            onClose={() => {
              setOpenImg(false);
            }}
          />
        </div>
      )}
      <div
        className={
          "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left  py-[20px]   sp:w-full m-auto border-b-[1px] border-t-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="min-w-[35%] mobile:w-full flex justify-end sp:justify-start">
          <span className="text-[#6F6F6F]">案件内容</span>
        </span>
        <div className="text-left">
          <span className="mobile:w-full text-left">{data?.caseContent}</span>
        </div>
      </div>

      <div
        className={
          "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%] mobile:w-full flex justify-end sp:justify-start">
          <span className="text-[#6F6F6F]">希望のハッシュタグ</span>
        </span>
        <span className="mobile:w-full text-left">{data?.wantedHashTag}</span>
      </div>
      <div
        className={
          "flex gap-x-[67px] gap-y-[10px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%] mobile:w-full  flex justify-end sp:justify-start">
          <span className="text-[#6F6F6F]">希望のSNS</span>
        </span>
        <div className="flex mobile:w-full  flex-wrap gap-[10px] items-center">
          {wantedSNS.includes("instagram") && (
            <img
              className="w-[35px]"
              src="/img/sns/Instagram.svg"
              alt="instagram"
            />
          )}
          {wantedSNS.includes("tiktok") && (
            <img className="w-[35px]" src="/img/sns/tiktok.svg" alt="tiktok" />
          )}
          {wantedSNS.includes("x") && (
            <img className="w-[35px]" src="/img/sns/x.svg" alt="x" />
          )}
          {wantedSNS.includes("youtube") && (
            <img
              className="w-[35px]"
              src="/img/sns/youtube.svg"
              alt="youtube"
            />
          )}
          {wantedSNS.includes("facebook") && (
            <img
              className="w-[35px]"
              src="/img/sns/facebook.svg"
              alt="youtube"
            />
          )}
          {wantedSNS.includes("etc.") && <span>etc.</span>}
        </div>
      </div>
      {modalMode && (
        <div
          className={
            ` ${
              data?.caseType === "通販" ? "mobile:hidden" : "sp:flex"
            }  flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] ` +
            widthClass
          }
        >
          <span className="w-[35%]  flex justify-end sp:justify-start mobile:w-full">
            <span className="text-[#6F6F6F]">来店場所 </span>
          </span>
          <span className="mobile:w-full text-left">{data?.casePlace}</span>
        </div>
      )}
      {!modalMode && (
        <div
          className={
            "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
            widthClass
          }
        >
          <span className="w-[35%]  flex justify-end sp:justify-start mobile:w-full">
            <span className="text-[#6F6F6F]">来店場所 </span>
          </span>
          <span className="mobile:w-full text-left">{data?.casePlace}</span>
        </div>
      )}
      <div
        className={
          "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%]  flex justify-end sp:justify-start mobile:w-full">
          <span className="text-[#6F6F6F]">募集期間 </span>
        </span>
        <span className="mobile:w-full text-left">
          {`${dateString(data?.collectionStart)} ~ ${dateString(
            data?.collectionEnd
          )}`}
        </span>
      </div>
      <div></div>
      {!modalMode && (
        <div
          className={
            "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
            widthClass
          }
        >
          <span className="w-[35%]  flex justify-end sp:justify-start mobile:w-full">
            <span className="text-[#6F6F6F]">PR完了期限 </span>
          </span>
          <span className="mobile:w-full text-left">
            {dateString(data?.caseEnd)}
          </span>
        </div>
      )}
      {modalMode && (
        <>
          <div
            className={
              "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center pt-[20px] pb-[5px]   sp:w-full m-auto sp:px-[18px] " +
              widthClass
            }
          >
            <span className="w-[35%]  flex justify-end sp:justify-start mobile:w-full">
              <span className="text-[#6F6F6F]">PR完了期限 </span>
            </span>
            <span className="mobile:w-full text-left">
              {dateString(data?.caseEnd)}
            </span>
          </div>
          <div
            className={
              "text-[12px] text-[#ff6161] flex justify-center gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[5px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
              widthClass
            }
          >
            PRを完了していただく最終期限です。指定日までにPR投稿を完了してください。
          </div>
        </>
      )}
      <div
        className={
          "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left items-center py-[20px]   sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%]   flex justify-end sp:justify-start mobile:w-full">
          <span className="text-[#6F6F6F]">募集人数 </span>
        </span>
        <span className="mobile:w-full text-left">{data?.collectionCnt}</span>
      </div>
      <div
        className={
          "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left py-[20px]  sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
          widthClass
        }
      >
        <span className="w-[35%]   flex justify-end sp:justify-start mobile:w-full">
          <span className="text-[#6F6F6F]">補足・注意事項 </span>
        </span>
        <div className="text-left ">{data?.addition}</div>
      </div>
      {!modalMode && (
        <div
          className={
            "flex gap-x-[67px] mobile:flex-col mobile:justify-start text-left  py-[20px]  sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px] " +
            widthClass
          }
        >
          <span className="w-[35%]  flex justify-end sp:justify-start mobile:w-full">
            <span className="text-[#6F6F6F] mb-[5px]">否認理由 </span>
          </span>
          <TextArea
            value={data?.reason}
            textAreaClassName="max-w-[300px] h-[95px] grow border-[#D3D3D3] "
            placeholder="否決理由を入力してください。"
            handleChange={(val) => {
              setReason(val);
            }}
          />
        </div>
      )}
      {!modalMode && (
        <div
          className={
            "flex  py-[20px]  sp:w-full m-auto  sp:px-[18px] justify-between " +
            widthClass
          }
        >
          <div
            className={
              data?.next > 0
                ? "flex justify-center float-right"
                : "flex justify-center float-right invisible"
            }
          >
            <img
              src="/img/triangle-right.svg"
              className="w-[11px] ml-[5px] transform rotate-180 mr-[10px]"
            />
            <span className="text-[#3F8DEB]">
              <Link href={`/application/${data?.next}`}>
                次の申請内容に戻る
              </Link>
            </span>
          </div>
          <div
            className={
              data?.previous > 0 && previousData?.status != "申請前"
                ? "flex justify-center float-right"
                : "flex justify-center float-right invisible"
            }
          >
            <span className="text-[#3F8DEB]">
              <Link href={`/application/${data?.previous}`}>
                前回の申請内容を確認する
              </Link>
            </span>
            <img src="/img/triangle-right.svg" className="w-[11px] ml-[5px]" />
          </div>
        </div>
      )}
      {error !== "" && <div className="m-[10px] text-[#EE5736]">{error}</div>}

      <div
        className={
          modalMode
            ? ""
            : "flex justify-center mt-[36px] mb-[60px] sp:mb-[60px]"
        }
      >
        {!modalMode &&
          (data?.status === "申請中" || data?.status === "承認 / 申請中") && [
            <Button
              key={"1"}
              buttonType={ButtonType.PRIMARY}
              buttonClassName="mr-[30px]"
              handleClick={() => approve(true)}
            >
              <span className="flex items-center">
                <span>承認</span>
                <img
                  className="w-[14px] ml-[5px]"
                  src="/img/approve.svg"
                  alt="approve"
                />
              </span>
            </Button>,
            <Button
              key={"2"}
              buttonType={ButtonType.DANGER}
              buttonClassName="mr-[30px]"
              handleClick={() => approve(false)}
            >
              <span className="flex items-center">
                <span>否認</span>
                <img
                  className="w-[14px] ml-[5px]"
                  src="/img/cross.svg"
                  alt="cross"
                />
              </span>
            </Button>,
          ]}
        {!modalMode && (
          <Button
            buttonType={ButtonType.DEFAULT}
            buttonClassName="rounded-[5px] w-[80px]"
            handleClick={() => router.push("/applicationList")}
          >
            戻る
          </Button>
        )}
      </div>

      {modalMode && influencerMode && !influencerDetailMode && (
        <Button
          handleClick={() => {
            if (onCancel) onCancel();
          }}
          buttonType={ButtonType.PRIMARY}
          buttonClassName="m-[30px]"
        >
          <span className="flex items-center">
            <span>確認</span>
          </span>
        </Button>
      )}
      {modalMode && companyMode && (
        <Button
          buttonType={ButtonType.PRIMARY}
          buttonClassName="m-[30px]"
          handleClick={() => {
            if (onCancel) onCancel();
          }}
        >
          <span className="flex items-center">
            <span>確認</span>
          </span>
        </Button>
      )}
    </div>
  );
};
export default ApplicationPage;
