"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import Checkbox from "@/components/atoms/checkbox";
import Input from "@/components/atoms/input";
import Select from "@/components/atoms/select";
import TextArea from "@/components/atoms/textarea";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { authUserState } from "@/recoil/atom/auth/authUserAtom";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "../../utils/modal";
import AppyExpired from "../company/applyExpired";
import Link from "next/link";
export interface InfluencerInfoProps {
  applyMode?: boolean;
}
const prefectures = [
  "",
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];
const followersOptions = [
  "",
  "～1,000",
  "1,001～3,000",
  "3,001～5,000",
  "5,001～10,000",
  "10,001～30,000",
  "30,001～50,000",
  "50,001～100,000",
  "100,001～300,000",
  "300,001～500,000",
  "500,001～1,000,000",
  "1,000,001～",
];
const msgs = {
  nickName: "ニックネームを入力してください",
  phoneNumber: "電話番号を入力してください ",
  emailAddress: "メールアドレスを入力してください  ",
  prefecture: "都道府県を選択してください",
};
const InfluencerInfoPage: React.FC<InfluencerInfoProps> = ({
  applyMode,
}: InfluencerInfoProps) => {
  const [confirmMsg, setConfirmMsg] = useState("操作が成功しました。");
  const authUser = useRecoilValue(authUserState);
  const [data, setData] = useState(null);
  const [genre, setGenre] = useState(JSON.stringify([]));
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState([]);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  const [year, setYear] = useState("2000");
  const [month, setMonth] = useState("1");
  const [day, setDay] = useState("1");

  const yearOptions = (): JSX.Element[] => {
    const currentYear = new Date().getFullYear();
    const startYear = 1924;

    const options = [];

    for (let year = startYear; year <= currentYear; year++) {
      options.push(
        <option key={year} value={`${year}`}>
          {year}
        </option>
      );
    }

    return options;
  };
  useEffect(() => {
    setYear(data?.year ?? "2000");
    setMonth(data?.month ?? "1");
    setDay(data?.day ?? "1");
  }, []);

  const monthOptions = (): JSX.Element[] => {
    const months = [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ];

    return months.map((month) => (
      <option key={month.value} value={`${month.value}`}>
        {month.value}
      </option>
    ));
  };
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInMonth = (year: number, month: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && isLeapYear(year)) {
      return 29; // February in a leap year
    }
    return daysInMonth[month - 1];
  };

  const dayOptions = (year: number, month: number): JSX.Element[] => {
    const daysInMonth = getDaysInMonth(year, month);
    const options = [];

    for (let day = 1; day <= daysInMonth; day++) {
      options.push(
        <option key={day} value={`${day}`}>
          {day}
        </option>
      );
    }

    return options;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const applyId = searchParams.get("id");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get(
          `/api/influencer/aInfluencer?id=${authUser.user?.targetId}`
        );
        if (result.data) {
          setData(result.data);
          setGenre(result.data?.genre);
        }
      } catch (e) {
        router.push("/logout");
      }
    };
    const getAppliedUserData = async () => {
      const result = await axios.get(`/api/user?id=${applyId}`);
      if (result.data?.type === "error") {
        setExpired(true);
      } else {
        setData({ ...data, emailAddress: result.data?.email });
        const applyTime = new Date(result.data?.applyTime);
        const currentTime = new Date(result.data?.current);
        const timeDiff = currentTime.getTime() - applyTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        if (result.data?.name?.length > 0) {
          setExpired(true);
        }
        if (minutesDiff > 60) {
          await axios.delete(`/api/user?id=${applyId}`);
          setExpired(true);
        }
      }
    };
    if (applyMode) {
      document.title = "インフルエンサー登録フォーム";
    }
    if (!applyMode && authUser) {
      fetchData();
      document.title = "インフルエンサー情報変更";
    }
    if (applyMode && applyId) {
      getAppliedUserData();
    }
  }, []);
  const handleGenreChange = (val) => {
    let isAlreadyExits = false;
    const genre1 = JSON.parse(genre);
    genre1.forEach((a) => {
      if (a === val) isAlreadyExits = true;
    });
    if (!isAlreadyExits) {
      setGenre(JSON.stringify([...genre1, val]));
    } else {
      let filteredArray = genre1.filter((element) => element !== val);
      setGenre(JSON.stringify(filteredArray));
    }
  };
  const handleSend = async (applyMode: boolean) => {
    const body = {
      ...data,
      genre,
      year,
      month,
      day,
    };
    const ErrorList = [];
    const keys = Object.keys(msgs);
    let isValid = true;

    keys.forEach((aKey) => {
      if (body[aKey] === "" || !body[aKey] || !body[aKey]) {
        ErrorList.push(msgs[aKey]);
        isValid = false;
      }
    });
    if (JSON.parse(genre).length === 0) {
      ErrorList.push("ジャンルを選択してください");
      isValid = false;
    }
    let phonePattern = /^0\d{1,4}-\d{1,4}-\d{4}$/;
    if (
      data?.phoneNumber?.length > 0 &&
      !phonePattern.test(data?.phoneNumber.trim())
    ) {
      ErrorList.push("電話番号形式ではありません");
      isValid = false;
    }
    let mailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (
      data?.emailAddress?.length > 0 &&
      !mailPattern.test(data?.emailAddress.trim())
    ) {
      ErrorList.push("メールアドレス形式ではありません");
      isValid = false;
    }
    if (!agree && applyMode) {
      ErrorList.push("利用規約、個人情報の取り扱いに同意する必要があります。");
      isValid = false;
    }
    if (!isValid) {
      setError(ErrorList);
      return;
    }
    setIsLoading(true);
    let result;
    if (applyMode) {
      const defaultSNS = JSON.stringify({ account: "", followers: "" });
      if (!body.instagram) body.instagram = defaultSNS;
      if (!body.tiktok) body.tiktok = defaultSNS;
      if (!body.youtube) body.youtube = defaultSNS;
      if (!body.facebook) body.facebook = defaultSNS;
      if (!body.x) body.x = defaultSNS;
      if (!body.gender) body.gender = "男性";
      result = await axios.post("api/influencer", body);

      if (result.data?.type === "success") {
        await axios.post("/api/sendEmail", {
          from: data?.emailAddress,
          subject: "【インフルエンサーめぐり】登録申請がありました",
          html: `<div>インフルエンサーめぐりに登録申請がありました。
            <br/>ログインして確認してください。
            </div>
            https://influencer-meguri.jp/influencer/${result.data?.id}
            `,
        });
        await axios.post("/api/sendEmail", {
          to: data?.emailAddress,
          subject: "【インフルエンサーめぐり】申請ありがとうございます",
          html: `<div>${
            data?.influencerName?.length ? data?.influencerName : data?.nickName
          } 様
            <br/>
            <br/>インフルエンサーめぐりに申請いただきありがとうございます。
            <br/>
            <br/>申請内容を確認しますのでしばらくお待ちください。
            <br/>確認後にご登録いただいたメールアドレスにご連絡します。
            <br/>
            <br/>-----------------------------------------------------
            <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
            </div>https://influencer-meguri.jp/ask
            `,
        });
        router.push("/applyInfluencerComplete");
      } else {
        setError(["メールアドレスが登録されていません。"]);
      }
    } else {
      result = await axios.put("api/influencer", body);
      if (result.data?.type === "success") {
        setConfirmMsg("操作が成功しました。");
        setError([]);
        setShowConfirm(true);
      } else {
        setConfirmMsg(result.data?.msg ?? "error");
        setShowConfirm(true);
      }
    }
    setIsLoading(false);
  };
  if (applyMode && (!applyId || expired)) {
    return (
      <div className="flex mobile:flex-wrap grow min-h-full">
        <AppyExpired />
      </div>
    );
  }
  return (
    <div
      className={
        applyMode
          ? "text-center  px-[35px] sp:px-[12px] sp:text-small pt-[200px] w-full"
          : "text-center bg-[white] px-[35px] sp:px-[12px] sp:text-small w-full "
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
          onOk={() => setShowConfirm(false)}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
      {!applyMode && (
        <div className="flex mobile:flex-wrap items-center py-[20px]  w-[full] border-b-[1px] border-[#DDDDDD] mt-[70px] mb-[50px] sp:mt-[96px]">
          <span className="text-title sp:text-sptitle">
            インフルエンサー情報変更
          </span>
        </div>
      )}
      <div className="flex mobile:flex-wrap mobile:flex py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="mt-[5px] min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>お名前</span>
        </span>
        <Input
          placeholder="山田 太郎"
          handleChange={(val) => setData({ ...data, influencerName: val })}
          inputClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
          value={
            data?.influencerName?.length > 0 && data?.influencerName !== "null"
              ? data?.influencerName
              : ""
          }
        />
      </div>
      <div className="flex mobile:flex-wrap  py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="mt-[5px] min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>お名前カナ</span>
        </span>
        <Input
          placeholder="ヤマダ タロウ"
          handleChange={(val) => setData({ ...data, influencerNameGana: val })}
          inputClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
          value={
            data?.influencerNameGana?.length > 0 &&
            data?.influencerNameGana !== "null"
              ? data?.influencerNameGana
              : ""
          }
        />
      </div>
      <div className="flex mobile:flex-wrap items-center py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>生年月日</span>
        </span>
        <div className="flex items-center gap-[5px] max-w-[250px] mobile:max-w-full grow w-100%">
          <Select
            handleChange={(val) => {
              setYear(val);
            }}
            value={year}
            selectClassName="max-w-[250px] mobile:max-w-full  border-[#D3D3D3] "
          >
            {yearOptions()}
          </Select>
          <span>年</span>
          <Select
            handleChange={(val) => {
              setMonth(val);
            }}
            value={month}
            selectClassName="max-w-[250px] mobile:max-w-full  border-[#D3D3D3] "
          >
            {monthOptions()}
          </Select>
          <span>月</span>
          <Select
            handleChange={(val) => {
              setDay(val);
            }}
            value={day}
            selectClassName="max-w-[250px] mobile:max-w-full  border-[#D3D3D3] "
          >
            {dayOptions(parseInt(year), parseInt(month))}
          </Select>
          <span>日</span>
        </div>
      </div>
      <div className="flex mobile:flex-wrap items-center py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>性別</span>
        </span>
        <Select
          handleChange={(val) => setData({ ...data, gender: val })}
          value={data ? data?.gender : "男性"}
          selectClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
        >
          <option value={"男性"}>男性</option>
          <option value={"女性"}>女性</option>
          <option value={"その他"}>その他</option>
        </Select>
      </div>
      <div className="flex mobile:flex-wrap  py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="mt-[5px] min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>ニックネーム</span>
          {<span className="ml-[10px] text-[#EE5736] text-[11px]">必須</span>}
        </span>
        <Input
          requireMsg="ニックネームを入力してください"
          placeholder="ヤマタロウ"
          handleChange={(val) => setData({ ...data, nickName: val })}
          inputClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
          value={data ? data?.nickName : ""}
        />
      </div>
      <div className="flex mobile:flex-wrap  py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="mt-[5px] min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>電話番号</span>
          {<span className="ml-[10px] text-[#EE5736] text-[11px]">必須</span>}
        </span>
        <Input
          placeholder="03-1234-5678"
          requireMsg="電話番号を入力してください"
          formatMsg="電話番号形式ではありません"
          format="^0\d{1,4}-\d{1,4}-\d{4}$"
          handleChange={(val) => setData({ ...data, phoneNumber: val })}
          inputClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
          value={data ? data?.phoneNumber : ""}
        />
      </div>
      {!applyMode && (
        <div className="flex mobile:flex-wrap  py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
          <span className="mt-[5px] min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
            <span>メールアドレス</span>
            {<span className="ml-[10px] text-[#EE5736] text-[11px]">必須</span>}
          </span>
          <Input
            formatMsg="メールアドレス形式ではありません"
            format="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            requireMsg="メールアドレスを入力してください"
            handleChange={(val) => setData({ ...data, emailAddress: val })}
            inputClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
            value={data ? data?.emailAddress : ""}
          />
        </div>
      )}

      <div className="flex mobile:flex-wrap items-center py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>都道府県</span>
          {<span className="ml-[10px] text-[#EE5736] text-[11px]">必須</span>}
        </span>

        <Select
          value={data ? data?.prefecture : prefectures[0]}
          handleChange={(val) => setData({ ...data, prefecture: val })}
          selectClassName="max-w-[250px] mobile:max-w-full grow border-[#D3D3D3] w-[100%]"
        >
          {prefectures?.map((aPrefecture, key) => (
            <option key={key} value={aPrefecture}>
              {aPrefecture}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex mobile:flex-col   py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mr-[67px]">
          <span>ジャンル</span>
          {<span className="ml-[10px] text-[#EE5736] text-[11px]">必須</span>}
        </span>
        <div className="min-w-[250px]">
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("美容・コスメ系")
                  : false
              }
              title="美容・コスメ系"
              checkBoxClassName="mr-[25px]"
              handleChange={(val) => handleGenreChange("美容・コスメ系")}
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("アパレル・ファッション系")
                  : false
              }
              handleChange={(val) =>
                handleGenreChange("アパレル・ファッション系")
              }
              title="アパレル・ファッション系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("スイーツ・グルメ系")
                  : false
              }
              handleChange={(val) => handleGenreChange("スイーツ・グルメ系")}
              title="スイーツ・グルメ系"
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("旅行・レジャー系")
                  : false
              }
              handleChange={(val) => handleGenreChange("旅行・レジャー系")}
              title="旅行・レジャー系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes(
                      "育児・ファミリー系（ママ、キッズ等）"
                    )
                  : false
              }
              title="育児・ファミリー系（ママ、キッズ等）"
              handleChange={(val) =>
                handleGenreChange("育児・ファミリー系（ママ、キッズ等）")
              }
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre ? JSON.parse(data?.genre).includes("教育系") : false
              }
              handleChange={(val) => handleGenreChange("教育系")}
              title="教育系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes(
                      "スポーツ・フィットネス・ボディメイク系"
                    )
                  : false
              }
              handleChange={(val) =>
                handleGenreChange("スポーツ・フィットネス・ボディメイク系")
              }
              title="スポーツ・フィットネス・ボディメイク系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("ダイエット系")
                  : false
              }
              title="ダイエット系"
              handleChange={(val) => handleGenreChange("ダイエット系")}
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("エンタメ系")
                  : false
              }
              title="エンタメ系"
              handleChange={(val) => handleGenreChange("エンタメ系")}
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("ビジネス系")
                  : false
              }
              handleChange={(val) => handleGenreChange("ビジネス系")}
              title="ビジネス系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("漫画・イラスト系")
                  : false
              }
              title="漫画・イラスト系"
              handleChange={(val) => handleGenreChange("漫画・イラスト系")}
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("お金・投資系")
                  : false
              }
              handleChange={(val) => handleGenreChange("お金・投資系")}
              title="お金・投資系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              title="アート系"
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("アート系")
                  : false
              }
              handleChange={(val) => handleGenreChange("アート系")}
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("ペット・動物系")
                  : false
              }
              handleChange={(val) => handleGenreChange("ペット・動物系")}
              title="ペット・動物系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("記事執筆・ライティング系")
                  : false
              }
              title="記事執筆・ライティング系"
              handleChange={(val) =>
                handleGenreChange("記事執筆・ライティング系")
              }
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("ライフスタイル系")
                  : false
              }
              handleChange={(val) => handleGenreChange("ライフスタイル系")}
              title="ライフスタイル系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes(
                      "花・フラワーアレンジメント系"
                    )
                  : false
              }
              handleChange={(val) =>
                handleGenreChange("花・フラワーアレンジメント系")
              }
              title="花・フラワーアレンジメント系"
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("医師・医療系")
                  : false
              }
              handleChange={(val) => handleGenreChange("医師・医療系")}
              title="医師・医療系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes("バーチャル系")
                  : false
              }
              handleChange={(val) => handleGenreChange("バーチャル系")}
              title="バーチャル系"
              checkBoxClassName="mr-[25px]"
            />
            <Checkbox
              value={
                data?.genre
                  ? JSON.parse(data?.genre).includes(
                      "写真家・フォトグラファー系"
                    )
                  : false
              }
              handleChange={(val) =>
                handleGenreChange("写真家・フォトグラファー系")
              }
              title="写真家・フォトグラファー系"
            />
          </div>
          <div className="flex flex-wrap mobile:flex-col gap-[10px] py-[5px]">
            <Checkbox
              value={
                data?.genre ? JSON.parse(data?.genre).includes("その他") : false
              }
              handleChange={(val) => handleGenreChange("その他")}
              title="その他"
            />
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mt-[10px] mr-[67px]">
          <span>Instagram</span>
        </span>
        <div className="grow">
          <div className="flex flex-col gap-2 mobile:max-w-full items-start  grow py-[5px]">
            <span className="w-full text-left ">
              ユーザー名またはプロフィールURL
            </span>
            <Input
              handleChange={(val) =>
                setData({
                  ...data,
                  instagram: data?.instagram
                    ? JSON.stringify({
                        ...JSON.parse(data?.instagram),
                        account: val,
                      })
                    : JSON.stringify({
                        account: val,
                        followers: "",
                      }),
                })
              }
              inputClassName="mobile:w-full sp:ml-[0px] grow w-[250px]  "
              value={data?.instagram ? JSON.parse(data?.instagram).account : ""}
            ></Input>
          </div>
          <div className="flex flex-col gap-2  grow py-[5px]">
            <span className="w-[100px] text-left ">フォロワー数</span>
            <Select
              disabled={!data?.instagram}
              value={
                data?.instagram
                  ? JSON.parse(data?.instagram).followers
                  : followersOptions[0]
              }
              handleChange={(val) =>
                setData({
                  ...data,
                  instagram: JSON.stringify({
                    ...JSON.parse(data?.instagram),
                    followers: val,
                  }),
                })
              }
              selectClassName="mobile:w-full  sp:ml-[0px] grow  w-[250px]"
            >
              {followersOptions?.map((aOption, key) => (
                <option key={key} value={aOption}>
                  {aOption}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mt-[10px] mr-[67px]">
          <span className="w-[66px] text-right mobile:text-left">X</span>
        </span>
        <div className="grow">
          <div className="flex flex-col gap-2 mobile:max-w-full w-full grow py-[5px]">
            <span className="w-full text-left ">
              ユーザー名またはプロフィールURL
            </span>
            <Input
              value={data?.x ? JSON.parse(data?.x).account : ""}
              handleChange={(val) =>
                setData({
                  ...data,
                  x: data?.x
                    ? JSON.stringify({
                        ...JSON.parse(data?.x),
                        account: val,
                      })
                    : JSON.stringify({
                        account: val,
                        followers: "",
                      }),
                })
              }
              inputClassName="sp:ml-[0px] grow mobile:w-full w-[250px]"
            ></Input>
          </div>
          <div className="flex flex-col gap-2  grow py-[5px]">
            <span className="w-full text-left ">フォロワー数</span>
            <Select
              value={
                data?.x ? JSON.parse(data?.x).followers : followersOptions[0]
              }
              disabled={!data?.x}
              handleChange={(val) =>
                setData({
                  ...data,
                  x: JSON.stringify({
                    ...JSON.parse(data?.x),
                    followers: val,
                  }),
                })
              }
              selectClassName="mobile:w-full sp:ml-[0px] grow w-[250px]"
            >
              {followersOptions?.map((aOption, key) => (
                <option key={key} value={aOption}>
                  {aOption}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mt-[10px] mr-[67px]">
          <span className="w-[66px] text-right mobile:text-left">Facebook</span>
        </span>
        <div className="grow">
          <div className="flex flex-col gap-2 mobile:max-w-full items-start  grow py-[5px]">
            <span className="w-full text-left ">
              ユーザー名またはプロフィールURL
            </span>
            <Input
              handleChange={(val) =>
                setData({
                  ...data,
                  facebook: data?.facebook
                    ? JSON.stringify({
                        ...JSON.parse(data?.facebook),
                        account: val,
                      })
                    : JSON.stringify({
                        account: val,
                        followers: "",
                      }),
                })
              }
              inputClassName="mobile:w-full sp:ml-[0px] grow w-[250px]  "
              value={data?.facebook ? JSON.parse(data?.facebook).account : ""}
            ></Input>
          </div>
          <div className="flex flex-col gap-2  grow py-[5px]">
            <span className="w-[100px] text-left ">フォロワー数</span>
            <Select
              disabled={!data?.facebook}
              value={
                data?.facebook
                  ? JSON.parse(data?.facebook).followers
                  : followersOptions[0]
              }
              handleChange={(val) =>
                setData({
                  ...data,
                  facebook: JSON.stringify({
                    ...JSON.parse(data?.facebook),
                    followers: val,
                  }),
                })
              }
              selectClassName="mobile:w-full  sp:ml-[0px] grow  w-[250px]"
            >
              {followersOptions?.map((aOption, key) => (
                <option key={key} value={aOption}>
                  {aOption}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap py-[15px] mobile:w-full w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mt-[10px] mr-[67px]">
          <span className="w-[66px] text-right mobile:text-left">TikTok</span>
        </span>
        <div className="grow">
          <div className="flex flex-col gap-2 mobile:max-w-full items-start  grow py-[5px]">
            <span className="w-full text-left ">
              ユーザー名またはプロフィールURL
            </span>
            <Input
              handleChange={(val) =>
                setData({
                  ...data,
                  tiktok: data?.tiktok
                    ? JSON.stringify({
                        ...JSON.parse(data?.tiktok),
                        account: val,
                      })
                    : JSON.stringify({
                        account: val,
                        followers: "",
                      }),
                })
              }
              inputClassName="mobile:w-full sp:ml-[0px] grow w-[250px]  "
              value={data?.tiktok ? JSON.parse(data?.tiktok).account : ""}
            ></Input>
          </div>
          <div className="flex flex-col gap-2  grow py-[5px]">
            <span className="w-[100px] text-left ">フォロワー数</span>
            <Select
              disabled={!data?.tiktok}
              value={
                data?.tiktok
                  ? JSON.parse(data?.tiktok).followers
                  : followersOptions[0]
              }
              handleChange={(val) =>
                setData({
                  ...data,
                  tiktok: JSON.stringify({
                    ...JSON.parse(data?.tiktok),
                    followers: val,
                  }),
                })
              }
              selectClassName="mobile:w-full  sp:ml-[0px] grow  w-[250px]"
            >
              {followersOptions?.map((aOption, key) => (
                <option key={key} value={aOption}>
                  {aOption}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="flex mobile:flex-wrap py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mt-[10px] mr-[67px]">
          <span className="w-[66px] text-right mobile:text-left">YouTube</span>
        </span>
        <div className="grow">
          <div className="flex flex-col gap-2 mobile:max-w-full items-start  grow py-[5px]">
            <span className="w-full text-left ">
              ユーザー名またはプロフィールURL
            </span>
            <Input
              handleChange={(val) =>
                setData({
                  ...data,
                  youtube: data?.youtube
                    ? JSON.stringify({
                        ...JSON.parse(data?.youtube),
                        account: val,
                      })
                    : JSON.stringify({
                        account: val,
                        followers: "",
                      }),
                })
              }
              inputClassName="mobile:w-full sp:ml-[0px] grow w-[250px]  "
              value={data?.youtube ? JSON.parse(data?.youtube).account : ""}
            ></Input>
          </div>
          <div className="flex flex-col gap-2  grow py-[5px]">
            <span className="w-[100px] text-left ">フォロワー数</span>
            <Select
              disabled={!data?.youtube}
              value={
                data?.youtube
                  ? JSON.parse(data?.youtube).followers
                  : followersOptions[0]
              }
              handleChange={(val) =>
                setData({
                  ...data,
                  youtube: JSON.stringify({
                    ...JSON.parse(data?.youtube),
                    followers: val,
                  }),
                })
              }
              selectClassName="mobile:w-full  sp:ml-[0px] grow  w-[250px]"
            >
              {followersOptions?.map((aOption, key) => (
                <option key={key} value={aOption}>
                  {aOption}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex mobile:flex-col py-[15px] w-[40%] sp:w-full m-auto border-b-[1px] border-[#DDDDDD]   sp:px-[18px]">
        <span className="min-w-[35%] mobile:w-full sp:w-[150px] flex mobile:flex-wrap justify-end sp:justify-start  mt-[10px] mr-[67px]">
          <span>その他のSNS </span>
        </span>
        <TextArea
          value={data ? (data?.otherSNS === "null" ? "" : data?.otherSNS) : ""}
          handleChange={(val) => setData({ ...data, otherSNS: val })}
          textAreaClassName="max-w-[380px] mobile:max-w-full grow h-[200px]"
        ></TextArea>
      </div>
      <div className="flex mobile:flex-wrap justify-center">
        {applyMode && (
          <Checkbox
            prefix={""}
            value={agree}
            checkBoxClassName="mt-[36px]"
            title={
              <span>
                <Link
                  href={"https://influencer-meguri.jp/terms-of-service.html"}
                  target="_blank"
                  className="underline decoration-[#353A40] underline-offset-[5px]"
                >
                  利用規約
                </Link>
                <span className="decoration-[#353A40] underline-offset-[5px]">
                  、
                </span>
                <Link
                  href={"https://influencer-meguri.jp/privacypolicy.html"}
                  target="_blank"
                  className="mx-[5px] underline decoration-[#353A40] underline-offset-[5px]"
                >
                  個人情報の取り扱い
                </Link>
                に同意します
              </span>
            }
            handleChange={(isChecked) => {
              setAgree(isChecked);
            }}
          />
        )}
      </div>
      {error.length !== 0 &&
        error.map((aError, idx) => (
          <div key={idx} className="text-center m-[10px] text-[#EE5736]">
            {aError}
          </div>
        ))}
      <div className="flex gap-[20px] mobile:gap-[0px] mobile:flex-wrap justify-center mt-[36px] mb-[160px] sp:mb-[60px]">
        {!applyMode && (
          <Button
            buttonType={ButtonType.PRIMARY}
            handleClick={() => handleSend(false)}
            buttonClassName="mobile:mr-[10px]"
          >
            <span className="flex mobile:flex-wrap items-center">
              <span>更新</span>
              <img
                className={
                  isLoading ? "w-[14px] ml-[5px] rotate" : "w-[14px] ml-[5px]"
                }
                src="/img/refresh.svg"
                alt="refresh"
              />
            </span>
          </Button>
        )}
        {applyMode && (
          <Button
            buttonType={ButtonType.PRIMARY}
            handleClick={() => handleSend(true)}
            buttonClassName="mobile:mr-[10px]"
          >
            <div className="flex mobile:flex-wrap items-center">
              {isLoading ? (
                <img
                  src="/img/refresh.svg"
                  alt="rotate"
                  className="mr-[5px] rotate"
                />
              ) : (
                ""
              )}
              送信する
            </div>
          </Button>
        )}
        {!applyMode && (
          <Button
            buttonType={ButtonType.DEFAULT}
            buttonClassName="rounded-[5px]"
            handleClick={() => router.back()}
          >
            戻る
          </Button>
        )}
      </div>
    </div>
  );
};
export default InfluencerInfoPage;
