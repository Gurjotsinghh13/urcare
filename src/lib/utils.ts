import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleBadgeColor(role?: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'doctor':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'nurse':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'manager':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'admitted':
      return { label: 'Admitted', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'discharge_eligible':
      return { label: 'Discharge Eligible', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'discharge_approved':
      return { label: 'Doctor Approved', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'discharged':
      return { label: 'Discharged (Recovered)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'deceased':
      return { label: 'Deceased', color: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200' };
  }
}
