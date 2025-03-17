"use client";

import Checkbox from "@/components/atoms/checkbox";
import SearchBar from "@/components/organisms/searchbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser } from "../../utils/getUser";
import axios from "axios";
import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import Image from "next/image";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/navigation";
import Modal from "../../utils/modal";

export default function AppliedList() {
  const [active, setActive] = useState(null);
  const user = getUser();
  const [data, setData] = useState([]);
  const [visibleData, setVisibleData] = useState([]);
  const [optionedData, setOptionedData] = useState([]);
  const [options, setOptions] = useState([]);
  const [options1, setOptions1] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 10;
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = optionedData.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(optionedData.length / itemsPerPage);
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % optionedData.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setItemOffset(newOffset);
  };
  const [showCollectionStartModal, setShowCollectionStartModal] = useState(false);
  const [showCollectionEndModal, setShowCollectionEndModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const router = useRouter();
  const [activeCase, setActiveCase] = useState(null);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await axios.get(
          `/api/case/company?id=${user.user?.targetId}`
        );
        if (result.data?.length) {
          const resultData = result.data.filter((aData => !(aData.next > 0)));

          setData(resultData);
          setVisibleData(resultData);
          setOptionedData(resultData);
          setIsLoading(false);
        }
        setIsLoading(false);
      } catch (e) {
        router.push('/logout')
      }
    };
    if (user) fetchData();
    document.title = '登録案件一覧'
  }, [reload]);

  const handleCollectionStateChange = async (
    state: string,
  ) => {

    if (state === "募集中") {
      if (!(activeCase?.status === "承認" || activeCase?.status === '承認 / 否認')) {

        setConfirmMsg("承認されていないため、募集を開始できません。");
        setShowConfirm(true);
        return;
      }
    }
    const update = state;
    const body = {
      update,
      approveMode: false,
      companyId: activeCase?.companyId,
    }
    const result = await axios.put(`/api/case/aCase/?id=${activeCase?.id}`, body);
    if (result.data.type === "success") {
      if (body.update === '募集中') {
        await axios.post("/api/sendEmail", {
          to: user.user.email,
          subject: "【インフルエンサーめぐり】案件の募集を開始しました",
          html: `<div>${user.user.responsibleName} 様<br/>
          <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。
          <br/>案件「 ${activeCase?.caseName} 」の募集を開始しましたのでログインしてご確認ください。<br/>
          <br/>-----------------------------------------------------
          <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
          </div> https://influencer-meguri.jp/ask
          `,
        });
      }
      if (body.update === '募集終了') {
        await axios.post("/api/sendEmail", {
          to: user.user.email,
          subject: "【インフルエンサーめぐり】案件の募集を終了しました",
          html: `<div>${user.user.responsibleName} 様<br/>
          <br/>いつもインフルエンサーめぐりをご利用いただきありがとうございます。
          <br/>案件「 ${activeCase?.caseName} 」の募集を終了しましたのでログインしてご確認ください。<br/>
          <br/>-----------------------------------------------------
          <br/>不明点がございましたらお問い合わせフォームよりご連絡ください。
          </div> https://influencer-meguri.jp/ask
          `,
        });
      }
      setReload(!reload);
    } else {
      setConfirmMsg(result.data.msg);
      setShowConfirm(true);
    }
    setActiveCase(null);
  };
  const makeOptioinedData = (visibleData, result, result1) => {
    let resultData = [];
    if (result.length === 0) {
      resultData = visibleData;
    }
    if (result.some((aOption) => aOption === "申請前")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.status === "申請前"),
      ];
    }
    if (result.some((aOption) => aOption === "申請中")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.status === "申請中"),
      ];
    }
    if (result.some((aOption) => aOption === "承認")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.status === "承認"),
      ];
    }
    if (result.some((aOption) => aOption === "承認 / 申請中")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.status === "承認 / 申請中"),
      ];
    }
    if (result.some((aOption) => aOption === "承認 / 否認")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.status === "承認 / 否認"),
      ];
    }
    if (result.some((aOption) => aOption === "否認")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.status === "否認"),
      ];
    }
    if (result1.length === 0) {
      setOptionedData(resultData);
      return;
    }

    let resultData1 = [];
    if (result1.some((aOption) => aOption === "募集中")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.collectionStatus === "募集中"),
      ];
    }
    if (result1.some((aOption) => aOption === "募集終了")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.collectionStatus === "募集終了"),
      ];
    }
    if (result1.some((aOption) => aOption === "停止")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.collectionStatus === "停止中"),
      ];
    }
    if (result1.some((aOption) => aOption === "完了")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.collectionStatus === "完了"),
      ];
    }
    setOptionedData(resultData1.sort((a, b) => -(a.id - b.id)));
  };
  const handleOptionChange = (val) => {
    const isAlready = options.some((a) => a === val);
    const result = isAlready
      ? options.filter((aOptioin) => aOptioin !== val)
      : [...options, val];
    setOptions(result);
    makeOptioinedData(visibleData, result, options1);
  };
  const handleOptionChange1 = (val) => {
    const isAlready = options1.some((a) => a === val);
    const result = isAlready
      ? options1.filter((aOptioin) => aOptioin !== val)
      : [...options1, val];
    setOptions1(result);
    makeOptioinedData(visibleData, options, result);
  };
  const handleSearch = (data) => {
    setVisibleData(data);
    makeOptioinedData(data, options, options1);
  };
  const onItemClick = ({ idx }: { idx: Number }) => {
    if (active === idx) {
      setActive(null);
    } else {
      setActive(idx);
    }
  };
  const dateString = (dateValue: string) => {
    if (dateValue?.length > 0) {
      return dateValue.replaceAll('-', '/').replace('T', ' ').substring(0, 16);
    }
    return '';
  }
  const composeSearchData = (data) =>
  (data.map((aData) => {
    const keys = Object.keys(aData);
    let stringifiedAData = {};
    keys.map((aKey) => {
      stringifiedAData[aKey] = aData[aKey] + '';
    })
    return stringifiedAData;
  })
  )

  return (
    <div className="h-full">
      <div
        className={
          showConfirm
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto duration-500 z-10"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <Modal
          body={confirmMsg}
          onOk={() => setShowConfirm(false)}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
      <div
        className={
          showCollectionStartModal
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto duration-500 z-10"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <div className="text-center bg-[white]  px-[35px] sp:px-[12px] sp:text-small w-[25%] sp:w-[90%] m-auto relative shadow-lg ">
          <button
            className="absolute bg-[#5E5E5E] text-[white] px-[15px] py-[10px] top-0 right-0 cursor-pointer"
            onClick={(e) => {
              setShowCollectionStartModal(false);
            }}
          >
            x
          </button>
          <div className="pt-[30px] mt-[350px] sp:mt-[150px]">
            <div>募集を開始しますか？</div>
            <div className="flex justify-center gap-[10px]">
              <Button
                buttonType={ButtonType.PRIMARY}
                handleClick={() => {
                  handleCollectionStateChange('募集中');
                  setShowCollectionStartModal(false);
                }}
                buttonClassName="my-[20px]"
              >
                はい
              </Button>
              <Button
                buttonType={ButtonType.DEFAULT}
                handleClick={() => {
                  setShowCollectionStartModal(false);
                }}
                buttonClassName="my-[20px] rounded-[5px]"
              >
                いいえ
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        className={
          showCollectionEndModal
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto duration-500 z-10"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <div className="text-center bg-[white]  px-[35px] sp:px-[12px] sp:text-small w-[25%] sp:w-[90%] m-auto relative shadow-lg ">
          <button
            className="absolute bg-[#5E5E5E] text-[white] px-[15px] py-[10px] top-0 right-0 cursor-pointer"
            onClick={(e) => {
              setShowCollectionEndModal(false);
            }}
          >
            x
          </button>
          <div className="pt-[30px] mt-[350px] sp:mt-[150px]">
            <div>募集を終了しますか？</div>
            <div className="flex justify-center gap-[10px]">
              <Button
                buttonType={ButtonType.PRIMARY}
                handleClick={() => {
                  handleCollectionStateChange('募集終了');
                  setShowCollectionEndModal(false);
                }}
                buttonClassName="my-[20px]"
              >
                はい
              </Button>
              <Button
                buttonType={ButtonType.DEFAULT}
                handleClick={() => {
                  setShowCollectionEndModal(false);
                }}
                buttonClassName="my-[20px] rounded-[5px]"
              >
                いいえ
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-full px-[30px] sp:px-[12px] pt-[110px] pb-[30px]">
        <div className="text-title sp:hidden">登録案件一覧</div>
        <Link href={"/case"}>
          <Button
            buttonType={ButtonType.PRIMARY}
            buttonClassName="mt-[15px] sp:my-[15px] sp:text-small rounded-[0px]"
          >
            <span className="flex">
              <img src="/img/plus.svg" alt="plus" className="mr-[5px]" />
              新規登録
            </span>
          </Button>
        </Link>
        <SearchBar
          // data={data}
          data={composeSearchData(data.map((aData) => {
            if (aData.collectionStart) aData.collectionStart = dateString(aData.collectionStart);
            if (aData.collectionEnd) aData.collectionEnd = dateString(aData.collectionEnd);
            return aData;
          }))}
          setVisibleData={handleSearch}
          keys={["caseName", "caseType", "collectionStart", "collectionEnd"]}
          extendChild={
            <div>
              <div className="mt-[20px] sp:mt-[10px] text-small text-[#3F8DEB] font-bold">
                条件を絞り込みできます。
              </div>
              <div className="flex sp:flex:column mt-[8px] flex-wrap gap-x-10 gap-y-3">
                <div className="flex flex-wrap">
                  <span className="mr-[11px] sp:text-sp text-[#A8A8A8]">申請状態 ：  </span>
                  <div className="flex flex-wrap">
                    <Checkbox
                      title={"申請前"}
                      handleChange={(v) => handleOptionChange("申請前")}
                      checkBoxClassName="mr-[20px]"
                    />
                    <Checkbox
                      title={"申請中"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange("申請中")}
                    />
                    <Checkbox
                      title={"承認"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange("承認")}
                    />
                    <Checkbox
                      title={"承認 / 申請中"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange("承認 / 申請中")}
                    />
                    <Checkbox
                      title={"承認 / 否認	"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange("承認 / 否認")}
                    />
                    <Checkbox
                      title={"否認"}
                      handleChange={(v) => handleOptionChange("否認")}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap">
                  <span className="mr-[11px] sp:text-sp text-[#A8A8A8]">募集状態 ： </span>
                  <div className="flex flex-wrap">
                    <Checkbox
                      title={"募集中"}
                      handleChange={(v) => handleOptionChange1("募集中")}
                      checkBoxClassName="mr-[20px]"
                    />
                    <Checkbox
                      title={"募集終了"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange1("募集終了")}
                    />
                    <Checkbox
                      title={"停止"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange1("停止")}
                    />
                    <Checkbox
                      title={"完了"}
                      handleChange={(v) => handleOptionChange1("完了")}
                    />
                  </div>
                </div>
              </div>
            </div>
          }
        />
        <div className="text-[14px] text-[#A9A9A9] mb-[10px] sp:text-spsmall">
          {`該当数：${optionedData.length}件`}
        </div>
        {isLoading ? (
          <Image
            className="m-auto"
            src={"/img/loading.gif"}
            alt="loading"
            width={50}
            height={50}
          />
        ) : (
          <div className="sp:hidden grow">
            {currentItems.length !== 0 ? (
              <table className="w-full text-[14px] sp:hidden">
                <thead>
                  <tr>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] ">
                      案件種別
                    </td>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] ">
                      案件名
                    </td>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3]">
                      申請状態
                    </td>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3]">
                      募集状態
                    </td>
                    <td className="text-center w-[100px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3]">
                      募集開始
                    </td>
                    <td className="text-center w-[100px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] ">
                      募集終了
                    </td>
                    <td className="w-[70px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] text-center ">
                      詳細
                    </td>
                    <td className="w-[70px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] text-center  ">
                      編集
                    </td>
                    <td className="w-[120px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] text-center  ">
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems?.map((aData, idx) => (
                    <tr key={idx}>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3]">
                        {`${aData.caseType === '来 店' ? '来店' : aData.caseType}型`}
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3] ">
                        {aData.caseName}
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3]">
                        {aData.status}
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3]">
                        {aData.collectionStatus}
                      </td>
                      <td className="text-center w-[100px] py-[25px]  border border-[#D3D3D3]">
                        {dateString(aData.collectionStart)}
                      </td>
                      <td className="text-center w-[100px] py-[25px]  border border-[#D3D3D3] ">
                        {dateString(aData.collectionEnd)}
                      </td>
                      <td className="py-[25px]  border border-[#D3D3D3]">
                        <Link href={`/caseDetail/${aData.id}`}>
                          <img
                            src="/img/detail.svg"
                            alt="detail"
                            className="m-auto"
                          />
                        </Link>
                      </td>
                      <td className="py-[25px]  border border-[#D3D3D3] ">
                        <Link href={`/case/${aData.id}`}>
                          <img
                            src="/img/edit.svg"
                            alt="edit"
                            className="m-auto"
                          />
                        </Link>
                      </td>
                      <td className="py-[25px] text-center border border-[#D3D3D3] ">
                        {aData?.status === '承認' && aData.collectionStatus === '募集前' && <Button
                          buttonType={ButtonType.PRIMARY}
                          handleClick={() => {
                            setActiveCase(aData);
                            setShowCollectionStartModal(true);

                          }}
                          buttonClassName="text-[12px] p-[5px]">
                          募集開始
                        </Button>}
                        {(aData?.collectionStatus === '停止中' || aData.collectionStatus === '募集中') && <Button
                          buttonType={ButtonType.DANGER}
                          handleClick={() => {
                            setActiveCase(aData);
                            setShowCollectionEndModal(true);

                          }}

                          buttonClassName="text-[12px] p-[5px]">
                          募集終了
                        </Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center pt-[200px] text-title text-[#757575]">
                該当する案件がありません。
              </div>
            )}
          </div>
        )}
        <div className="sp:hidden">
          <ReactPaginate
            containerClassName="pagination-conatiner"
            pageClassName="pagination-page"
            activeClassName="pagination-active"
            disabledClassName="pagination-disable"
            previousClassName="pagination-page"
            nextClassName="pagination-page"
            breakLabel="..."
            nextLabel=">"
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            previousLabel="<"
            renderOnZeroPageCount={null}
          />
        </div>
        <div className="lg:hidden grow">
          {currentItems?.map((aData, idx) => (
            <div
              key={idx}
              className=" bg-[#F8F9FA] border border-[#D3D3D3]"
              onClick={() => onItemClick({ idx })}
            >
              <div className="flex justify-between px-[30px] py-[20px] w-full">
                <div className="flex">
                  <span className="sp:text-sp">
                    <span >
                      {aData.caseName}
                    </span>
                  </span>
                </div>

                <img
                  src={idx === active ? "/img/up.svg" : "/img/down.svg "}
                  className="inline h-[8px]"
                />
              </div>
              {idx === active && (
                <div className="px-[25px] py-[10px]">
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      案件種別
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {`${aData.caseType === '来 店' ? '来店' : aData.caseType}型`}
                    </span>
                  </div>
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      申請状態
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {aData.status}
                    </span>
                  </div>
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      募集状態
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {aData.collectionStatus}
                    </span>
                  </div>
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      募集開始
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {dateString(aData.collectionStart)}
                    </span>
                  </div>
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      募集終了
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {dateString(aData.collectionEnd)}
                    </span>
                  </div>
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#3F8DEB] underline hover:cursor-pointer underline-offset-3 sp:text-spsmall ">
                      <Link
                        href={`/caseDetail/${aData.id}`}
                      // onClick={() => {
                      //   router.push(`/caseDetail/${aData.id}`)
                      // }}
                      >詳細</Link>
                    </div>
                  </div>
                  <div className="flex my-[10px]">
                    <div className="w-[80px] mr-[36px] text-right text-[#3F8DEB] underline hover:cursor-pointer underline-offset-3 sp:text-spsmall ">
                      <Link href={`/case/${aData.id}`}>編集</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="lg:hidden">
          <ReactPaginate
            containerClassName="pagination-conatiner"
            pageClassName="pagination-page"
            activeClassName="pagination-active"
            disabledClassName="pagination-disable"
            previousClassName="pagination-page"
            nextClassName="pagination-page"
            breakLabel="..."
            nextLabel=">"
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            previousLabel="<"
            renderOnZeroPageCount={null}
          />
        </div>
      </div>
    </div>
  );
}
