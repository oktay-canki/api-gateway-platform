import mongoose, { type Model } from "mongoose";

import { routeRuleSchema, type IRouteRule } from "./route-rule.schema";

export const RouteRule: Model<IRouteRule> =
  mongoose.models.RouteRule ??
  mongoose.model<IRouteRule>("RouteRule", routeRuleSchema);
