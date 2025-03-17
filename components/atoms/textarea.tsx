"use client";
import React, { useEffect, useState } from "react";

export interface TextAreaProps {
  textAreaClassName?: string;
  placeholder?: string;
  reset?: boolean;
  resizable?: boolean;
  notRequired?: boolean;
  requireMsg?: string;
  value?: string;
  handleChange?: (val: string) => void;
  handleCtrlEnter?: () => void;
}

const TextArea: React.FC<TextAreaProps> = ({
  textAreaClassName,
  placeholder,
  handleChange,
  reset,
  resizable,
  notRequired,
  requireMsg,
  value,
  handleCtrlEnter,
}: TextAreaProps) => {
  const [error, setError] = useState("errorMsg");
  const [isValid, setIsValid] = useState(true);
  const [textValue, setTextValue] = useState(value);
  const validate = (val: string) => {
    if (!notRequired && val === "") {
      setError(requireMsg);
      handleChange(val);
      setTextValue(val);
      setIsValid(false);
      return;
    }
    handleChange(val);
    setTextValue(val);
    setIsValid(true);
  };
  useEffect(() => {
    document.getElementById("mainArea").innerHTML = "";
  }, [reset]);
  useEffect(() => {
    setTextValue(value);
  }, [value]);
  return (
    <div className={textAreaClassName}>
      <textarea
        id="mainArea"
        onKeyUp={(e) => {
          if (e.ctrlKey && e.key === "Enter") {
            handleCtrlEnter();
          }
        }}
        // defaultValue={value}
        value={textValue}
        onChange={(e) => validate(e.target.value)}
        className={
          resizable
            ? "px-[12px] py-[7px] w-full border resize-none	 border-[#D3D3D3] " +
            textAreaClassName
            : "px-[12px] py-[7px] w-full border resize-none	 border-[#D3D3D3] " +
            textAreaClassName
        }
        placeholder={placeholder}
      ></textarea>
      {(requireMsg && requireMsg !== '') ? (<div
        className={
          isValid
            ? "text-left text-[#EE5736] text-[11px] opacity-0 mt-[-4px] duration-700"
            : "text-left text-[#EE5736] text-[11px] mt-[-4px] duration-700"
        }
      >
        {error}
      </div>) : <div className='text-left text-[#EE5736] text-[11px] opacity-0'>
        test
      </div>}
    </div >
  );
};

export default TextArea;
