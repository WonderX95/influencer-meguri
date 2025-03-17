"use client";
import React, { useEffect, useState, ForwardedRef } from "react";


export interface InputProps {
  inputClassName?: string;
  placeholder?: string;
  password?: boolean;
  notRequired?: boolean;
  requireMsg?: string;
  style?: string;
  styleMsg?: string;
  value?: string;
  format?: string;
  dateTime?: boolean;
  searchBar?: boolean;
  formatMsg?: string;
  type?: string;
  Ref?: ForwardedRef<null>;
  handleChange: (val: string) => void;
  handleKeyPress?: (event: any) => void;
  max?: string
  min?: string
}

const Input: React.FC<InputProps> = ({
  inputClassName,
  value,
  password,
  placeholder,
  handleChange,
  notRequired,
  requireMsg,
  format,
  formatMsg,
  dateTime,
  type,
  searchBar,
  Ref,
  handleKeyPress,
  max,
  min
}: InputProps) => {
  const [error, setError] = useState("errorMsg");
  const [isValid, setIsValid] = useState(true);
  useEffect(() => {
    if (value !== '') {
      validate(value);
    }
  }, [value])
  const validate = (val: string) => {
    if (!notRequired && val === "") {
      setError(requireMsg);
      setIsValid(false);
      handleChange(val);
      return;
    }
    handleChange(val);
    if (format && val?.length > 0) {
      if (format === 'n') {
        if (isNaN(parseInt(val))) {
          setError(formatMsg);
          setIsValid(false);
          return;
        }
      } else {
        const regex = new RegExp(format);
        if (!regex.test(val.trim())) {
          setError(formatMsg);
          setIsValid(false);
          return;
        }
      }
    }
    setIsValid(true);
  };
  return (
    <div className={inputClassName}>
      <input
        ref={Ref}
        key={"input"}
        type={
          password
            ? "password"
            : dateTime
              ? "datetime-local"
              : type
                ? type
                : "text"
        }
        max={max ?? ''}
        min={min ?? ''}
        value={value}
        className={"border border-[#AEAEAE] h-[35px] pl-[12px]  w-full"}
        placeholder={placeholder}
        onInput={(e) => {
          const target = e.target as HTMLInputElement;
          validate(target.value);
        }}
        onKeyPress={handleKeyPress}
      ></input>
      {
        (requireMsg || formatMsg) ? (
          <div
            className={
              isValid
                ? "text-left text-[#EE5736] text-[11px] opacity-0 duration-700"
                : "text-left text-[#EE5736] text-[11px] duration-700 "
            }
          >
            {error}
          </div>
        ) : !(searchBar || dateTime) && <div className='text-left text-[#EE5736] text-[11px] opacity-0 duration-700'
        >
          test
        </div>
      }
    </div >
  );
};

export default Input;
