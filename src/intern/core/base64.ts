// UTF-8 safe base64, as the GitHub contents API expects. Bytes are converted in chunks
// because spreading a large array into String.fromCharCode overflows the call stack.
const CHUNK_SIZE = 0x8000;

export const utf8ToBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let index = 0; index < bytes.length; index += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK_SIZE));
  }
  return btoa(binary);
};

export const base64ToUtf8 = (value: string) => {
  const binary = atob(value.replace(/\s+/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};
