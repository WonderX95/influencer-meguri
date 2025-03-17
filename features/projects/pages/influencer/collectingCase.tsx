"use client";

import Button from "@/components/atoms/button";
import { ButtonType } from "@/components/atoms/buttonType";
import Checkbox from "@/components/atoms/checkbox";
import SearchBar from "@/components/organisms/searchbar";
import ApplicationPage from "../admin/applicationPage";
import { useRecoilValue } from "recoil";
import { useState, useEffect } from "react";
import Modal from "../../utils/modal";
import { authUserState } from "@/recoil/atom/auth/authUserAtom";
import axios from "axios";
import Image from "next/image";
import ReactPaginate from "react-paginate";
import { useRouter } from "next/navigation";


export default function CollectedCase() {
  const user = useRecoilValue(authUserState);

  const [active, setActive] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showApplyConfirmModal, setShowApplyConfirmModal] = useState(false);
  const [data, setData] = useState([]);
  const [appliedCase, setAppliedCase] = useState([]);
  const [caseId, setCaseId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reload, setReload] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [visibleData, setVisibleData] = useState([]);
  const [optionedData, setOptionedData] = useState([]);
  const [options, setOptions] = useState([]);
  const [options1, setOptions1] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [applyingCase, setApplyingCase] = useState(null);
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
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchApplied = async () => {
      try {
        const result = await axios.get(`/api/apply?id=${user.user?.targetId}`);
        if (result.data) setAppliedCase(result.data);
      } catch (e) {
        router.push('/logout')
      }

    };
    if (user) {
      fetchApplied();
    }
  }, [reload]);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await axios.get("/api/case/influencer");
      if (result.data.length !== 0) {
        setCaseId(result.data[0]?.id);
        if (result.data?.length) {
          let data = result.data.filter((aItem) => !alreadyAppliedOrNot(aItem.id));
          setData(data);
          setOptionedData(data);
          setVisibleData(data);
        }
      }
      setIsLoading(false);
      document.title = '募集中案件一覧';
    };
    if (user) {
      fetchData();
    }
  }, [reload, appliedCase])
  const makeOptioinedData = (visibleData, result, result1) => {
    let resultData = [];
    if (result.length === 0) {
      resultData = visibleData;
    }
    if (result.some((aOption) => aOption === "来店")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.caseType === "来 店"),
      ];
    }
    if (result.some((aOption) => aOption === "通販")) {
      resultData = [
        ...resultData,
        ...visibleData.filter((aData) => aData.caseType === "通販"),
      ];
    }
    if (result1.length === 0) {
      setOptionedData(resultData);
      return;
    }
    let resultData1 = [];
    if (result.some((aOption) => aOption === "申請中")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.status === "申請中"),
      ];
    }
    if (result.some((aOption) => aOption === "承認")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.status === "承認"),
      ];
    }
    if (result.some((aOption) => aOption === "否認")) {
      resultData1 = [
        ...resultData1,
        ...resultData.filter((aData) => aData.status === "否認"),
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
  const handleSearch = (data) => {
    setVisibleData(data);
    makeOptioinedData(data, options, options1);
  };
  const alreadyAppliedOrNot = (caseId: number) => {
    let already = false;
    if (appliedCase.length) {
      already = appliedCase.some((a) => a.caseId === caseId);
    }
    return already;
  };
  const onItemClick = ({ idx }: { idx: Number }) => {
    if (active === idx) {
      setActive(null);
    } else {
      setActive(idx);
    }
  };
  const handleApply = async (caseId: string) => {
    const result = await axios.post("/api/apply", {
      caseId,
      influencerId: user.user?.targetId,
    });
    if (result.data.type === "success") {
      setReload(!reload);
      setConfirmMsg("操作が成功しました。");
      setShowConfirm(true);
    }
    else {
      setConfirmMsg(result.data.msg);
      setShowConfirm(true);
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
          showModal
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto duration-500 z-10"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        {caseId && (
          <div>
            <ApplicationPage
              influencerMode
              modalMode
              caseID={caseId}
              onCancel={() => setShowModal(false)}
            />
          </div>
        )}
      </div>
      {/* <div
        className={
          showApplyConfirmModal
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto duration-500 z-10"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <Modal body={`
        ${applyingCase ? `${applyingCase?.caseName}に応募しますか？` : ''}
        `}
          onOk={async () => {
            setShowApplyConfirmModal(false);
            await handleApply(applyingCase.id);
            setApplyingCase(null);
          }}
          onCancel={() => { setShowApplyConfirmModal(false) }}
        />
      </div> */}
      <div
        className={
          showApplyConfirmModal
            ? "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto duration-500 z-10"
            : "bg-black bg-opacity-25 w-full h-full fixed left-0 overflow-auto opacity-0 pointer-events-none duration-500"
        }
      >
        <div className="text-center bg-[white]  px-[35px] sp:px-[12px] sp:text-small w-[25%] sp:w-[90%] m-auto relative shadow-lg ">
          <button
            className="absolute bg-[#5E5E5E] text-[white] px-[15px] py-[10px] top-0 right-0 cursor-pointer"
            onClick={(e) => {
              setShowApplyConfirmModal(false);
            }}
          >
            x
          </button>
          <div className="pt-[30px] mt-[350px] sp:mt-[150px]">
            <div>{`
        ${applyingCase ? `${applyingCase?.caseName}に応募しますか？` : ''}
        `}</div>
            <div className="flex justify-center gap-[10px]">
              <Button
                buttonType={ButtonType.PRIMARY}
                handleClick={async () => {
                  setShowApplyConfirmModal(false);
                  await handleApply(applyingCase.id);
                  setApplyingCase(null);
                }}
                buttonClassName="my-[20px]"
              >
                応募
              </Button>
              <Button
                buttonType={ButtonType.DEFAULT}
                handleClick={() => {
                  setShowApplyConfirmModal(false);
                }}
                buttonClassName="my-[20px] rounded-[5px]"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-full px-[30px] sp:px-[12px] pt-[110px] pb-[30px]">
        <div className="text-title sp:hidden">募集中案件一覧</div>
        <SearchBar
          data={composeSearchData(data.map((aData) => {
            if (aData.collectionStart) aData.collectionStart = dateString(aData.collectionStart);
            if (aData.collectionEnd) aData.collectionEnd = dateString(aData.collectionEnd);
            return aData;
          }))}
          // data={composeSearchData}
          setVisibleData={handleSearch}
          keys={[
            "companyName",
            "caseName",
            "casePlace",
            "collectionStart",
            "collectionEnd",
          ]}
          extendChild={
            <div>
              <div className="mt-[30px] sp:mt-[10px] text-small text-[#3F8DEB] font-bold">
                条件を絞り込みできます。
              </div>
              <div className="flex sp:block mt-[8px] flex-wrap gap-x-10">
                <div className="flex flex-wrap">
                  <span className="mr-[11px] sp:text-sp text-[#A8A8A8]">案件種別 ： </span>
                  <div className="flex flex-wrap">
                    <Checkbox
                      title={"来店型"}
                      handleChange={(v) => handleOptionChange("来店")}
                      checkBoxClassName="mr-[20px]"
                    />
                    <Checkbox
                      title={"通販型"}
                      checkBoxClassName="mr-[20px]"
                      handleChange={(v) => handleOptionChange("通販")}
                    />
                  </div>

                </div>
                {/* <div className="flex">
                  <Checkbox
                    prefix="状態 ： "
                    title={"申請中"}
                    handleChange={(v) => handleOptionChange1("申請中")}
                    checkBoxClassName="mr-[20px]"
                  />
                  <Checkbox
                    title={"承認"}
                    checkBoxClassName="mr-[20px]"
                    handleChange={(v) => handleOptionChange1("承認")}
                  />
                  <Checkbox
                    title={"否認"}
                    handleChange={(v) => handleOptionChange1("否認")}
                  />
                </div> */}
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
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] w-[30%]">
                      会社名
                    </td>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] ">
                      案件名
                    </td>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3]">
                      案件種別
                    </td>
                    <td className="px-[35px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3]">
                      来店場所
                    </td>
                    <td className="text-center w-[100px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3]">
                      募集開始
                    </td>
                    <td className="text-center w-[100px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] ">
                      募集終了
                    </td>
                    <td className="w-[150px] py-[25px] bg-[#F8F9FA] border border-[#D3D3D3] "></td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems?.map((aData, idx) => (
                    <tr key={idx}>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3] hover:cursor-pointer">
                        {aData.companyName}
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3] ">
                        <span
                          className="text-[#3F8DEB] underline hover:cursor-pointer underline-offset-3 sp:text-sp"
                          onClick={() => {
                            setCaseId(aData.id);
                            setShowModal(true);
                          }}
                        >
                          {aData.caseName}
                        </span>
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3] hover:cursor-pointer">
                        {`${aData.caseType === '来 店' ? '来店' : aData.caseType}型`}
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3]">
                        {aData.casePlace}
                      </td>
                      <td className="text-center w-[100px] py-[25px]  border border-[#D3D3D3]">
                        {dateString(aData.collectionStart)}
                      </td>
                      <td className="text-center w-[100px] py-[25px]  border border-[#D3D3D3] ">
                        {dateString(aData.collectionEnd)}
                      </td>
                      <td className="px-[35px] py-[25px]  border border-[#D3D3D3] text-center">
                        {!alreadyAppliedOrNot(aData.id) ? (
                          <Button
                            buttonType={ButtonType.PRIMARY}
                            handleClick={() => {
                              setApplyingCase(aData);
                              setShowApplyConfirmModal(true);
                            }}
                          >
                            応募
                          </Button>
                        ) : (
                          <div className="text-white bg-[#236997] p-[10px] rounded-lg shadow-sm">
                            申請済み
                          </div>
                        )}
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
            <div key={idx} className=" bg-[#F8F9FA] border border-[#D3D3D3]">
              <div className="flex justify-between px-[30px] py-[20px] w-full"
                onClick={() => onItemClick({ idx })}
              >
                <div className="flex">
                  <span
                    className="sp:text-sp"
                  >
                    {aData.caseName}
                  </span>
                </div>

                <img
                  src={idx === active ? "/img/up.svg" : "/img/down.svg "}
                  className="inline h-[8px]"
                />
              </div>
              {idx === active && (
                <div className="p-[25px]">
                  <div className="flex">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      会社名
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {aData.companyName}
                    </span>
                  </div>
                  <div className="flex">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      案件種別
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {`${aData.caseType === '来 店' ? '来店' : aData.caseType}型`}
                    </span>
                  </div>
                  <div className={`flex ${aData?.caseType === '通販' ? 'hidden' : ''}`}>
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      来店場所
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {aData.casePlace}
                    </span>
                  </div>
                  <div className="flex">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      募集開始
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {dateString(aData.collectionStart)}
                    </span>
                  </div>
                  <div className="flex">
                    <div className="w-[80px] mr-[36px] text-right text-[#A9A9A9] sp:text-spsmall">
                      募集終了
                    </div>
                    <span className="mb-[7px] sp:text-spsmall">
                      {dateString(aData.collectionEnd)}
                    </span>
                  </div>
                  <div className="flex pt-[10px] justify-center">
                    <span className="mb-[7px] sp:text-spsmall">
                      <Button
                        buttonClassName="py-[7px] bg-green-500 hover:bg-green-700"
                        buttonType={ButtonType.PRIMARY}
                        handleClick={() => {
                          setCaseId(aData.id);
                          setShowModal(true);
                        }}
                      >
                        詳細
                      </Button>
                    </span>
                    <span className="mb-[7px] ml-[20px] sp:text-spsmall">
                      {!alreadyAppliedOrNot(aData.id) ? (
                        <Button
                          buttonClassName="py-[7px] bg-[#30c938]"
                          buttonType={ButtonType.PRIMARY}
                          handleClick={() => {
                            setShowApplyConfirmModal(true);
                            setApplyingCase(aData);
                          }
                          }
                        >
                          応募
                        </Button>
                      ) : (
                        <div className="text-white bg-[#236997] p-[10px] rounded-lg shadow-sm">
                          申請済み
                        </div>
                      )}
                    </span>
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
