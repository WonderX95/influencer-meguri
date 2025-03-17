"use client";
import Input from "@/components/atoms/input";
import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

import GoogleCaptchaWrapper from "@/app/google-captcha-wrapper";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";


export default function ApplyPageWrapper() {
  return (
    <GoogleCaptchaWrapper>
      <ApplyPage />
    </GoogleCaptchaWrapper>
  );
}

function ApplyPage() {
  const type = '企業'
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { executeRecaptcha } = useGoogleReCaptcha();


  useEffect(() => {
    document.title = '申し込みページ';
  }, [])
  const onApply = async () => {
    if (isLoading) return;
    if (email === "") {
      setError("メールアドレスを入力する必要があります。");
      return;
    }
    let mailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!mailPattern.test(email.trim())) {
      setError("メールアドレス形式ではありません");
      return;
    }
    if (!executeRecaptcha) {
      console.log("Execute recaptcha not available yet");
      setError(
        "Execute recaptcha not available yet likely meaning key not recaptcha key not set"
      );
      return;
    }
    executeRecaptcha("applyFormSubmit").then((gReCaptchaToken) => {

      submitApply(gReCaptchaToken);
    });
    setIsLoading(false);
  };
  const submitApply = (gReCaptchaToken: string) => {
    async function goAsync() {
      setIsLoading(true);
      const response = await axios({
        method: "put",
        url: "/api/user",
        data: {
          email,
          type,
          gRecaptchaToken: gReCaptchaToken,
        },
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      });


      if (response?.data?.success === true) {
        await axios.post("/api/sendEmail", {
          to: email,
          subject: "【インフルエンサーめぐり】仮申請ありがとうございます",
          html: `
        <div>インフルエンサーめぐりに仮申請いただきありがとうございます。
        <br/>
        <br/>60分以内に以下のURLから登録申請をお願いします。 
        <br/>※60分以上経過した場合は再度、仮申請をしてください。
        <br/>https://influencer-meguri.jp/applyCompany?id=${response.data.data.hash}
        <br/>
        <br/>-----------------------------------------------------
        <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
        </div>
        https://influencer-meguri.jp/ask`,
        });
        if (typeof window !== "undefined") {
          router.push("/applyConfirm");
        }
      } else {
        if (response.data.msg) {
          setError(response.data.msg);
        } else {
          setError(`Recaptcha failure with score: ${response?.data?.score}`);
        }
      }
      setIsLoading(false);
    }
    goAsync().then(() => { });
  };
  return (
    <div className="bg-[#F5F5F5] pt-[90px]  flex  grow sp:text-[black]">
      <div className="bg-[white] text-center px-[20px] mobile:px-[40px] w-[614px] sp:w-[90%] rounded-[40px] block m-auto py-[70px] sp:py-[20px] shadow-lg">
        <img
          src="/img/logo(red).svg"
          className="blcok m-auto w-[265px] sp:hidden mb-[50px]"
        />
        <div className="text-title text-center">
          企業登録フォーム
        </div>
        <div className="w-full flex justify-center">
          <div className="block m-auto">
            <div className="ml-[70px] sp:ml-0 text-left mobile:ml-[0px] mobile:text-left">
              <div className="pt-[40px] pb-[10px]">
                インフルエンサーめぐりをご覧いただきありがとうございます。
              </div>
              <div className="py-[10px]">
                企業登録をご希望の方は以下から仮申請をしてください。
              </div>
              <div className="py-[10px]">
                ご入力いただいたメールアドレス宛に申請フォームをお送りします。
              </div>
            </div>
          </div>
        </div>

        <div className="flex mobile:gap-[5px] gap-[20px] mobile:flex-wrap justify-center w-full mt-[30px] mb-[20px] pr-[70px] mobile:pr-[0px] sp:mb-[30px]">
          <span className="mobile:w-full mobile:text-left mt-[5px] w-[100px] text-right">
            メールアドレス
          </span>
          <Input
            handleChange={(val) => setEmail(val)}
            inputClassName={"max-w-[250px] mobile:max-w-full grow"}
          />
        </div>
        <div className="text-center mb-[10px]">
          <Button handleClick={onApply} buttonType={ButtonType.PRIMARY}>
            <div className="flex items-center">
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
        </div>
        {error !== "" && (
          <div className="text-center text-[#EE5736]">{error}</div>
        )}
        <div className="mt-[30px] flex justify-center">
          <span className="text-[#3F8DEB]">
            <Link href={"/influencerApply"}>インフルエンサー登録はこちら</Link>
          </span>
          <img src="/img/triangle-right.svg" className="w-[11px] ml-[5px]" />
        </div>
      </div>
    </div>
  );
}
