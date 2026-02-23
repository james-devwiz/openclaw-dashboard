// Unipile SDK client — singleton, lazy init

import { UnipileClient } from "unipile-node-sdk"

const DSN = process.env.UNIPILE_DSN || ""
const TOKEN = process.env.UNIPILE_API_KEY || ""
const ACCOUNT_ID = process.env.UNIPILE_ACCOUNT_ID || ""

let _client: UnipileClient | null = null

export function getUnipile(): UnipileClient {
  if (!DSN || !TOKEN) throw new Error("Unipile not configured: missing UNIPILE_DSN or UNIPILE_API_KEY")
  if (!_client) _client = new UnipileClient(`https://${DSN}`, TOKEN)
  return _client
}

export function getAccountId(): string {
  if (!ACCOUNT_ID) throw new Error("Unipile not configured: missing UNIPILE_ACCOUNT_ID")
  return ACCOUNT_ID
}

export function isUnipileConfigured(): boolean {
  return Boolean(DSN && TOKEN && ACCOUNT_ID)
}
