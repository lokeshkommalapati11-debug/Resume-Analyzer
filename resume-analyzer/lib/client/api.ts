export class ApiError extends Error {}

const GENERIC = "Something went wrong. Please try again.";
const NETWORK = "Network error. Please check your connection and try again.";

async function errorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    return j.error?.message ?? GENERIC;
  } catch {
    return GENERIC;
  }
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(NETWORK);
  }
  if (!res.ok) throw new ApiError(await errorMessage(res));
  return (await res.json()) as T;
}

/** Uses XMLHttpRequest so we can report real upload progress. */
export function uploadResumeFile(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ text: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/resume/parse");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(NETWORK));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new ApiError(data?.error?.message ?? GENERIC));
      } catch {
        reject(new ApiError(GENERIC));
      }
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export async function downloadResumePdf(resume: unknown): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/resume/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume }),
    });
  } catch {
    throw new ApiError(NETWORK);
  }
  if (!res.ok) throw new ApiError(await errorMessage(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "resume.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
