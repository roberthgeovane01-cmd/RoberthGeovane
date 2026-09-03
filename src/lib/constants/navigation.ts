import {
  AudioLines,
  BookOpenText,
  Brain,
  History,
  LayoutDashboard,
  Library,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

export const workspaceNavigation = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Visão geral" },
  { href: "/library", icon: Library, label: "Biblioteca" },
  { href: "/memory", icon: Brain, label: "Memória" },
  { href: "/reflection/new", icon: AudioLines, label: "Nova reflexão" },
  { href: "/review", icon: SlidersHorizontal, label: "Mesa editorial" },
  { href: "/history", icon: History, label: "Histórico" },
  { href: "/writing-identity", icon: BookOpenText, label: "Identidade" },
  { href: "/settings", icon: Settings, label: "Configurações" },
] as const;
