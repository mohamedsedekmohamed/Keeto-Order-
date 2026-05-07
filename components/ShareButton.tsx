import { Share2, Check, Copy } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  /** What to share — defaults to current page */
  url?: string;
  title?: string;
  text?: string;
}

export default function ShareButton({
  url = window.location.href,
  title = document.title,
  text,
}: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  const handleShare = async () => {
    // 1️⃣ Native share sheet (mobile + modern desktop)
    if (navigator.share) {
      try {
        await navigator.share({ url, title, text });
        setStatus("shared");
      } catch (err) {
        // User cancelled — do nothing
        if ((err as DOMException).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // 2️⃣ Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
      } catch {
        // 3️⃣ Last resort for old browsers
        const el = document.createElement("input");
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setStatus("copied");
      }
    }

    // Reset icon after 2s
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <button
      onClick={handleShare}
      aria-label={status === "copied" ? "Link copied!" : "Share"}
      title={status === "copied" ? "Link copied!" : "Share"}
      className="text-gray-800 transition dark:text-zinc-400 hover:text-black dark:hover:text-white"
    >
      {status === "copied" ? (
        <Check className="w-5 h-5 md:h-6 md:w-6 text-green-500" />
      ) : (
        <Share2 className="w-5 h-5 md:h-6 md:w-6" />
      )}
    </button>
  );
}
