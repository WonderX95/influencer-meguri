"use client";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import React from "react";

export default function GoogleCaptchaWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const recaptchaKey: string | undefined =
        process?.env?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    console.log('recaptchaKey key received', recaptchaKey);

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={recaptchaKey ?? "NOT DEFINED"}
            scriptProps={{
                async: false,
                defer: false,
                appendTo: "head",
                nonce: undefined,
            }}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
}