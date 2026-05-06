import * as cookie from "cookie";
import { verifyLocalSessionToken } from "./session";
import { findUserById } from "../queries/users";

export async function authenticateLocalRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies["local_sid"];
  if (!token) {
    throw new Error("No local session cookie");
  }
  const claim = await verifyLocalSessionToken(token);
  if (!claim) {
    throw new Error("Invalid local session token");
  }
  const user = await findUserById(claim.userId);
  if (!user) {
    throw new Error("Local user not found");
  }
  return user;
}
