"use client";

import { useEffect, useState } from "react";

export const detectFacebookBrowser = () =>
    typeof navigator !== "undefined" &&
    /FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(navigator.userAgent);

// Returns false on the server / first render, then the real value after mount
// (avoids hydration mismatch).
export default function useIsFacebookBrowser() {
    const [isFb, setIsFb] = useState(false);
    useEffect(() => {
        setIsFb(detectFacebookBrowser());
    }, []);
    return isFb;
}