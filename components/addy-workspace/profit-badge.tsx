import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ProfitBadge({
  ratio,
  target,
}: {
  ratio: number
  target: number
}) {
  const variant =
    ratio >= target ? "default" : ratio >= target * 0.85 ? "secondary" : "destructive"
  const emoji = ratio >= target ? "🟢" : ratio >= target * 0.85 ? "🟡" : "🔴"
  return (
    <Badge
      variant={variant}
      className={cn(
        "font-mono text-[10px]",
        ratio >= target && "bg-primary/20 text-primary hover:bg-primary/20"
      )}
    >
      {emoji} {ratio.toFixed(2)}:1
    </Badge>
  )
}
