"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useGet from "@/app/hooks/useGet"; // adjust path as needed
import { getRestaurantId } from "@/context/Restaurantid"; // adjust path as needed
import { ChevronLeft } from "lucide-react";

type PolicyResponse = {
  success: boolean;
  data: {
    message: string;
    data: {
      id: string;
      title: string;
      description: string;
      type: string;
      restaurantId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

// ---------------------------------------------------------------------------
// Text parsing helpers
//
// The description text coming back from the API is a single string that
// contains literal "\r\n" escape sequences and escaped quotes instead of
// real line breaks. It also has no structural markup, just headings and
// paragraphs separated by blank lines. These helpers turn that raw string
// into real line breaks and then into a lightweight document tree
// (headings + paragraphs) so it can be rendered as proper, readable
// sections instead of one giant unbroken block of text.
// ---------------------------------------------------------------------------

type PolicyNode =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string };

function decodePolicyText(raw: string): string {
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  if (trimmed.split(/\s+/).length > 9) return false;
  // Headings generally don't end like a finished sentence.
  if (/[.!?,;:]$/.test(trimmed)) return false;
  return true;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "section"
  );
}

function parsePolicyBody(
  raw: string,
  title?: string,
): { nodes: PolicyNode[]; toc: { id: string; text: string }[] } {
  const text = decodePolicyText(raw);
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const nodes: PolicyNode[] = [];
  const toc: { id: string; text: string }[] = [];
  const usedIds = new Set<string>();

  let lastWasHeading = false;

  blocks.forEach((block, blockIdx) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Skip a leading block that just repeats the title or the "Last
    // updated" line, since both are already shown in the page header.
    if (
      blockIdx < 2 &&
      lines.every(
        (l) =>
          (title && l.toLowerCase() === title.toLowerCase()) ||
          /^last updated\b/i.test(l),
      )
    ) {
      return;
    }

    let idx = 0;
    while (idx < lines.length && isHeadingLine(lines[idx])) {
      const headingText = lines[idx];
      if (lastWasHeading) {
        nodes.push({ type: "h3", text: headingText });
      } else {
        let id = slugify(headingText);
        while (usedIds.has(id)) id = `${id}-2`;
        usedIds.add(id);
        nodes.push({ type: "h2", id, text: headingText });
        toc.push({ id, text: headingText });
      }
      lastWasHeading = true;
      idx++;
    }

    const remaining = lines.slice(idx).join(" ");
    if (remaining) {
      nodes.push({ type: "p", text: remaining });
      lastWasHeading = false;
    }
  });

  return { nodes, toc };
}

export default function PolicyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const [restaurantId, setRestaurantIdState] = useState<string | null>(null);

  useEffect(() => {
    setRestaurantIdState(getRestaurantId(slug));
  }, [slug]);

  const { data, loading, error, refetch } = useGet<PolicyResponse>(
    restaurantId ? `/api/user/policy/${restaurantId}` : null,
  );

  const policy = data?.data?.data;

  const { nodes, toc } = useMemo(() => {
    if (!policy?.description) return { nodes: [], toc: [] };
    return parsePolicyBody(policy.description, policy.title);
  }, [policy?.description, policy?.title]);

  // Modern Skeleton Loader
  if (loading || !restaurantId) {
    return (
      <main className="min-h-[70vh] bg-slate-50/50 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="animate-pulse space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-20 rounded-full bg-slate-200" />
              <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-100" />
            </div>
            <div className="my-6 border-t border-slate-100" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-11/12 rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Modern Error State
  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50/50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-xl shadow-rose-500/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Unable to load policy
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {error ||
              "An unexpected error occurred while fetching the policy document."}
          </p>
          <button
            onClick={refetch}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-[0.98]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Try again
          </button>
        </div>
      </main>
    );
  }

  // Modern Empty State
  if (!policy) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50/50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            No Policy Available
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This store has not published any policies yet.
          </p>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(policy.updatedAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <main className="min-h-screen scroll-smooth bg-slate-50/50 py-10 px-4 sm:px-6 lg:py-16">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 -mr-2 rounded-full shadow-md active:scale-95 text-white"
      >
        <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
      </button>

      <div className="mx-auto max-w-3xl">
        {/* Main Card Container */}
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
          {/* Header Section */}
          <header className="border-b border-slate-100 pb-6 sm:pb-8">
            <span className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {slug} Policy
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {policy.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Last updated {formattedDate}
              </span>
            </div>
          </header>

          {/* Table of contents */}
          {toc.length > 1 && (
            <nav
              aria-label="Sections"
              className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:mt-8 sm:p-5"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                On this page
              </p>
              <ol className="grid gap-1.5 sm:grid-cols-2">
                {toc.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex gap-2 rounded-md px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                    >
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>{item.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Content Body Section */}
          <div className="prose prose-slate max-w-none pt-6 sm:pt-8">
            {nodes.length > 0 ? (
              nodes.map((node, i) => {
                if (node.type === "h2") {
                  return (
                    <h2
                      key={i}
                      id={node.id}
                      className="scroll-mt-6 border-t border-slate-100 pt-6 text-lg font-semibold text-slate-900 first:border-0 first:pt-0 sm:text-xl"
                    >
                      {node.text}
                    </h2>
                  );
                }
                if (node.type === "h3") {
                  return (
                    <h3
                      key={i}
                      className="mt-5 text-sm font-semibold text-slate-800 sm:text-base"
                    >
                      {node.text}
                    </h3>
                  );
                }
                return (
                  <p
                    key={i}
                    className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base sm:leading-8"
                  >
                    {node.text}
                  </p>
                );
              })
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base sm:leading-8">
                {decodePolicyText(policy.description)}
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
