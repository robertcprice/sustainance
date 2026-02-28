"use client";

import { useRouter, usePathname } from "next/navigation";

export type ViewMode = "admin" | "employee";

interface ViewToggleProps {
  isDemo?: boolean;
}

export default function ViewToggle({ isDemo }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isDemo) return null;

  const current: ViewMode = pathname?.startsWith("/dashboard/employee")
    ? "employee"
    : "admin";

  const toggle = () => {
    if (current === "admin") {
      router.push("/dashboard/employee/profile");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 shadow-sm border ${
        current === "admin"
          ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
          : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
      }`}
      aria-label={`Switch to ${current === "admin" ? "Employee" : "Admin"} view`}
      title={current === "admin" ? "Switch to Employee view" : "Switch to Admin view"}
    >
      {current === "admin" ? "A" : "E"}
    </button>
  );
}
