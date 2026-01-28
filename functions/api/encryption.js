export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  const action = body.action;

  const TOKEN_RE = /\p{L}+|[^\p{L}]+/gu;
  const WORD_RE  = /\p{L}+/gu;

  function isAZLetter(ch) {
    const c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
  }

  function shiftLetter(ch, shift) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCharCode(65 + (c - 65 + shift + 26) % 26);
    if (c >= 97 && c <= 122) return String.fromCharCode(97 + (c - 97 + shift + 26) % 26);
    return ch;
  }

  function countWords(text) {
    const m = text.match(WORD_RE);
    return m ? m.length : 0;
  }

  function encryptSentence(text) {
    const pivot = countWords(text);
    const tokens = text.match(TOKEN_RE) || [];

    return tokens.map(tok => {
      if (tok.match(/^\p{L}+$/u)) {
        const L = tok.length;
        let out = "";
        let i = 1;
        for (const ch of tok) {
          out += isAZLetter(ch) ? shiftLetter(ch, pivot + L + i) : ch;
          i++;
        }
        return out;
      }
      return tok;
    }).join("");
  }

  const CHALLENGE_PLAINTEXT =
    "Bravo U are one of few people who could solve this encryption";
  const CHALLENGE_CIPHER = encryptSentence(CHALLENGE_PLAINTEXT);

  const REVEAL_SCRIPT = `export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  const action = body.action;

  const TOKEN_RE = /\p{L}+|[^\p{L}]+/gu;
  const WORD_RE  = /\p{L}+/gu;

  function isAZLetter(ch) {
    const c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
  }

  function shiftLetter(ch, shift) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCharCode(65 + (c - 65 + shift + 26) % 26);
    if (c >= 97 && c <= 122) return String.fromCharCode(97 + (c - 97 + shift + 26) % 26);
    return ch;
  }

  function countWords(text) {
    const m = text.match(WORD_RE);
    return m ? m.length : 0;
  }

  function encryptSentence(text) {
    const pivot = countWords(text);
    const tokens = text.match(TOKEN_RE) || [];

    return tokens.map(tok => {
      if (tok.match(/^\p{L}+$/u)) {
        const L = tok.length;
        let out = "";
        let i = 1;
        for (const ch of tok) {
          out += isAZLetter(ch) ? shiftLetter(ch, pivot + L + i) : ch;
          i++;
        }
        return out;
      }
      return tok;
    }).join("");
  }
`;

  if (action === "encrypt") {
    const text = String(body.text ?? "");
    return json({ result: encryptSentence(text) });
  }

  if (action === "challenge") {
    return json({ cipher: CHALLENGE_CIPHER });
  }

  if (action === "verify") {
    const guess = String(body.guess ?? "").trim();
    const ok = guess === CHALLENGE_PLAINTEXT;
    return json({ ok, script: ok ? REVEAL_SCRIPT : undefined });
  }

  return json({ error: "Unknown action" }, 400);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}


