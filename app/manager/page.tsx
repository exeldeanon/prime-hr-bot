import { ManagerLogin } from "@/components/manager/manager-login";
import { OperatorAccessPanel } from "@/components/manager/operator-access-panel";
import { CandidateCrm } from "@/components/manager/candidate-crm";
import { getManagerSession } from "@/operator-practice/session.server";

export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const session = await getManagerSession();
  return session ? <><CandidateCrm /><OperatorAccessPanel /></> : <ManagerLogin />;
}
