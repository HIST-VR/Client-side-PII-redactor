/**
 * Hugging Face Hub + Xet/CDN hosts for the NER weights.
 *
 * CSP host wildcards are one label only: `*.hf.co` matches `cdn-lfs.hf.co`
 * and does not match `us.aws.cdn.hf.co` or `cas-server.xethub.hf.co`.
 * Nested names are listed from Hugging Face's "Downloading behind a proxy
 * or firewall" table, plus `cas-bridge` which transformers.js still hits.
 */
export const CONNECT_SRC = [
  "'self'",
  "https://huggingface.co",
  "https://*.huggingface.co",
  "https://hf.co",
  "https://*.hf.co",
  "https://*.aws.cdn.hf.co",
  "https://*.gcp.cdn.hf.co",
  "https://*.xethub.hf.co",
  "https://*.xethub-eu.hf.co",
  "https://us.aws.cdn.hf.co",
  "https://us.gcp.cdn.hf.co",
  "https://cas-bridge.xethub.hf.co",
  "https://cas-server.xethub.hf.co",
  "https://cas-server.xethub-eu.hf.co",
  "https://transfer.xethub.hf.co",
  "https://transfer.xethub-eu.hf.co",
  "https://cdn-lfs.hf.co",
  "https://cdn-lfs-us-1.hf.co",
  "https://cdn-lfs-eu-1.hf.co",
].join(" ");

export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${CONNECT_SRC}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
