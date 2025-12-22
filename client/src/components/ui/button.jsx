import * as React from "react"
import { cn } from "../../lib/utils"

const buttonVariants = {
    default: "bg-slate-100 text-slate-900 hover:bg-slate-100/90",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-800/80",
    ghost: "hover:bg-slate-800 text-slate-100",
    link: "text-slate-100 underline-offset-4 hover:underline",
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = buttonVariants[variant] || buttonVariants.default

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                variantStyles,
                size === "default" && "h-10 px-4 py-2",
                size === "sm" && "h-9 rounded-md px-3",
                size === "lg" && "h-11 rounded-md px-8",
                size === "icon" && "h-10 w-10",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
