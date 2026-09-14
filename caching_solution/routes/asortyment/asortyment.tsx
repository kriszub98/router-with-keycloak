import { Link } from "react-router";
import { AssortmentMenu } from "~/features/asortyment-menu";
import { assortmentListQueryOptions } from "~/features/asortyment.queries";
import { queryClient } from "~/query-client";

export async function clientLoader() {
  await queryClient.query(assortmentListQueryOptions);

  return null;
}

// export function HydrateFallback() {
//   return <p>Ładowanie asortymentów…</p>;
// }

export default function AssortmentsRoute() {
  return (
    <div>
      <AssortmentMenu />
      <Link to="/prediction">Test</Link>
    </div>
  );
}
