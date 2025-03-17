"use client";
import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import TextArea from "@/components/atoms/textarea";
import io from "socket.io-client";
import { useRecoilValue } from "recoil";
import { authUserState } from "@/recoil/atom/auth/authUserAtom";
import { useParams } from "next/navigation";
import axios from "@/node_modules/axios/index";
import { useRouter } from "next/navigation";

const socket = io("https://influencer-meguri.jp");
import ChattingRooms from "./rooms";
// const socket = io("http://localhost:5000");

export default function ChattingPane() {
  const user = useRecoilValue(authUserState);
  const [data, setData] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [reload, setReload] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const [reset, setReset] = useState(false);
  const [msg, setMsg] = useState("");
  const { id } = useParams();
  const router = useRouter();
  const lastChecked = useRef<Number>(0)
  const containerRef = useRef(null);

  const fetchData = async (requireOther: boolean) => {
    if (document.title !== 'チャット') return;

    try {
      const { data: { messages, valid } } = await axios.get(`/api/chatting?id=${id}&&target=${user.user.targetId}&&user=${user.user.id}&&role=${user.user.role}`);
      if (messages.length) {
        setData(messages);
        lastChecked.current = messages[messages.length - 1].checked;
      }
      if (requireOther) {

        socket.emit("requireReload", { roomId: id, userId: user.user.id });
      }
      setIsValid(valid);
    }
    catch (e) {
      setIsValid(false)
    }
  };
  useEffect(() => {
    const fitTextInDiv = () => {
      const container = containerRef.current;
      if (!container) return;

      let containerWidth = container.clientWidth;
      let length = containerRef.current.innerHTML.length;
      let newFontSize = containerWidth / length;

      if (containerWidth < 500) {
        container.style.fontSize = `${newFontSize < 16 ? newFontSize : 16}px`;
      } else {
        container.style.fontSize = `16px`;
      }
    };

    fitTextInDiv();
    window.addEventListener('resize', fitTextInDiv); // Adjust on window resize
    socket.on("message", () => {
      setReload(!reload);
    });
    socket.on("requireReload", ({ data }) => {

      if (user.user.id !== data.userId && data.roomId === id) {
        fetchData(false);
      }
    });

    socket.emit("info", { roomId: id });

    const fetchRoomData = async () => {
      try {
        const result = await axios.get(`/api/chatting/chattingRoom?id=${id}`);
        if (result.data) {
          setRoomData(result.data);
        }
      } catch (e) {
        // router.push('/logout')
      }
    };
    document.title = 'チャット'
    fetchData(true);
    fetchRoomData();
  }, [reload]);
  useEffect(() => {
    const pane = document.getElementById("pane");
    if (pane) {
      pane.scrollTop = pane.scrollHeight;
    }

  }, [data]);
  useEffect(() => {
    return () => {
      socket.emit("leave", { roomId: id });
    }
  }, [])
  const handleSendMsg = async () => {
    if (msg === "") {
      return;
    }
    setMsg("");
    socket.emit("message", { roomId: id, userId: user.user.id, msg });
    setTimeout(async () => {
      if (lastChecked.current === 0) {
        if (user.user.role === "企業") {
          await axios.post("/api/sendEmail", {
            to: roomData?.infEmail,
            subject: "【インフルエンサーめぐり】チャットが届きました",
            html: `
                <div>
                ${roomData?.influencerName} 様<br/>
                <br/>以下の案件からチャットが届いてますのでログインしてご確認ください。
                <br/>
                <br/>企業名：${roomData?.companyName}
                <br/>案件名：${roomData?.caseName}
                <br/>URL ：https://influencer-meguri.jp/chattingInf/${id}
                <br/>
                <br/>-----------------------------------------------------
                <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
                </div> https://influencer-meguri.jp/ask
                `,
          });
        }
        if (user.user.role !== "企業") {
          await axios.post("/api/sendEmail", {
            to: roomData?.companyEmail,
            subject: "【インフルエンサーめぐり】チャットが届きました",
            html: `
                <div>
                ${roomData?.responsibleName} 様<br/>
                <br/>以下の案件からチャットが届いてますのでログインしてご確認ください。
                <br/>
                <br/>インフルエンサー名：${roomData?.influencerNickName}
                <br/>案件名：${roomData?.caseName}
                <br/>URL ：https://influencer-meguri.jp/chatting/${id}
                <br/>
                <br/>-----------------------------------------------------
                <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
                </div> https://influencer-meguri.jp/ask
                `,
          });
        }

      }
    }, 1000);
    setReset(!reset);
  };
  const formatTimeString = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);

    const formattedHours = hours < 10 ? `0${hours}` : hours.toString();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${formattedHours}:${formattedMinutes}`;
  }
  const displayMessage = (message: string): React.ReactNode => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:cursor-pointer text-[#3F8DEB] underline underline-[#3F8DEB] underline-offset-[3px]"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  let day = "";
  return (
    <>
      <div>
        {isValid && <div className="lg:hidden flex flex-reverse justify-between items-center pt-[12vh] min-h-[6vh]">
          <div className="flex py-[10px] items-center flex-col gap-[10px] w-full">
            <div className="font-bold flex flex-wrap pb-[0px] text-[16px] relative w-full leading-none	">
              {roomData?.caseName?.length > 0 && Array.from(roomData?.caseName).map((a: string, idx) => (
                <span key={idx}>{a}</span>
              ))}
            </div>
            <div className="italic h-full pb-[0px] leading-none	 flex w-full" ref={containerRef}>
              {user?.user?.role === "インフルエンサー" ? roomData?.companyName : roomData?.influencerName}
            </div>
          </div>

          <img
            alt="hamburger"
            src="/img/hamburger.svg"
            className="h-[20px] w-[20px] min-w-[14px] cursor-pointer"
            onClick={() => {
              setShowRooms(!showRooms);
            }}
          />

        </div>}
      </div>
      <div
        className={
          showRooms
            ? "lg:hidden opacity-100 "
            : "lg:hidden hidden  duration-200"
        }
      >
        <ChattingRooms />
      </div>
      {isValid ? <div className="border-[1px] sp:mt-[3vh] border-[#DDDDDD] box-border flex flex-col">
        <div
          className="bg-[#F8F9FA] border-[1px] h-[63vh] pt-[100px] overflow-y-auto scroll-smooth"
          id="pane"
        >
          {data.map((aData, idx) => {
            let showDay = aData.day !== day;
            if (showDay) day = aData.day;

            return [
              showDay && (
                <div key={"1"} className="w-full text-center  mb-[30px] ">
                  <span className="text-[white] rounded-[15px] bg-[#DEDEDE] px-[12px] py-[5px]">
                    {aData.day}
                  </span>
                </div>
              ),
              aData.userId === user.user.id ? (
                <div className="flex flex-col " key={idx}>
                  <div className="w-full sp:mt-[30px] my-[20px]">
                    <div className="chat-me relative float-right mr-[65px] sp:mx-[10px] inline-block bg-[#DEDEDE] px-[20px] py-[15px] rounded-[15px] shadow-sm border-[1px] border-[#DDDDDD]">
                      {aData.msg.split("\n")?.map((a, key) => (
                        <div key={key}>{displayMessage(a)}</div>
                      ))}
                      {/* <img src="/img/check.svg" className="w-[10px] absolute right-[3px]" />
                      {aData.checked === 1 && <img src="/img/check.svg" className="w-[10px] absolute right-[7px]" />} */}
                      <div className="absolute bottom-[-30px] right-0 text-[#A8A8A8]">
                        {formatTimeString(aData.time)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={idx}>
                  <div className="chat-you relative ml-[65px] my-[30px] sp:mx-[10px] inline-block bg-[white] px-[20px] py-[15px] rounded-[15px] shadow-sm">
                    {/* <div className="absolute top-[-30px]">{aData.name}</div> */}
                    {aData.msg.split("\n")?.map((a, key) => (
                      <div key={key}>{a}</div>
                    ))}
                    <div className="absolute bottom-[-30px] right-0 text-[#A8A8A8]">
                      {aData.time}
                    </div>
                  </div>
                </div>
              ),
            ];
          })}
        </div>
        <div className="h-[10vh] flex items-center justify-between border-t-[1px] border-[#DDDDDD]">
          <TextArea
            handleCtrlEnter={() => handleSendMsg()}
            reset={reset}
            placeholder="メッセージを入力"
            textAreaClassName="h-[9vh] mt-[1px] border-0 grow"
            handleChange={(val) => setMsg(val)}
            value={msg}
          />
          <Button
            handleClick={handleSendMsg}
            buttonType={ButtonType.ROUNDED}
            buttonClassName="mx-[30px] w-[45px] h-[45px]"
          >
            <img src="/img/apply.svg" alt="apply" />
          </Button>
        </div>
      </div >
        :
        <div className="flex items-center justify-center">
          チャット履歴はありません。
        </div>
      }
    </>

  );
}
