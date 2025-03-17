"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import RadioBtn from "@/components/atoms/radio";
import Checkbox from "@/components/atoms/checkbox";
import Input from "@/components/atoms/input";
import TextArea from "@/components/atoms/textarea";
import axios from "axios";
import { getUser } from "../../utils/getUser";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Modal from "../../utils/modal";
import ImageUploader from "@/components/organisms/imageUploader/uploader";
import { Plus } from "lucide-react";

interface CasePageProps {
  payment?: string;
  expired?: boolean;
}

const CasePage: React.FC<CasePageProps> = ({
  payment,
  expired,
}: CasePageProps) => {
  const [data, setData] = useState({
    caseType: "来 店",
    caseName: "",
    caseContent: "",
    wantedHashTag: "",
    wantedSNS: "",
    casePlace: "",
    caseEnd: "",
    collectionEnd: "",
    collectionStatus: "",
    collectionStart: "",
    collectionCnt: "",
    addition: "",
    id: null,
    status: "",
    reason: "",
    caseImages: "",
  });

  const router = useRouter();
  const user = getUser();

  const [wantedSNS, setWantedSNS] = useState([]);
  const [error, setError] = useState([]);
  const { id } = useParams();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("操作が成功しました。");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [images, setImages] = useState<(File | null)[]>([null]);
  const [removedImages, setRemovedImages] = useState<number[]>([]);

  const urlToFile = async (url: string): Promise<File | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split("/").pop() || "image.jpg";
      return new File([blob], fileName, { type: blob.type });
    } catch (error) {
      console.error("Error converting URL to File:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get(`/api/case/aCase?id=${id}`);
        if (result.data.type === "error") {
          router.push("/login");
          return;
        }
        if (result.data) setData(result.data.data);
        setWantedSNS(JSON.parse(result.data?.data.wantedSNS));

        // Convert image URLs to File objects
        const imageUrls = JSON.parse(result.data?.data.caseImages || "[]");
        const filePromises = imageUrls.map((url) => urlToFile(url));
        const files = await Promise.all(filePromises);
        setImages(files);
      } catch (e) {
        router.push("/login");
      }
    };
    if (id) fetchData();
    document.title = "募集案件登録・編集";
  }, []);

  const calculateEndDate = () => {
    if (payment === "free") {
      return "";
    }

    // const maxTime = expired ? new Date(payment) : new Date();
    const maxTime = expired ? new Date(payment) : new Date();
    // const oneDayInMs = 24 * 60 * 60 * 1000;
    // const maxDate = new Date(maxTime.getTime() - oneDayInMs);
    const maxDate = new Date(maxTime.getTime());

    const result = `${maxDate.getFullYear()}-${
      maxDate.getMonth() + 1 >= 10
        ? maxDate.getMonth() + 1
        : "0" + (maxDate.getMonth() + 1)
    }-${
      maxDate.getDate() >= 10 ? maxDate.getDate() : "0" + maxDate.getDate()
    }T00:00`;
    return result;
  };
  const handleSNSChange = (val: string) => {
    let isAlreadyExits = false;
    wantedSNS.forEach((aSNS) => {
      if (aSNS === val) isAlreadyExits = true;
    });
    if (!isAlreadyExits) {
      setWantedSNS([...wantedSNS, val]);
    } else {
      let filteredArray = wantedSNS.filter((element) => element !== val);
      setWantedSNS(filteredArray);
    }
  };
  const handleImageUpload = async (file: File | null) => {
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post("/api/image-upload", formData);
      return res;
    }
  };
  const handleRequest = async (saveMode: boolean) => {
    if (isLoading) return;
    const uploadedImages = images.filter(
      (a, idx) => !removedImages.some((r) => r === idx)
    );

    let body = {
      ...data,
      wantedSNS: JSON.stringify(wantedSNS),
      companyId: user.user?.targetId,
    };
    if (saveMode) {
      let upLoadedResult = [];
      setIsSaveLoading(true);
      try {
        if (uploadedImages.length > 0) {
          await Promise.all(
            uploadedImages.map(async (image) => {
              const uploaded = await handleImageUpload(image);
              upLoadedResult = [...upLoadedResult, uploaded?.data.url];
            })
          );
        }
      } catch (e) {
        console.log(e);

        throw new Error(e);
      }
      setIsSaveLoading(false);
      body = { ...body, caseImages: JSON.stringify(upLoadedResult) };
      if (data.id) {
        const result = await axios.put("/api/case", {
          ...body,
          status: "申請前",
        });
        if (result.data.type === "error") {
          setConfirmMsg(result.data.msg);
          setShowConfirm(true);
          return;
        }
        setError([]);
        setShowConfirm(true);
      } else {
        const result = await axios.post("/api/case", {
          ...body,
          status: "申請前",
        });
        if (result.data.type === "error") {
          setConfirmMsg(result.data.msg);
          setShowConfirm(true);
          return;
        }
        setError([]);
        setIsLoading(false);
        router.replace("/appliedList");
      }
      return;
    }
    let errorList = [];
    const msgs = {
      caseType: "案件種別を選択してください",
      caseName: "案件概要を入力してください",
      caseContent: "案件内容を入力してください",
      collectionEnd: "募集終了を入力してください ",
      caseEnd: "PR完了期限を入力してください",
      images: "画像を1枚以上登録してください",
    };
    const keys = Object.keys(msgs);
    let isValid = false;
    keys.forEach((aKey) => {
      const invalid =
        aKey === "images"
          ? uploadedImages.some((a) => a === null)
          : !body[aKey] || body[aKey] === "";
      if (invalid) {
        errorList.push(msgs[aKey]);
      } else {
        if (aKey === "caseEnd") isValid = true;
      }
    });
    if (expired) {
      if (data?.collectionStart?.length > 0) {
        const payTime = new Date(payment);
        const collectionStartTime = new Date(data.collectionStart);
        if (collectionStartTime < payTime) {
          setError(["該当の日時は選択できません"]);
          return;
        }
      } else {
        setError(["募集開始を選択してください"]);
        return;
      }
    }
    const casePlace = "訪問場所を入力してください";
    if (body.caseType === "来 店" && body.casePlace === "") {
      errorList.push(casePlace);
      isValid = false;
    }
    const today = new Date();
    const collectionStart = body.collectionStart
      ? new Date(body.collectionStart)
      : "";
    const collectionEndDate = new Date(body.collectionEnd);
    const caseEndDate = new Date(body.caseEnd);
    const isCollectionEedCorrect = collectionEndDate > today;
    const isCaseEedCorrect = caseEndDate > today;

    if (body.collectionEnd.length > 0 && !isCollectionEedCorrect) {
      errorList.push("募集終了日時は過去にすることはできません。");
      isValid = false;
    }
    if (body.caseEnd.length > 0 && !isCaseEedCorrect) {
      errorList.push("案件終了日時は過去にすることはできません。");
      isValid = false;
    }
    if (
      collectionStart !== "" &&
      body.caseEnd !== "" &&
      body.collectionEnd !== "" &&
      !(collectionEndDate > collectionStart)
    ) {
      errorList.push("募集開始時間と募集終了時間を正しく選択してください");
      isValid = false;
    }
    if (
      body.caseEnd !== "" &&
      body.collectionEnd !== "" &&
      !(caseEndDate > collectionEndDate)
    ) {
      errorList.push("PR完了期限と募集終了時間を正しく選択してください");
      isValid = false;
    }
    if (errorList.length !== 0) {
      setError(errorList);
      return;
    }
    if (isValid) {
      setError([]);
      let upLoadedResult = [];
      setIsLoading(true);
      try {
        await Promise.all(
          uploadedImages.map(async (image) => {
            const uploaded = await handleImageUpload(image);
            upLoadedResult = [...upLoadedResult, uploaded.data.url];
          })
        );
      } catch (e) {
        console.log(e);

        throw new Error(e);
      }
      setIsLoading(false);
      body = { ...body, caseImages: JSON.stringify(upLoadedResult) };
      let result;
      if (data.id) {
        const currentSavedResult = await axios.get(`/api/case/aCase?id=${id}`);
        if (currentSavedResult.data.data.collectionStatus === "募集中") {
          setConfirmMsg("既に募集中なので再申請できません。");
          setShowConfirm(true);
          return;
        }
        result = await axios.post("/api/case", {
          ...body,
          previous: data.id,
          status:
            data.status === "承認" || data.status === "承認 / 否認"
              ? "承認 / 申請中"
              : "申請中",
        });
        if (result.data.type === "error") {
          setConfirmMsg(result.data.msg);
          setShowConfirm(true);
          setIsLoading(false);
          return;
        }
        setError([]);
        setIsLoading(false);
        router.back();
      } else {
        if (isLoading) return;
        setIsLoading(true);
        result = await axios.post("/api/case", {
          ...body,
          status: "申請中",
        });
        if (result.data.type === "error") {
          setConfirmMsg(result.data.msg);
          setShowConfirm(true);
          setIsLoading(false);
          return;
        }
      }
      await axios.post("/api/sendEmail", {
        to: user.user?.email,
        subject: "【インフルエンサーめぐり】募集案件の登録申請をしました",
        html: `<div>${user.user?.responsibleName} 様<br/>
        <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。
        <br/>
        <br/>募集案件の登録申請を受け付けました。 
        <br/>申請内容を確認しますのでしばらくお待ちください。<br/>
        <br/>-----------------------------------------------------
        <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
        </div> https://influencer-meguri.jp/ask
        `,
      });
      await axios.post("/api/sendEmail", {
        from: user.user?.email,
        subject: "【インフルエンサーめぐり】募集案件の登録申請がありました",
        html: `<div>募集案件の���録申請がありました。
        <br/>ログインして確認してください。
        </div>https://influencer-meguri.jp/application/${result.data.id}
        </div>
        `,
      });
      setError([]);
      router.replace("/appliedList");
    }
    setIsLoading(false);
  };
  const determineEditable = () => {
    let startable: boolean;
    if (data.collectionStatus === "") {
      return true;
    }
    if (
      data.collectionStatus === "停止中" ||
      data.collectionStatus === "完了"
    ) {
      return false;
    }
    if (data.collectionStatus === "募集前") {
      startable =
        !data.status ||
        data.status === "申請前" ||
        data.status === "否認" ||
        data.status === "承認 / 否認" ||
        data.status === "承認";
    } else {
      startable =
        (data.status === "承認" && data.collectionStatus !== "募集終了") ||
        (data.status === "否認" && data.collectionStatus === "募集中") ||
        data.status === "申請前" ||
        (data.status === "否認" && data.collectionStatus === "停止");
    }

    return startable;
  };
  const handleFileSelect = (file: File | null, idx: number) => {
    let oldImages = images;
    images[idx] = file;
    setImages(oldImages);
  };
  const handleFileRemove = (idx: number) => {
    let oldImages = images;
    oldImages[idx] = null;
    let removed = removedImages;
    removed = [...removed, idx];
    setRemovedImages(removed);
  };
  return (
    <div className="text-center bg-[white] px-[35px] sp:px-[12px] sp:text-small ">
      <div
        className={
          showConfirm
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 top-0 overflow-auto duration-500"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 top-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <Modal
          body={confirmMsg}
          onOk={() => setShowConfirm(false)}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
      <div className="flex  pt-[20px] mobile:pt-[10px] pb-[8px]  w-[full] border-b-[1px] border-[#DDDDDD] mt-[70px] sp:mt-[96px]">
        <span className="text-title sp:text-sptitle">募集案件登録・編集</span>
      </div>
      {expired && (
        <div className="text-[12px] py-[15px] text-[#EE5736]">
          今月の募集は上限に達しました。来月以降の案件を申請ください。
        </div>
      )}
      <div className="flex mobile:flex-wrap pt-[20px] mobile:pt-[10px] pb-[13px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD] mt-[30px] sp:mt-[30px]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>案件種別</span>
        </span>
        <div className="flex">
          <RadioBtn
            title="来店"
            defaultValue={data.caseType}
            handleChange={(val) => setData({ ...data, caseType: val })}
            options={["来 店", "通販"]}
            labels={[" 来店型", " 通販型"]}
          />
        </div>
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>案件名</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px]  mt-[3px]">
            必須
          </span>
        </span>
        <Input
          value={data.caseName}
          inputClassName="max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
          placeholder="例：日本初のイタリアンスイーツ店のPR"
          requireMsg="案件概要を入力してください"
          handleChange={(val) => setData({ ...data, caseName: val })}
        />
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>画像</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px]  mt-[3px]">
            必須
          </span>
        </span>
        <div className="flex  lg:max-w-[300px]  mobile:w-full justify-center items-center  flex-col">
          {images.map(
            (_, idx) =>
              !removedImages.some((a) => a === idx) && (
                <ImageUploader
                  file={images[idx]}
                  onSelect={(file: File | null) => {
                    handleFileSelect(file, idx);
                  }}
                  onRemove={() => {
                    handleFileRemove(idx);
                  }}
                  removable={images.length - removedImages.length > 1}
                  key={idx}
                  id={`uploader${idx}`}
                />
              )
          )}
          <div>
            {images.length - removedImages.length < 4 && (
              <button
                onClick={() => {
                  setImages([...images, null]);
                }}
                className="w-[40px] h-[40px] m-[10px] flex justify-center items-center bg-green-500 text-white rounded-full shadow-md"
              >
                <Plus />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex mobile:flex-wrap pt-[20px] mobile:pt-[10px] pb-[20px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full mt-[5px] flex justify-end sp:justify-start  mr-[67px]">
          <span>案件内容</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px]  mt-[3px]">
            必須
          </span>
        </span>
        <TextArea
          value={data.caseContent}
          textAreaClassName="max-w-[300px] mobile:max-w-full grow h-[110px] border-[#D3D3D3] w-[100%]"
          placeholder="例：イタリアで話題のスイーツが日本に初上陸！バリスタがいれるエスプレッソと新感覚スイーツをご提供しますのでSNSでPRをお願いします。"
          requireMsg="案件内容を入力してください"
          handleChange={(val) => setData({ ...data, caseContent: val })}
        />
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>希望のハッシュタグ</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
            必須
          </span>
        </span>
        <Input
          notRequired
          placeholder="例：#〇〇 #△△"
          value={data.wantedHashTag}
          handleChange={(val) => setData({ ...data, wantedHashTag: val })}
          inputClassName="max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
        />
      </div>
      <div className="flex mobile:flex-wrap py-[20px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>希望のSNS</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
            必須
          </span>
        </span>
        <div className="flex gap-y-[10px] mobile:gap-y-[0px] flex-wrap max-w-[300px] mobile:max-w-full">
          <Checkbox
            value={wantedSNS.includes("instagram")}
            handleChange={(val) => handleSNSChange("instagram")}
            title={
              <img
                className="w-[35px]"
                src="/img/sns/Instagram.svg"
                alt="instagram"
              />
            }
            checkBoxClassName="mr-[20px] mobile:mb-[10px] mobile:mb-[10px]"
          />
          <Checkbox
            value={wantedSNS.includes("tiktok")}
            handleChange={(val) => handleSNSChange("tiktok")}
            title={
              <img
                className="w-[35px]"
                src="/img/sns/tiktok.svg"
                alt="tiktok"
              />
            }
            checkBoxClassName="mr-[20px] mobile:mb-[10px]"
          />
          <Checkbox
            handleChange={(val) => handleSNSChange("x")}
            value={wantedSNS.includes("x")}
            title={<img className="w-[35px]" src="/img/sns/x.svg" alt="x" />}
            checkBoxClassName="mr-[20px] mobile:mb-[10px]"
          />
          <Checkbox
            value={wantedSNS.includes("youtube")}
            handleChange={(val) => handleSNSChange("youtube")}
            title={
              <img
                className="w-[35px]"
                src="/img/sns/youtube.svg"
                alt="youtube"
              />
            }
            checkBoxClassName="mr-[20px] mobile:mb-[10px]"
          />
          <Checkbox
            value={wantedSNS.includes("facebook")}
            handleChange={(val) => handleSNSChange("facebook")}
            title={
              <img
                className="w-[35px]"
                src="/img/sns/facebook.svg"
                alt="youtube"
              />
            }
            checkBoxClassName="mr-[20px] mobile:mb-[10px]"
          />
          <Checkbox
            value={wantedSNS.includes("etc.")}
            handleChange={(val) => handleSNSChange("etc.")}
            title={"etc."}
            checkBoxClassName="mr-[20px] mobile:mb-[10px]"
          />
        </div>
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>来店場所</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
            必須
          </span>
        </span>
        <Input
          placeholder="東京都台東区浅草橋X-X-X"
          value={data.casePlace}
          notRequired
          handleChange={(val) => setData({ ...data, casePlace: val })}
          inputClassName="max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
        />
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>募集開始</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
            必須
          </span>
        </span>
        <div className="w-full flex flex-col flex-start ">
          <Input
            value={data.collectionStart}
            notRequired
            dateTime
            // max={expired ? calculateEndDate() : ''}
            min={calculateEndDate()}
            handleChange={(val) => setData({ ...data, collectionStart: val })}
            inputClassName="flex mb-[15px] max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
            placeholder="yyyy/mm/dd hh:mm"
          />
          <div className="flex flex-start text-[12px] ">
            ※募集開始を指定しない場合は承認後すぐに公開されます。
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>募集終了</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px]  mt-[3px]">
            必須
          </span>
        </span>
        <div className="w-full flex flex-col flex-start ">
          <Input
            value={data.collectionEnd}
            dateTime
            min={calculateEndDate()}
            handleChange={(val) => setData({ ...data, collectionEnd: val })}
            inputClassName="flex mb-[15px] max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
            placeholder="yyyy/mm/dd hh:mm"
          />
          <div className="flex flex-start text-[12px] ">
            ※入力した日時以降はインフルエンサー側に表示されなくなり応募できなくなります。
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>PR完了期限</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px]  mt-[3px]">
            必須
          </span>
        </span>
        <div className="w-full flex flex-col flex-start ">
          <Input
            value={data.caseEnd}
            min={calculateEndDate()}
            dateTime
            handleChange={(val) => setData({ ...data, caseEnd: val })}
            inputClassName="flex mb-[15px] max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
            placeholder="yyyy/mm/dd hh:mm"
          />
          <div className="flex flex-start text-[12px] ">
            ※インフルエンサーにPRを完了していただく最終期限です。
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
          <span>募集人数</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
            必須
          </span>
        </span>
        <Input
          value={data.collectionCnt}
          placeholder="例：〇人程度"
          notRequired
          handleChange={(val) => setData({ ...data, collectionCnt: val })}
          inputClassName="max-w-[300px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
        />
      </div>
      <div className="flex mobile:flex-wrap pt-[20px] mobile:pt-[10px] pb-[19px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full mt-[5px] flex justify-end sp:justify-start  mr-[67px]">
          <span>補足・注意事項</span>
          <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
            必須
          </span>
        </span>
        <TextArea
          value={data.addition}
          handleChange={(val) => setData({ ...data, addition: val })}
          textAreaClassName="max-w-[300px] mobile:max-w-full grow h-[110px] border-[#D3D3D3] w-[100%]"
          placeholder="例：※店内での利用のみとなります。※ご同行者1名は無償提供させていただきます。"
        />
      </div>
      {data.id && [
        <div
          key={"1"}
          className="flex mobile:flex-wrap items-center  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]"
        >
          <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
            <span>申請状態</span>
            <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
              必須
            </span>
          </span>
          <div>{data.status}</div>
        </div>,
        data.status === "承認" && (
          <div
            key={"2"}
            className="flex mobile:flex-wrap items-center pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]"
          >
            <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
              <span>募集状況</span>
              <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
                必須
              </span>
            </span>
            <div>{data.collectionStatus}</div>
          </div>
        ),
        data.status === "否認" ? (
          <div
            key={"3"}
            className="flex mobile:flex-wrap  pt-[20px] mobile:pt-[10px] pb-[3px] w-[60%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]"
          >
            <span className="w-[30%] mobile:w-full mt-[5px] mobile:w-full flex justify-end sp:justify-start  mr-[67px]">
              <span>否認理由</span>
              <span className="ml-[10px] text-[#EE5736] text-[11px] invisible">
                必須
              </span>
            </span>
            <div>{data.reason}</div>
          </div>
        ) : (
          ""
        ),
      ]}
      {error.length !== 0 &&
        error.map((aError, idx) => (
          <div className="text-center m-[10px] text-[#EE5736]" key={idx}>
            {aError}
          </div>
        ))}
      <div className="flex gap-[20px] mobile:gap-[0px] justify-center mt-[36px] mb-[160px] sp:mb-[60px]">
        {determineEditable() && [
          <Button
            key={"1"}
            buttonType={ButtonType.PRIMARY}
            handleClick={() => handleRequest(false)}
            buttonClassName="mobile:mr-[10px]"
          >
            <span className="flex ">
              <span>申請</span>
              <img
                className={
                  isLoading ? "rotate w-[14px] ml-[5px]" : "w-[14px] ml-[5px]"
                }
                src={isLoading ? "/img/refresh.svg" : "/img/apply.svg"}
                alt="refresh"
              />
            </span>
          </Button>,
          <Button
            key={"2"}
            buttonType={ButtonType.DANGER}
            handleClick={() => handleRequest(true)}
            buttonClassName="mobile:mr-[10px]"
          >
            <span className="flex ">
              <span>保存</span>
              <img
                className={
                  isSaveLoading
                    ? "rotate w-[14px] ml-[5px]"
                    : "w-[14px] ml-[5px]"
                }
                src={isSaveLoading ? "/img/refresh.svg" : "/img/download.svg"}
                alt="refresh"
              />
            </span>
          </Button>,
        ]}
        <Link href={"/appliedList"}>
          <Button
            buttonType={ButtonType.PRIMARYDEFAULT}
            buttonClassName="rounded-[5px]"
          >
            戻る
          </Button>
        </Link>
      </div>
    </div>
  );
};
export default CasePage;
