import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col", className)} {...props} />
));
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
  {
    variants: {
      active: {
        true: "bg-card text-foreground shadow-sm",
        false: "text-muted-foreground hover:text-foreground hover:bg-accent",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      role="tab"
      aria-selected={active ?? false}
      className={cn(tabsTriggerVariants({ active }), className)}
      {...props}
    />
  )
);
TabsTrigger.displayName = "TabsTrigger";

export { Tabs, TabsList, TabsTrigger, tabsTriggerVariants };
