import type { Metadata } from "next";

import { OperatorLogin } from "@/components/operator-practice/operator-login";
import { inspectInviteToken } from "@/operator-practice/access.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Вход по приглашению — практика оператора UpHire",
  referrer: "no-referrer",
};

type InvitePageProps = { params: Promise<{ token: string }> };

export default async function OperatorInvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const inviteState = await inspectInviteToken(token);
  return <OperatorLogin inviteToken={token} inviteState={inviteState} />;
}
