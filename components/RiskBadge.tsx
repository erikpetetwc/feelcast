import { Badge } from "@/components/ui/badge";
import { type RiskLevel } from "@/lib/body-score";
import { cn } from "@/lib/utils";

const styles: Record<RiskLevel, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MODERATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  "VERY HIGH": "bg-red-100 text-red-800 border-red-200",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <Badge variant="outline" className={cn("font-semibold text-xs", styles[risk])}>
      {risk}
    </Badge>
  );
}
