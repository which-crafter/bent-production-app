import type { Lead, Project } from "./types";

export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    name: "John Smith",
    companyOrClient: "Acme Corp",
    status: "new",
    source: "Website",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-2",
    name: "Sarah Johnson",
    companyOrClient: "TechStart Inc",
    status: "contacted",
    source: "Referral",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-3",
    name: "Michael Chen",
    companyOrClient: "Design Studio",
    status: "qualified",
    source: "LinkedIn",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-4",
    name: "Emily Davis",
    companyOrClient: "Creative Agency",
    status: "lost",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-5",
    name: "David Wilson",
    companyOrClient: "Marketing Pro",
    status: "qualified",
    source: "Email Campaign",
    updatedAt: new Date().toISOString(),
  },
];

export const mockProjects: Project[] = [
  {
    id: "project-1",
    projectCode: "1000-25",
    name: "Website Redesign",
    clientName: "Acme Corp",
    status: "active",
    leadId: "lead-1",
  },
  {
    id: "project-2",
    projectCode: "1001-25",
    name: "Brand Identity",
    clientName: "TechStart Inc",
    status: "active",
    leadId: "lead-2",
  },
  {
    id: "project-3",
    projectCode: "1002-25",
    name: "Mobile App Design",
    clientName: "Design Studio",
    status: "on_hold",
    leadId: "lead-3",
  },
  {
    id: "project-4",
    projectCode: "1003-24",
    name: "Marketing Campaign",
    clientName: "Creative Agency",
    status: "closed",
    leadId: "lead-4",
  },
];

