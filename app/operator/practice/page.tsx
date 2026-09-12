import { redirect } from "next/navigation";

import { PracticeApp } from "@/operator-practice";
import {
  OperatorAccessError,
  resolveOperatorSession,
} from "@/operator-practice/access.server";
import { getOperatorSessionAccessId } from "@/operator-practice/session.server";

export const dynamic = "force-dynamic";

export default async function OperatorPracticePage() {
  const accessId = await getOperatorSessionAccessId();
  if (!accessId) redirect("/operator");

  let session;
  try {
    session = await resolveOperatorSession(accessId);
  } catch (error) {
    if (error instanceof OperatorAccessError) {
      if (error.code === "access_disabled") redirect("/operator?state=disabled");
      if (error.code === "access_expired") redirect("/operator?state=expired");
      redirect("/operator");
    }
    throw error;
  }

  return <PracticeApp login={session.login} />;
}
