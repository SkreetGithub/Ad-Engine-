import { cn } from "@/lib/utils"

interface AddyAvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
  pulse?: boolean
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
}

export function AddyAvatar({ size = "md", className, pulse }: AddyAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 font-bold text-primary-foreground shadow-md",
        sizes[size],
        className
      )}
    >
      {pulse && (
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
      )}
      <span className="relative">A</span>
    </div>
  )
}
