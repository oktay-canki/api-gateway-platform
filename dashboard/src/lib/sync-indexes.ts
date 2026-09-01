import { Api } from "@/modules/apis/api.model";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { User } from "@/modules/users/user.model";

export async function syncIndexes() {
  await Promise.all([
    User.syncIndexes(),
    Api.syncIndexes(),
    RouteRule.syncIndexes(),
  ]);
}
