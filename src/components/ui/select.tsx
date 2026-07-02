"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-sm border border-border bg-[hsl(var(--card))] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        aria-label={props['aria-label'] || 'Select option'}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

const SelectGroup = React.forwardRef<
  React.ElementRef<"optgroup">,
  React.ComponentPropsWithoutRef<"optgroup">
>(({ ...props }, ref) => <optgroup ref={ref} {...props} />);
SelectGroup.displayName = "SelectGroup";

const SelectValue: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = (
  props,
) => {
  return <option {...props} />;
};
SelectValue.displayName = "SelectValue";

// Native Select with custom trigger wrapper
interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  triggerClassName?: string;
  placeholder?: string;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      triggerClassName,
      children,
      value,
      onChange,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectId = React.useId();

    const childrenArray = React.Children.toArray(children);
    let selectedOption: React.ReactNode = null;
    for (const child of childrenArray) {
      if (React.isValidElement(child) && child.props) {
        const props = child.props as {
          value?: string | number;
          children?: React.ReactNode;
        };
        if (props.value === value) {
          selectedOption = props.children;
          break;
        }
      }
    }

    return (
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "sr-only absolute opacity-0 pointer-events-none",
            className,
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          {...props}
        >
          {children}
        </select>
        <button
          type="button"
          id={`${selectId}-trigger`}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-sm border border-border bg-[hsl(var(--card))] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40 transition-colors duration-150",
            triggerClassName,
          )}
          data-state={isOpen ? "open" : "closed"}
          onClick={() => {
            const select = document.getElementById(
              selectId,
            ) as HTMLSelectElement | null;
            select?.focus();
            select?.click();
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        >
          <span className="truncate">
            {selectedOption || placeholder || "Select..."}
          </span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4 opacity-50 shrink-0" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
          )}
        </button>
      </div>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

// Dropdown Select - Uses Radix UI Select for better UX
interface DropdownSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
  id?: string;
}

const DropdownSelect = React.forwardRef<HTMLButtonElement, DropdownSelectProps>(
  (
    {
      value,
      onValueChange,
      children,
      className,
      placeholder = "Select...",
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectId = React.useId();

    // Close on click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Find selected item data
    // We calculate this directly; the React Compiler will handle optimization automatically.
    const childrenArray = React.Children.toArray(children);
    let selectedItem: { label: React.ReactNode; icon: React.ReactNode } | null =
      null;

    for (const child of childrenArray) {
      if (React.isValidElement(child) && child.props) {
        const props = child.props as {
          value?: string | number;
          children?: React.ReactNode;
          icon?: React.ReactNode;
        };

        if (props.value === value) {
          selectedItem = {
            label: props.children,
            icon: props.icon,
          };
          break;
        }
      }
    }

    return (
      <div className="relative" ref={containerRef}>
        <button
          ref={ref}
          type="button"
          id={`${selectId}-trigger`}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-sm border border-border bg-[hsl(var(--card))] px-3 py-2 text-sm transition-colors duration-150 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40",
            className,
          )}
          data-state={isOpen ? "open" : "closed"}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate flex items-center gap-2">
            {selectedItem?.icon && (
              <span className="shrink-0 opacity-80">{selectedItem.icon}</span>
            )}
            {selectedItem?.label || placeholder}
          </span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4 opacity-50 shrink-0" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full min-w-32 overflow-hidden rounded-sm border border-border bg-popover text-popover-foreground shadow-lg shadow-black/5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <div
              className="p-1 space-y-0.5 max-h-64 overflow-y-auto"
              role="listbox"
              aria-labelledby={`${selectId}-trigger`}
            >
              {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return null;

                const childProps = child.props as {
                  value?: string;
                  children?: React.ReactNode;
                  disabled?: boolean;
                  icon?: React.ReactNode;
                };

                return (
                  <div
                    key={childProps.value}
                    role="option"
                    aria-selected={value === childProps.value ? "true" : "false"}
                    data-state={
                      value === childProps.value ? "checked" : "unchecked"
                    }
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm outline-none transition-all duration-200",
                      "hover:bg-muted/60 hover:text-foreground focus:bg-accent focus:text-accent-foreground",
                      childProps.disabled && "pointer-events-none opacity-50",
                      value === childProps.value &&
                        "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                    )}
                    onClick={() => {
                      if (!childProps.disabled) {
                        onValueChange(childProps.value!);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {childProps.icon && (
                      <span className="mr-2 flex h-4 w-4 items-center justify-center">
                        {childProps.icon}
                      </span>
                    )}
                    <span className={cn("flex-1", childProps.icon && "pl-1")}>
                      {childProps.children}
                    </span>
                    <span className="ml-auto">
                      {value === childProps.value && (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  },
);
DropdownSelect.displayName = "DropdownSelect";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    icon?: React.ReactNode;
  }
>(({ className, children, icon, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        icon ? "pl-2" : "pl-8",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="mr-2 flex h-4 w-4 items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </span>
      ) : (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <CheckIcon className="h-4 w-4" />
        </span>
      )}
      <span className={icon ? "flex-1" : ""}>{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  );
});
SelectLabel.displayName = "SelectLabel";

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  );
});
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  NativeSelect,
  DropdownSelect,
  DropdownSelect as SelectRoot,
  DropdownSelect as SelectTrigger,
  SelectValue as SelectContent,
};
