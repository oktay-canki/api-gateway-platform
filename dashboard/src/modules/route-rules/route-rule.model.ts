import { model, models } from "mongoose";

import { routeRuleSchema } from "./route-rule.schema";
import type { IRouteRuleDocument } from "./route-rule.document";

export const RouteRule =
  models.RouteRule || model<IRouteRuleDocument>("RouteRule", routeRuleSchema);
